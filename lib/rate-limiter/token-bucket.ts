import { mockRedis } from "./mock-redis";
import { RateLimitRequest, RateLimitResult } from "./types";

/**
 * Lua Script for Token Bucket Algorithm in Redis:
 *
 * KEYS[1]: rate_limit:tb:{tenantId}
 * ARGV[1]: capacity (requestsPerMinute + burstAllowance)
 * ARGV[2]: refillRatePerMs (requestsPerMinute / 60000)
 * ARGV[3]: now (timestamp ms)
 * ARGV[4]: requested tokens (1)
 */
export const TOKEN_BUCKET_LUA = `
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refill_rate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local requested = tonumber(ARGV[4]) or 1

local data = redis.call('HMGET', key, 'tokens', 'last_refill')
local tokens = tonumber(data[1])
local last_refill = tonumber(data[2])

if not tokens or not last_refill then
    tokens = capacity
    last_refill = now
else
    local elapsed = now - last_refill
    if elapsed > 0 then
        local added = elapsed * refill_rate
        tokens = math.min(capacity, tokens + added)
        last_refill = now
    end
end

local allowed = 0
local remaining = math.floor(tokens)
local retry_after_ms = 0

if tokens >= requested then
    allowed = 1
    tokens = tokens - requested
    remaining = math.floor(tokens)
    redis.call('HMSET', key, 'tokens', tokens, 'last_refill', last_refill)
    redis.call('PEXPIRE', key, 120000)
else
    allowed = 0
    local missing = requested - tokens
    retry_after_ms = math.ceil(missing / refill_rate)
    redis.call('HMSET', key, 'tokens', tokens, 'last_refill', last_refill)
    redis.call('PEXPIRE', key, 120000)
end

return { allowed, remaining, retry_after_ms }
`;

export async function checkTokenBucket(req: RateLimitRequest): Promise<RateLimitResult> {
  const start = performance.now();
  const now = Date.now();
  const capacity = req.requestsPerMinute + req.burstAllowance;
  const refillRatePerMs = req.requestsPerMinute / 60000.0;
  const key = `rate_limit:tb:${req.tenantId}`;

  // Execute in mock engine for local zero-config / tests
  const [allowedNum, remaining, retryAfterMs] = await mockRedis.executeAtomic(() =>
    mockRedis.evalTokenBucket(key, capacity, refillRatePerMs, now, 1)
  );

  const allowed = allowedNum === 1;
  const latencyMs = Number((performance.now() - start).toFixed(3));

  return {
    allowed,
    limit: capacity,
    remaining,
    resetMs: allowed ? 0 : retryAfterMs,
    retryAfterSec: Math.ceil(retryAfterMs / 1000),
    algorithm: "TOKEN_BUCKET",
    latencyMs,
  };
}
