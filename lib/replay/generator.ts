export interface SimulatedRequest {
  id: string;
  tenantId: string;
  tenantName: string;
  apiKeyHash: string;
  requestsPerMinute: number;
  burstAllowance: number;
  algorithm: "TOKEN_BUCKET" | "SLIDING_WINDOW";
  delayMs: number;
}

export type ReplayPattern = "NORMAL" | "SPIKY" | "OVERLIMIT" | "MIXED";

export function generateTrafficSequence(
  tenants: Array<{
    id: string;
    name: string;
    apiKeyHash: string;
    requestsPerMinute: number;
    burstAllowance: number;
    algorithm: "TOKEN_BUCKET" | "SLIDING_WINDOW";
  }>,
  pattern: ReplayPattern = "MIXED",
  totalEvents: number = 60
): SimulatedRequest[] {
  const sequence: SimulatedRequest[] = [];
  if (tenants.length === 0) return sequence;

  let currentTimeOffset = 0;

  for (let i = 0; i < totalEvents; i++) {
    const tenant = tenants[i % tenants.length];

    if (pattern === "NORMAL") {
      currentTimeOffset += 100 + Math.floor(Math.random() * 200); // 100-300ms gaps
    } else if (pattern === "SPIKY") {
      // 80% burst in first 10 steps, then quiet
      if (i % 15 < 10) {
        currentTimeOffset += 10 + Math.floor(Math.random() * 30); // 10-40ms rapid fire
      } else {
        currentTimeOffset += 800 + Math.floor(Math.random() * 500); // quiet pause
      }
    } else if (pattern === "OVERLIMIT") {
      currentTimeOffset += 5 + Math.floor(Math.random() * 15); // extreme 5-20ms rapid stream
    } else {
      // MIXED
      const isBurst = Math.random() < 0.3;
      currentTimeOffset += isBurst
        ? 15 + Math.floor(Math.random() * 40)
        : 150 + Math.floor(Math.random() * 250);
    }

    sequence.push({
      id: `req_${i + 1}_${Math.random().toString(36).substring(2, 7)}`,
      tenantId: tenant.id,
      tenantName: tenant.name,
      apiKeyHash: tenant.apiKeyHash,
      requestsPerMinute: tenant.requestsPerMinute,
      burstAllowance: tenant.burstAllowance,
      algorithm: tenant.algorithm,
      delayMs: currentTimeOffset,
    });
  }

  return sequence;
}
