import { mockRedis } from "./mock-redis";
import { RateLimitRequest, RateLimitResult } from "./types";

/**
 * Lua Script for Sliding Window Log Algorithm in Redis:
 *
 * KEYS[1]: rate_limit:sw:{tenantId}
 * ARGV[1]: limit (requestsPerMinute)
 * ARGV[2]: window_ms (60000)
 * ARGV[3]: now (timestamp ms)
 * ARGV[4]: request_id
 */
export const SLIDING_WINDOW_LUA = `
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local window_ms = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local member = ARGV[4]

redis.call('ZREMRANGEBYSCORE', key, '-inf', now - window_ms)
local current_count = redis.call('ZCARD', key)

local allowed = 0
local remaining = 0
local retry_after_ms = 0

if current_count < limit then
    allowed = 1
    redis.call('ZADD', key, now, member)
    remaining = limit - current_count - 1
    redis.call('PEXPIRE', key, window_ms * 2)
else
    allowed = 0
    remaining = 0
    local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
    if oldest and #oldest >= 2 then
        local oldest_ts = tonumber(oldest[2])
        retry_after_ms = math.max(0, (oldest_ts + window_ms) - now)
    else
        retry_after_ms = window_ms
    end
end

return { allowed, remaining, retry_after_ms }
`;

export async function checkSlidingWindow(req: RateLimitRequest): Promise<RateLimitResult> {
  const start = performance.now();
  const now = Date.now();
  const limit = req.requestsPerMinute; // Strict sustained limit for sliding window
  const windowMs = 60000;
  const member = `${now}-${Math.random().toString(36).substring(2, 8)}`;
  const key = `rate_limit:sw:${req.tenantId}`;

  const [allowedNum, remaining, retryAfterMs] = await mockRedis.executeAtomic(() =>
    mockRedis.evalSlidingWindow(key, limit, windowMs, now, member)
  );

  const allowed = allowedNum === 1;
  const latencyMs = Number((performance.now() - start).toFixed(3));

  return {
    allowed,
    limit,
    remaining,
    resetMs: allowed ? 0 : retryAfterMs,
    retryAfterSec: Math.ceil(retryAfterMs / 1000),
    algorithm: "SLIDING_WINDOW",
    latencyMs,
  };
}
