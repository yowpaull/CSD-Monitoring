/**
 * A small in-memory, sliding-window rate limiter for server actions.
 *
 * The app runs as a single Node process (`next start`), so a per-process
 * Map is enough to stop password-reset abuse: each key keeps the
 * timestamps of its recent hits and old hits fall out of the window.
 * Supabase enforces its own email limits as the second line of defence,
 * so this only has to blunt the obvious "spam the endpoint" behaviour.
 *
 * If the app is ever scaled to multiple instances or split across
 * lambdas, swap the Map for a shared store (Redis, Postgres) — the
 * call sites do not need to change.
 */

type RateLimitOptions = {
    /** Namespaced key, e.g. `password-reset:email:user@example.com`. */
    key: string;
    /** Maximum number of hits allowed inside the window. */
    limit: number;
    /** Window length in milliseconds. */
    windowMs: number;
};

export type RateLimitResult = {
    allowed: boolean;
    limit: number;
    remaining: number;
    /** Seconds until the caller may retry; 0 when allowed. */
    retryAfterSeconds: number;
};

const hits = new Map<string, number[]>();

// Keys are pruned lazily. A timestamp older than this cannot belong to
// any live window (every configured window is a few minutes), so it is
// safe to drop during a sweep.
const MAX_WINDOW_MS = 60 * 60 * 1000;
const SWEEP_INTERVAL_MS = 60 * 1000;
let lastSweep = 0;

function sweep(now: number) {
    if (now - lastSweep < SWEEP_INTERVAL_MS) return;
    lastSweep = now;

    const cutoff = now - MAX_WINDOW_MS;
    for (const [key, timestamps] of hits) {
        const live = timestamps.filter((timestamp) => timestamp > cutoff);
        if (live.length === 0) hits.delete(key);
        else hits.set(key, live);
    }
}

export function rateLimit({
    key,
    limit,
    windowMs,
}: RateLimitOptions): RateLimitResult {
    const now = Date.now();
    sweep(now);

    const windowStart = now - windowMs;
    const recent = (hits.get(key) ?? []).filter(
        (timestamp) => timestamp > windowStart
    );

    if (recent.length >= limit) {
        // Keep the surviving hits so the window keeps sliding.
        hits.set(key, recent);

        const retryAfterMs = recent[0] + windowMs - now;

        return {
            allowed: false,
            limit,
            remaining: 0,
            retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
        };
    }

    recent.push(now);
    hits.set(key, recent);

    return {
        allowed: true,
        limit,
        remaining: limit - recent.length,
        retryAfterSeconds: 0,
    };
}
