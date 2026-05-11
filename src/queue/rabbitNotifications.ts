import amqp, { Channel, ConsumeMessage } from "amqplib";
import { randomUUID } from "crypto";
import { PrismaClient } from "@prisma/logs-client";
import { EmailService } from "../services/twilioemailService.js";
import { WhatsAppService } from "../services/twiliowhatsappService.js";

export type NotificationJobType =
  | "email_send_dynamic_twilio"
  | "whatsapp_send_message_twilio";

export interface EmailDynamicQueuePayload {
  to: string | string[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: Array<{ filename: string; content: string }>;
  logContext?: {
    endpoint?: string;
    parameters?: Record<string, unknown>;
    templateName?: string;
  };
}

export interface WhatsAppTemplateQueuePayload {
  to: string;
  templateName: string;
  languageCode: string;
  components?: Array<{
    type: string;
    parameters?: Array<{
      type: string;
      text?: string;
      payload?: string;
      parameter_name?: string;
    }>;
    sub_type?: string;
    index?: number;
  }>;
  fromCredentials?: { phoneNumberId: string; accessToken: string };
}

type NotificationJobPayload =
  | EmailDynamicQueuePayload
  | WhatsAppTemplateQueuePayload;

interface NotificationJobMessage {
  jobId: string;
  type: NotificationJobType;
  payload: NotificationJobPayload;
  createdAt: string;
}

const logsPrisma = new PrismaClient();
let channel: Channel | null = null;
let setupPromise: Promise<Channel> | null = null;

const cfg = {
  url: process.env.RABBITMQ_URL || "amqp://127.0.0.1:5672",
  exchange: process.env.RABBITMQ_EXCHANGE || "netsight.notifications",
  retryExchange:
    process.env.RABBITMQ_RETRY_EXCHANGE || "netsight.notifications.retry",
  dlxExchange:
    process.env.RABBITMQ_DLX_EXCHANGE || "netsight.notifications.dlx",
  route: process.env.RABBITMQ_ROUTE || "notify.process",
  retryRoute: process.env.RABBITMQ_RETRY_ROUTE || "notify.retry",
  dlqRoute: process.env.RABBITMQ_DLQ_ROUTE || "notify.failed",
  queue: process.env.RABBITMQ_QUEUE || "netsight.notifications.main",
  retryQueue:
    process.env.RABBITMQ_RETRY_QUEUE || "netsight.notifications.retry",
  dlq: process.env.RABBITMQ_DLQ || "netsight.notifications.dlq",
  maxRetries: Number(process.env.RABBITMQ_MAX_RETRIES || 3),
  prefetch: Number(process.env.RABBITMQ_PREFETCH || 10),
  retryDelays: String(
    process.env.RABBITMQ_RETRY_DELAYS_MS || "5000,30000,120000",
  )
    .split(",")
    .map((v) => Number(v.trim()))
    .filter((v) => Number.isFinite(v) && v >= 0),
};

export function isRabbitEnabled(): boolean {
  return (
    process.env.RABBITMQ_ENABLED === "true" ||
    process.env.RABBITMQ_ENABLED === "1"
  );
}

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value ?? {});
  } catch {
    return JSON.stringify({ fallback: "serialization_failed" });
  }
}

function deriveMeta(type: NotificationJobType): {
  channel: string;
  endpoint: string;
} {
  if (type === "email_send_dynamic_twilio") {
    return {
      channel: "email",
      endpoint: "api-twilio/email/send-dynamic-twilio",
    };
  }
  return {
    channel: "whatsapp",
    endpoint: "api-twilio/whatsapp/send-message-twilio",
  };
}

async function trackQueued(job: NotificationJobMessage): Promise<void> {
  const meta = deriveMeta(job.type);
  await logsPrisma.notificationJobTracking.create({
    data: {
      job_id: job.jobId,
      job_type: job.type,
      channel: meta.channel,
      endpoint: meta.endpoint,
      status: "queued",
      attempts: 0,
      max_attempts: cfg.maxRetries,
      request_payload: safeJson(job.payload),
    },
  });
}

async function trackProcessing(jobId: string, attempts: number): Promise<void> {
  await logsPrisma.notificationJobTracking.update({
    where: { job_id: jobId },
    data: {
      status: "processing",
      attempts,
      last_error: null,
    },
  });
}

async function trackSucceeded(
  jobId: string,
  attempts: number,
  response: unknown,
): Promise<void> {
  await logsPrisma.notificationJobTracking.update({
    where: { job_id: jobId },
    data: {
      status: "succeeded",
      attempts,
      response_payload: safeJson(response),
      processed_at: new Date(),
      next_retry_at: null,
    },
  });
}

async function trackRetry(
  jobId: string,
  attempts: number,
  error: unknown,
  delayMs: number,
): Promise<void> {
  await logsPrisma.notificationJobTracking.update({
    where: { job_id: jobId },
    data: {
      status: "retrying",
      attempts,
      last_error: safeJson(error),
      next_retry_at: new Date(Date.now() + delayMs),
    },
  });
}

async function trackDead(
  jobId: string,
  attempts: number,
  error: unknown,
): Promise<void> {
  await logsPrisma.notificationJobTracking.update({
    where: { job_id: jobId },
    data: {
      status: "dead",
      attempts,
      last_error: safeJson(error),
      processed_at: new Date(),
      next_retry_at: null,
    },
  });
}

async function setupChannel(): Promise<Channel> {
  if (channel) return channel;
  if (setupPromise) return setupPromise;

  setupPromise = (async () => {
    const conn = await amqp.connect(cfg.url);
    conn.on("error", (err) => {
      console.error("RabbitMQ connection error:", err);
    });

    conn.on("close", () => {
      channel = null;
      setupPromise = null;
      setTimeout(() => setupChannel(), 5000); // auto reconnect
    });

    const ch = await conn.createChannel();
    await ch.assertExchange(cfg.exchange, "direct", { durable: true });
    await ch.assertExchange(cfg.retryExchange, "direct", { durable: true });
    await ch.assertExchange(cfg.dlxExchange, "direct", { durable: true });

    await ch.assertQueue(cfg.queue, {
      durable: true,
    });
    await ch.assertQueue(cfg.retryQueue, {
      durable: true,
      arguments: {
        "x-dead-letter-exchange": cfg.exchange,
        "x-dead-letter-routing-key": cfg.route,
      },
    });
    await ch.assertQueue(cfg.dlq, { durable: true });

    await ch.bindQueue(cfg.queue, cfg.exchange, cfg.route);
    await ch.bindQueue(cfg.retryQueue, cfg.retryExchange, cfg.retryRoute);
    await ch.bindQueue(cfg.dlq, cfg.dlxExchange, cfg.dlqRoute);
    await ch.prefetch(cfg.prefetch);

    channel = ch;
    return ch;
  })();

  return setupPromise;
}

export async function publishNotificationJob(
  type: NotificationJobType,
  payload: NotificationJobPayload,
): Promise<{ queued: boolean; jobId?: string; message?: string }> {
  if (!isRabbitEnabled()) {
    return { queued: false, message: "RabbitMQ disabled" };
  }

  const ch = await setupChannel();
  const job: NotificationJobMessage = {
    jobId: randomUUID(),
    type,
    payload,
    createdAt: new Date().toISOString(),
  };

  try {
    await trackQueued(job);
  } catch (dbError) {
    console.error("DB tracking failed, aborting publish:", dbError);
    throw dbError;
  }

  const ok = ch.publish(
    cfg.exchange,
    cfg.route,
    Buffer.from(JSON.stringify(job), "utf-8"),
    {
      persistent: true,
      contentType: "application/json",
      headers: {
        "x-job-id": job.jobId,
        "x-attempts": 0,
      },
    },
  );

  if (!ok) {
    throw new Error("RabbitMQ publish backpressure");
  }

  return { queued: true, jobId: job.jobId };
}

async function processJob(job: NotificationJobMessage): Promise<unknown> {
  if (job.type === "whatsapp_send_message_twilio") {
    const p = job.payload as WhatsAppTemplateQueuePayload;
    const res = await WhatsAppService.sendTemplate(
      p.to,
      p.templateName,
      p.languageCode,
      p.components,
      p.fromCredentials,
    );
    if (!res.ok) throw res.error ?? new Error("WhatsApp send failed");
    return res;
  }

  const p = job.payload as EmailDynamicQueuePayload;
  const res = await EmailService.sendEmail(
    p.to,
    p.subject,
    p.htmlContent,
    p.textContent,
    p.cc,
    p.bcc,
    p.attachments,
    p.logContext,
  );
  if (!res.ok) throw res.error ?? new Error("Email send failed");
  return res;
}

function getRetryDelay(attempt: number): number {
  if (cfg.retryDelays.length === 0) return 5000;
  const idx = Math.max(0, Math.min(attempt - 1, cfg.retryDelays.length - 1));
  return cfg.retryDelays[idx];
}

export async function startNotificationConsumer(): Promise<void> {
  if (!isRabbitEnabled()) return;
  const ch = await setupChannel();

  await ch.consume(
    cfg.queue,
    async (msg: ConsumeMessage | null) => {
      if (!msg) return;

      const raw = msg.content.toString("utf-8");
      const headers = (msg.properties.headers || {}) as Record<string, unknown>;
      const attempts = Number(headers["x-attempts"] ?? 0);

      let parsed: NotificationJobMessage | null = null;
      try {
        parsed = JSON.parse(raw) as NotificationJobMessage;
        await trackProcessing(parsed.jobId, attempts);
        const response = await processJob(parsed);
        await trackSucceeded(parsed.jobId, attempts, response);
        ch.ack(msg);
      } catch (error) {
        if (!parsed) {
          ch.ack(msg);
          return;
        }

        const nextAttempt = attempts + 1;
        if (nextAttempt <= cfg.maxRetries) {
          const delayMs = getRetryDelay(nextAttempt);
          await trackRetry(parsed.jobId, nextAttempt, error, delayMs);
          ch.publish(
            cfg.retryExchange,
            cfg.retryRoute,
            Buffer.from(JSON.stringify(parsed), "utf-8"),
            {
              persistent: true,
              expiration: String(delayMs),
              headers: {
                "x-job-id": parsed.jobId,
                "x-attempts": nextAttempt,
              },
            },
          );
        } else {
          await trackDead(parsed.jobId, nextAttempt, error);
          ch.publish(
            cfg.dlxExchange,
            cfg.dlqRoute,
            Buffer.from(JSON.stringify(parsed), "utf-8"),
            {
              persistent: true,
              headers: {
                "x-job-id": parsed.jobId,
                "x-attempts": nextAttempt,
              },
            },
          );
        }
        ch.ack(msg);
      }
    },
    { noAck: false },
  );

  console.log(`RabbitMQ consumer started. queue=${cfg.queue}, dlq=${cfg.dlq}`);
}
