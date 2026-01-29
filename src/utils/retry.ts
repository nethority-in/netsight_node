  // Retry logic with exponential backoff for email/WhatsApp API calls.
  // Retries on transient errors: 5xx, ECONNRESET, ETIMEDOUT, ENOTFOUND.


export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  // Return true if error is retryable
  isRetryable?: (error: unknown) => boolean;
}

const defaultIsRetryable = (error: unknown): boolean => {
  if (error && typeof error === 'object') {
    const err = error as Record<string, unknown>;
    const status = (err.statusCode ?? err.StatusCode ?? (err.response as { status?: number } | undefined)?.status) as number | undefined;
    if (typeof status === 'number' && status >= 500 && status < 600) return true;
  }
  if (error instanceof Error && (error as NodeJS.ErrnoException).code) {
    const code = (error as NodeJS.ErrnoException).code;
    if (['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNREFUSED'].includes(code ?? '')) return true;
  }
  if (error && typeof (error as { response?: { status?: number } }).response?.status === 'number') {
    const status = (error as { response: { status: number } }).response.status;
    if (status >= 500 && status < 600) return true;
  }
  return false;
};

  // Execute an async function with retries and exponential backoff.

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelayMs = 1000,
    maxDelayMs = 10000,
    backoffMultiplier = 2,
    isRetryable = defaultIsRetryable,
  } = options;

  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts || !isRetryable(error)) {
        throw error;
      }
      const delay = Math.min(
        initialDelayMs * Math.pow(backoffMultiplier, attempt - 1),
        maxDelayMs
      );
      console.warn(`Retry attempt ${attempt}/${maxAttempts} after ${delay}ms:`, error instanceof Error ? error.message : error);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError;
}
