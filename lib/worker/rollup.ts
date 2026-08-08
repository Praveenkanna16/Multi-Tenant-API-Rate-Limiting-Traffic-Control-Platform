import { db } from "@/lib/db";

export interface RollupResult {
  hourBucket: string;
  processedEvents: number;
  tenantsUpdated: number;
  durationMs: number;
}

/**
 * Idempotent hourly rollup job.
 * Scans UsageEvent raw table for a given hour (defaults to current hour or specific Date),
 * aggregates per tenant, and upserts into UsageRollup table.
 */
export async function runUsageRollup(targetDate: Date = new Date()): Promise<RollupResult> {
  const startTimer = performance.now();

  // Normalize target date to the start of the hour (00:00.000)
  const hourBucket = new Date(targetDate);
  hourBucket.setMinutes(0, 0, 0);

  const hourEnd = new Date(hourBucket);
  hourEnd.setHours(hourEnd.getHours() + 1);

  // Fetch events for this hour
  const rawEvents = await db.usageEvent.findMany({
    where: {
      timestamp: {
        gte: hourBucket,
        lt: hourEnd,
      },
    },
    select: {
      tenantId: true,
      allowed: true,
      latencyMs: true,
    },
  });

  if (rawEvents.length === 0) {
    return {
      hourBucket: hourBucket.toISOString(),
      processedEvents: 0,
      tenantsUpdated: 0,
      durationMs: Number((performance.now() - startTimer).toFixed(2)),
    };
  }

  // Aggregate by tenantId
  const aggregations = new Map<
    string,
    { allowedCount: number; deniedCount: number; totalLatencyMs: number; count: number }
  >();

  for (const ev of rawEvents) {
    const agg = aggregations.get(ev.tenantId) || {
      allowedCount: 0,
      deniedCount: 0,
      totalLatencyMs: 0,
      count: 0,
    };

    if (ev.allowed) {
      agg.allowedCount += 1;
    } else {
      agg.deniedCount += 1;
    }
    agg.totalLatencyMs += ev.latencyMs;
    agg.count += 1;

    aggregations.set(ev.tenantId, agg);
  }

  // Idempotently upsert rollups
  let updatedCount = 0;
  for (const [tenantId, agg] of aggregations.entries()) {
    const avgLatencyMs = Number((agg.totalLatencyMs / agg.count).toFixed(2));

    await db.usageRollup.upsert({
      where: {
        tenantId_hourBucket: {
          tenantId,
          hourBucket,
        },
      },
      update: {
        allowedCount: agg.allowedCount,
        deniedCount: agg.deniedCount,
        avgLatencyMs: avgLatencyMs,
      },
      create: {
        tenantId,
        hourBucket,
        allowedCount: agg.allowedCount,
        deniedCount: agg.deniedCount,
        avgLatencyMs: avgLatencyMs,
      },
    });
    updatedCount++;
  }

  const durationMs = Number((performance.now() - startTimer).toFixed(2));
  return {
    hourBucket: hourBucket.toISOString(),
    processedEvents: rawEvents.length,
    tenantsUpdated: updatedCount,
    durationMs,
  };
}
