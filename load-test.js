import axios from 'axios';

const BASE_URL = 'http://localhost:3002';
const TOTAL_REQUESTS = 500;
const CONCURRENCY = 20;

async function sendWhatsApp(index) {
  try {
    const res = await axios.post(`${BASE_URL}/api-twilio/whatsapp/send-message-twilio`, {
      to: `+91900000${String(index).padStart(4, '0')}`,
      templateName: 'test_template',
      languageCode: 'en',
    });
    return { index, ok: true, status: res.status, jobId: res.data?.data?.jobId };
  } catch (err) {
    const status = err.response?.status;
    const data = err.response?.data;
    return { index, ok: false, status, error: data?.error?.message || err.message };
  }
}

async function sendEmail(index) {
  try {
    const res = await axios.post(`${BASE_URL}/api-twilio/email/send-dynamic-twilio`, {
      to: `testuser${index}@example.com`,
      subject: `Load Test Email ${index}`,
      templateName: 'ns_temp_Notification_temp2',
      variables: {
        StoreName: 'Test Store',
        Revenue: '1,00,000',
        Orders: '50',
      },
    });
    return { index, ok: true, status: res.status, jobId: res.data?.data?.jobId };
  } catch (err) {
    const status = err.response?.status;
    const data = err.response?.data;
    return { index, ok: false, status, error: data?.error?.message || err.message };
  }
}

async function runBatch(fn, total, concurrency, label) {
  console.log(`\n=== ${label}: ${total} requests, concurrency ${concurrency} ===`);
  let completed = 0;
  let success = 0;
  let failed = 0;
  let rateLimited = 0;
  const startTime = Date.now();

  for (let i = 0; i < total; i += concurrency) {
    const batch = [];
    for (let j = i; j < Math.min(i + concurrency, total); j++) {
      batch.push(fn(j));
    }
    const results = await Promise.all(batch);
    results.forEach((r) => {
      completed++;
      if (r.ok) success++;
      else if (r.status === 429) rateLimited++;
      else failed++;
    });

    // Progress every 100
    if (completed % 100 === 0) {
      console.log(`  [${completed}/${total}] success=${success} failed=${failed} rateLimited=${rateLimited}`);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`=== ${label} DONE in ${elapsed}s: ${success} queued, ${failed} failed, ${rateLimited} rate-limited ===\n`);
  return { success, failed, rateLimited };
}

(async () => {
  console.log('='.repeat(60));
  console.log('  RABBITMQ LOAD TEST - 500 WhatsApp + 500 Email');
  console.log('  DRY_RUN_MODE=true (no real messages sent)');
  console.log('='.repeat(60));

  const wa = await runBatch(sendWhatsApp, TOTAL_REQUESTS, CONCURRENCY, 'WhatsApp');
  const em = await runBatch(sendEmail, TOTAL_REQUESTS, CONCURRENCY, 'Email');

  console.log('='.repeat(60));
  console.log('  PUBLISH RESULTS:');
  console.log(`  WhatsApp: ${wa.success} queued, ${wa.failed} failed, ${wa.rateLimited} rate-limited`);
  console.log(`  Email:    ${em.success} queued, ${em.failed} failed, ${em.rateLimited} rate-limited`);
  console.log(`  Total queued: ${wa.success + em.success} / 1000`);
  console.log('='.repeat(60));
  console.log('\n  Now wait for retries to complete (retry delays: 1s, 2s, 3s).');
  console.log('  After ~10 seconds, check DB:');
  console.log('    SELECT status, COUNT(*) FROM notification_job_tracking GROUP BY status;');
})();
