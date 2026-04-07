/**
 * lib/rateLimit.ts
 *
 * In-memory sliding-window rate limiter.
 *
 * ⚠️  Serverless caveat: state lives only in a single function instance.
 *    On Vercel, multiple warm instances won't share this Map.
 *    For shared/distributed rate limiting, replace with Upstash Redis (@vercel/kv).
 *    This still provides meaningful protection against simple brute-force on a
 *    single instance and is sufficient for a development/small-scale environment.
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes to prevent unbounded memory growth.
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      // If the oldest timestamp is > 1 hour old, remove the entry entirely.
      if (entry.timestamps.length === 0 || now - entry.timestamps[0] > 60 * 60 * 1000) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitOptions {
  /** Max number of requests allowed within windowMs. */
  maxRequests: number;
  /** Duration of the sliding window in milliseconds. */
  windowMs: number;
}

export interface RateLimitResult {
  limited: boolean;
  remaining: number;
  resetInMs: number;
}

/**
 * Check whether `key` (typically an IP address) has exceeded the rate limit.
 *
 * @example
 *   const result = checkRateLimit(ip, { maxRequests: 10, windowMs: 15 * 60 * 1000 });
 *   if (result.limited) return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
 */
export function checkRateLimit(
  key: string,
  options: RateLimitOptions,
): RateLimitResult {
  const { maxRequests, windowMs } = options;
  const now = Date.now();
  const windowStart = now - windowMs;

  // Get or create entry for this key
  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Drop timestamps outside the current window (sliding window)
  entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);

  const count = entry.timestamps.length;

  if (count >= maxRequests) {
    // Oldest request in window — once it slides out the window resets
    const resetInMs = entry.timestamps[0] + windowMs - now;
    return { limited: true, remaining: 0, resetInMs };
  }

  // Record this request
  entry.timestamps.push(now);

  return {
    limited: false,
    remaining: maxRequests - count - 1,
    resetInMs: windowMs,
  };
}
