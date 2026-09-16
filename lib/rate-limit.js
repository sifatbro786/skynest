/**
 * In-memory fixed-window rate limiter.
 *
 * Scope note: state lives in this Node process. That is the right trade for a
 * single-owner site on one VPS, but it means PM2 must run in **fork mode**
 * (one instance) — in cluster mode each worker keeps its own counters and the
 * effective limit multiplies by the worker count. See docs/DEPLOY.md.
 *
 * No setInterval: a timer in a module keeps the process alive and duplicates
 * on every dev hot-reload. Expired buckets are swept opportunistically.
 */

const globalForLimiter = globalThis;

if (!globalForLimiter.__skynestRateLimit) {
  globalForLimiter.__skynestRateLimit = { buckets: new Map(), calls: 0 };
}

const store = globalForLimiter.__skynestRateLimit;

const SWEEP_EVERY = 200;
const MAX_BUCKETS = 10_000;

function sweep(now) {
  for (const [key, bucket] of store.buckets) {
    if (bucket.resetAt <= now) store.buckets.delete(key);
  }
  // Hard ceiling in case of a distributed flood — drop the oldest entries
  // rather than letting the map grow without bound.
  if (store.buckets.size > MAX_BUCKETS) {
    const excess = store.buckets.size - MAX_BUCKETS;
    let i = 0;
    for (const key of store.buckets.keys()) {
      if (i >= excess) break;
      store.buckets.delete(key);
      i += 1;
    }
  }
}

/**
 * @param {string} key
 * @param {{ limit: number, windowMs: number }} opts
 * @returns {{ ok: boolean, remaining: number, retryAfter: number }}
 *   retryAfter is in seconds.
 */
export function rateLimit(key, { limit, windowMs }) {
  const now = Date.now();

  store.calls += 1;
  if (store.calls % SWEEP_EVERY === 0) sweep(now);

  const bucket = store.buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    store.buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }

  bucket.count += 1;

  if (bucket.count > limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  return { ok: true, remaining: limit - bucket.count, retryAfter: 0 };
}

/** Clears a bucket — call it after a successful login so one typo'd password
 *  does not eat into the allowance for the rest of the window. */
export function resetRateLimit(key) {
  store.buckets.delete(key);
}

/**
 * Best-effort client IP.
 *
 * Behind nginx this requires `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;`
 * — without it every request looks like 127.0.0.1 and all visitors share one
 * bucket. The left-most entry is the original client.
 */
export function clientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}
