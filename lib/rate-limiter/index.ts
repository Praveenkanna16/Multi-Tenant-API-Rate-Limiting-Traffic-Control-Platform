import { checkTokenBucket, TOKEN_BUCKET_LUA } from "./token-bucket";
import { checkSlidingWindow, SLIDING_WINDOW_LUA } from "./sliding-window";
import { RateLimitRequest, RateLimitResult } from "./types";

export class RateLimiter {
  /**
   * Main entry point to check rate limit for a request.
   * Supports fail-open (default) vs fail-closed strategies for production resilience.
   */
  public async check(req: RateLimitRequest): Promise<RateLimitResult> {
    const strategy = process.env.FAIL_STRATEGY || "OPEN";
    try {
      if (req.algorithm === "TOKEN_BUCKET") {
        return await checkTokenBucket(req);
      } else {
        return await checkSlidingWindow(req);
      }
    } catch (error) {
      console.error("[RateLimiter] Error during rate limit execution:", error);
      const isFailOpen = strategy === "OPEN";
      return {
        allowed: isFailOpen,
        limit: req.requestsPerMinute,
        remaining: isFailOpen ? req.requestsPerMinute : 0,
        resetMs: 0,
        retryAfterSec: isFailOpen ? 0 : 60,
        algorithm: req.algorithm,
        latencyMs: 0,
        failOpen: isFailOpen,
      };
    }
  }

  /**
   * Converts RateLimitResult to standard HTTP headers for gateway response.
   */
  public getHeaders(result: RateLimitResult): Record<string, string> {
    const headers: Record<string, string> = {
      "X-RateLimit-Limit": result.limit.toString(),
      "X-RateLimit-Remaining": Math.max(0, result.remaining).toString(),
      "X-RateLimit-Reset": (Math.ceil(Date.now() / 1000) + Math.ceil(result.resetMs / 1000)).toString(),
      "X-RateLimit-Algorithm": result.algorithm,
      "X-RateLimit-Latency-Ms": result.latencyMs.toString(),
    };

    if (!result.allowed) {
      headers["Retry-After"] = Math.max(1, result.retryAfterSec).toString();
    }

    if (result.failOpen) {
      headers["X-RateLimit-Degraded"] = "true";
    }

    return headers;
  }
}

export const rateLimiter = new RateLimiter();
export { TOKEN_BUCKET_LUA, SLIDING_WINDOW_LUA };
export * from "./types";
