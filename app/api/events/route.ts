import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get("tenantId");
    const allowed = searchParams.get("allowed");
    const algorithm = searchParams.get("algorithm");
    const search = searchParams.get("search");
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 50));
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (tenantId && tenantId !== "ALL") {
      where.tenantId = tenantId;
    }

    if (allowed === "true") {
      where.allowed = true;
    } else if (allowed === "false") {
      where.allowed = false;
    }

    if (algorithm && algorithm !== "ALL") {
      where.algorithm = algorithm;
    }

    if (search) {
      where.OR = [
        { id: { contains: search } },
        { reason: { contains: search } },
        { tenant: { name: { contains: search } } },
      ];
    }

    const [events, total] = await Promise.all([
      db.usageEvent.findMany({
        where,
        take: limit,
        skip,
        orderBy: { timestamp: "desc" },
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              plan: true,
              apiKey: true,
            },
          },
        },
      }),
      db.usageEvent.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      events: events.map((e) => ({
        id: e.id,
        tenantId: e.tenantId,
        tenantName: e.tenant.name,
        tenantPlan: e.tenant.plan,
        tenantApiKey: e.tenant.apiKey,
        allowed: e.allowed,
        algorithm: e.algorithm,
        latencyMs: e.latencyMs,
        reason: e.reason || (e.allowed ? "OK" : "RATE_LIMIT_EXCEEDED"),
        timestamp: e.timestamp,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[API Events GET] Error:", error);
    return NextResponse.json({ error: "Failed to fetch request events" }, { status: 500 });
  }
}
