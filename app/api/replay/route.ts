import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { generateTrafficSequence, ReplayPattern } from "@/lib/replay/generator";
import { rateLimiter, Algorithm } from "@/lib/rate-limiter";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const pattern: ReplayPattern = body.pattern || "MIXED";
  const totalEvents = Number(body.totalEvents) || 60;

  const tenants = await db.tenant.findMany({
    select: {
      id: true,
      name: true,
      apiKeyHash: true,
      requestsPerMinute: true,
      burstAllowance: true,
      algorithm: true,
    },
  });

  if (tenants.length === 0) {
    return new Response(JSON.stringify({ error: "No tenants found to run traffic replay." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const sequence = generateTrafficSequence(
    tenants.map((t) => ({ ...t, algorithm: t.algorithm as Algorithm })),
    pattern,
    totalEvents
  );

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial metadata event
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: "INIT", pattern, totalEvents, count: sequence.length })}\n\n`
        )
      );

      for (let i = 0; i < sequence.length; i++) {
        const item = sequence[i];

        // Perform live rate-limit check
        const result = await rateLimiter.check({
          tenantId: item.tenantId,
          requestsPerMinute: item.requestsPerMinute,
          burstAllowance: item.burstAllowance,
          algorithm: item.algorithm,
        });

        // Fire & forget event log to DB
        db.usageEvent
          .create({
            data: {
              tenantId: item.tenantId,
              allowed: result.allowed,
              algorithm: item.algorithm,
              latencyMs: result.latencyMs,
              reason: result.allowed ? "REPLAY_ALLOW" : "REPLAY_DENY",
            },
          })
          .catch(() => {});

        const eventData = {
          type: "EVENT",
          step: i + 1,
          total: sequence.length,
          requestId: item.id,
          tenantId: item.tenantId,
          tenantName: item.tenantName,
          algorithm: item.algorithm,
          allowed: result.allowed,
          remaining: result.remaining,
          limit: result.limit,
          resetMs: result.resetMs,
          retryAfterSec: result.retryAfterSec,
          latencyMs: result.latencyMs,
          timestamp: new Date().toISOString(),
        };

        controller.enqueue(encoder.encode(`data: ${JSON.stringify(eventData)}\n\n`));

        // Sleep based on sequence delay or minimum gap for visibility
        const delay = Math.min(250, i > 0 ? sequence[i].delayMs - sequence[i - 1].delayMs : 100);
        await new Promise((res) => setTimeout(res, Math.max(30, delay)));
      }

      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "COMPLETE" })}\n\n`));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
