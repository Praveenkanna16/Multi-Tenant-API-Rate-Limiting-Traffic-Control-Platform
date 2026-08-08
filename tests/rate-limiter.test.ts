import { describe, it, expect, beforeEach } from "vitest";
import { checkTokenBucket } from "../lib/rate-limiter/token-bucket";
import { checkSlidingWindow } from "../lib/rate-limiter/sliding-window";
import { mockRedis } from "../lib/rate-limiter/mock-redis";

describe("QuotaForge Rate Limiter Engines", () => {
  beforeEach(() => {
    mockRedis.reset();
  });

  describe("Token Bucket Algorithm", () => {
    it("should allow requests up to capacity and deny when bucket is empty", async () => {
      const req = {
        tenantId: "tenant_tb_test",
        requestsPerMinute: 5,
        burstAllowance: 2, // Total capacity = 7
        algorithm: "TOKEN_BUCKET" as const,
      };

      // Fire 7 requests - all should be allowed
      for (let i = 0; i < 7; i++) {
        const res = await checkTokenBucket(req);
        expect(res.allowed).toBe(true);
        expect(res.remaining).toBe(6 - i);
      }

      // 8th request should be denied
      const resDenied = await checkTokenBucket(req);
      expect(resDenied.allowed).toBe(false);
      expect(resDenied.remaining).toBe(0);
      expect(resDenied.retryAfterSec).toBeGreaterThan(0);
    });
  });

  describe("Sliding Window Log Algorithm", () => {
    it("should strictly cap requests at sustained limit within sliding window", async () => {
      const req = {
        tenantId: "tenant_sw_test",
        requestsPerMinute: 3,
        burstAllowance: 0,
        algorithm: "SLIDING_WINDOW" as const,
      };

      // Fire 3 requests - allowed
      for (let i = 0; i < 3; i++) {
        const res = await checkSlidingWindow(req);
        expect(res.allowed).toBe(true);
      }

      // 4th request - denied
      const resDenied = await checkSlidingWindow(req);
      expect(resDenied.allowed).toBe(false);
      expect(resDenied.retryAfterSec).toBeGreaterThan(0);
    });
  });

  describe("Concurrency & Race Condition Verification", () => {
    it("should handle 50 simultaneous concurrent requests with zero race conditions", async () => {
      const req = {
        tenantId: "tenant_concurrent_test",
        requestsPerMinute: 10,
        burstAllowance: 5, // Total 15
        algorithm: "TOKEN_BUCKET" as const,
      };

      // Fire 50 requests concurrently in parallel using Promise.all
      const promises = Array.from({ length: 50 }).map(() => checkTokenBucket(req));
      const results = await Promise.all(promises);

      const allowedCount = results.filter((r) => r.allowed).length;
      const deniedCount = results.filter((r) => !r.allowed).length;

      // Exactly 15 allowed, 35 denied! Zero over-allocation!
      expect(allowedCount).toBe(15);
      expect(deniedCount).toBe(35);
    });
  });
});
