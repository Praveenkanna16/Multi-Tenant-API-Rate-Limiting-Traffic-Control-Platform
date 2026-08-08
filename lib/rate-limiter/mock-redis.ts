/**
 * In-Memory Atomic Engine simulating Redis Lua execution single-threaded lock guarantees.
 * Enables zero-dependency local execution, unit testing, and benchmarking with identical atomicity.
 */

class MockRedisStore {
  private hashStore = new Map<string, Record<string, any>>();
  private zsetStore = new Map<string, Array<{ score: number; member: string }>>();
  private lockPromise: Promise<void> = Promise.resolve();

  // Guarantees atomic sequential execution like Redis single thread
  public async executeAtomic<T>(fn: () => T): Promise<T> {
    let resolver: () => void;
    const nextLock = new Promise<void>((res) => {
      resolver = res;
    });

    const currentLock = this.lockPromise;
    this.lockPromise = nextLock;

    await currentLock;
    try {
      return fn();
    } finally {
      resolver!();
    }
  }

  // Token Bucket Execution
  public evalTokenBucket(
    key: string,
    capacity: number,
    refillRatePerMs: number,
    now: number,
    requested: number = 1
  ): [number, number, number] {
    let data = this.hashStore.get(key);
    let tokens: number;
    let lastRefill: number;

    if (!data) {
      tokens = capacity;
      lastRefill = now;
    } else {
      tokens = Number(data.tokens);
      lastRefill = Number(data.last_refill);
      const elapsed = now - lastRefill;
      if (elapsed > 0) {
        const added = elapsed * refillRatePerMs;
        tokens = Math.min(capacity, tokens + added);
        lastRefill = now;
      }
    }

    let allowed = 0;
    let remaining = Math.floor(tokens);
    let retryAfterMs = 0;

    if (tokens >= requested) {
      allowed = 1;
      tokens -= requested;
      remaining = Math.floor(tokens);
      this.hashStore.set(key, { tokens, last_refill: lastRefill });
    } else {
      allowed = 0;
      const missing = requested - tokens;
      retryAfterMs = Math.ceil(missing / refillRatePerMs);
      this.hashStore.set(key, { tokens, last_refill: lastRefill });
    }

    return [allowed, remaining, retryAfterMs];
  }

  // Sliding Window Execution
  public evalSlidingWindow(
    key: string,
    limit: number,
    windowMs: number,
    now: number,
    member: string
  ): [number, number, number] {
    let zset = this.zsetStore.get(key) || [];

    // Filter out items older than now - windowMs
    const minTime = now - windowMs;
    zset = zset.filter((item) => item.score > minTime);

    let allowed = 0;
    let remaining = 0;
    let retryAfterMs = 0;

    if (zset.length < limit) {
      allowed = 1;
      zset.push({ score: now, member });
      // Keep sorted by score
      zset.sort((a, b) => a.score - b.score);
      this.zsetStore.set(key, zset);
      remaining = limit - zset.length;
    } else {
      allowed = 0;
      remaining = 0;
      zset.sort((a, b) => a.score - b.score);
      const oldest = zset[0];
      if (oldest) {
        retryAfterMs = Math.max(0, oldest.score + windowMs - now);
      } else {
        retryAfterMs = windowMs;
      }
      this.zsetStore.set(key, zset);
    }

    return [allowed, remaining, retryAfterMs];
  }

  public reset() {
    this.hashStore.clear();
    this.zsetStore.clear();
  }

  public getKeyCount(): number {
    return this.hashStore.size + this.zsetStore.size;
  }
}

export const mockRedis = new MockRedisStore();

