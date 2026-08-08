import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const totalTenants = await db.tenant.count();
    const recentEvents = await db.usageEvent.findMany({
      take: 100,
      orderBy: { timestamp: "desc" },
      include: { tenant: { select: { name: true, plan: true } } },
    });

    const totalEventsCount = await db.usageEvent.count();
    const allowedCount = await db.usageEvent.count({ where: { allowed: true } });
    const deniedCount = await db.usageEvent.count({ where: { allowed: false } });

    const rollups = await db.usageRollup.findMany({
      orderBy: { hourBucket: "asc" },
      include: { tenant: { select: { name: true } } },
    });

    // Group rollups by hour for charts
    const hourlyMap = new Map<string, { hour: string; allowed: number; denied: number; total: number }>();

    for (const r of rollups) {
      const hourStr = new Date(r.hourBucket).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const existing = hourlyMap.get(hourStr) || { hour: hourStr, allowed: 0, denied: 0, total: 0 };

      existing.allowed += r.allowedCount;
      existing.denied += r.deniedCount;
      existing.total += r.allowedCount + r.deniedCount;

      hourlyMap.set(hourStr, existing);
    }

    const hourlyChartData = Array.from(hourlyMap.values());

    return NextResponse.json({
      success: true,
      summary: {
        totalTenants,
        totalEventsCount,
        allowedCount,
        deniedCount,
        denyRatePercent: totalEventsCount > 0 ? Number(((deniedCount / totalEventsCount) * 100).toFixed(1)) : 0,
      },
      hourlyChartData,
      recentEvents: recentEvents.map((e) => ({
        id: e.id,
        tenantName: e.tenant.name,
        tenantPlan: e.tenant.plan,
        allowed: e.allowed,
        algorithm: e.algorithm,
        latencyMs: e.latencyMs,
        timestamp: e.timestamp,
      })),
    });
  } catch (error) {
    console.error("[API Stats GET] Error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
