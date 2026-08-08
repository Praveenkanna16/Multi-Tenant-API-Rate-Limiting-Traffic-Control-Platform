export type Algorithm = "TOKEN_BUCKET" | "SLIDING_WINDOW";

export interface RateLimitRequest {
  tenantId: string;
  requestsPerMinute: number;
  burstAllowance: number;
  algorithm: Algorithm;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetMs: number;
  retryAfterSec: number;
  algorithm: Algorithm;
  latencyMs: number;
  failOpen?: boolean;
}

export interface RateLimiterEngine {
  check(req: RateLimitRequest): Promise<RateLimitResult>;
}
