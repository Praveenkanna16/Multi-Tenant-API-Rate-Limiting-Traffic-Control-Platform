import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashApiKey } from "@/lib/auth";
import { rateLimiter, Algorithm } from "@/lib/rate-limiter";

async function handleGatewayRequest(req: NextRequest, { params }: { params: { path: string[] } }) {
  const start = performance.now();

  // Extract API key from x-api-key or Authorization Bearer header
  const apiKeyHeader = req.headers.get("x-api-key");
  const authHeader = req.headers.get("authorization");
  let rawApiKey = apiKeyHeader;

  if (!rawApiKey && authHeader && authHeader.startsWith("Bearer ")) {
    rawApiKey = authHeader.substring(7).trim();
  }

  if (!rawApiKey) {
    return NextResponse.json(
      {
        error: "Unauthorized",
        message: "Missing API key in header (x-api-key or Authorization: Bearer <key>).",
      },
      { status: 401 }
    );
  }

  const keyHash = hashApiKey(rawApiKey);

  // Lookup tenant in DB
  const tenant = await db.tenant.findUnique({
    where: { apiKeyHash: keyHash },
  });

  if (!tenant) {
    return NextResponse.json(
      {
        error: "Unauthorized",
        message: "Invalid API key.",
      },
      { status: 401 }
    );
  }

  // Check rate limit in atomic Redis / in-memory store
  const rateLimitResult = await rateLimiter.check({
    tenantId: tenant.id,
    requestsPerMinute: tenant.requestsPerMinute,
    burstAllowance: tenant.burstAllowance,
    algorithm: tenant.algorithm as Algorithm,
  });

  const responseHeaders = rateLimiter.getHeaders(rateLimitResult);
  const path = "/" + (params.path ? params.path.join("/") : "");

  // Asynchronous fire-and-forget event log to DB (non-blocking for low latency)
  db.usageEvent
    .create({
      data: {
        tenantId: tenant.id,
        allowed: rateLimitResult.allowed,
        algorithm: tenant.algorithm,
        latencyMs: rateLimitResult.latencyMs,
        reason: rateLimitResult.allowed ? "OK" : "RATE_LIMIT_EXCEEDED",
      },
    })
    .catch((err) => {
      console.error("[Gateway] Failed to insert usage log:", err);
    });

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      {
        error: "Too Many Requests",
        message: `Rate limit exceeded for tenant '${tenant.name}'. Please retry after ${rateLimitResult.retryAfterSec}s.`,
        tenant: {
          id: tenant.id,
          name: tenant.name,
          plan: tenant.plan,
        },
        limit: rateLimitResult.limit,
        remaining: rateLimitResult.remaining,
        retryAfterSec: rateLimitResult.retryAfterSec,
        algorithm: rateLimitResult.algorithm,
      },
      {
        status: 429,
        headers: responseHeaders,
      }
    );
  }

  // Return success from mock protected upstream server
  return NextResponse.json(
    {
      success: true,
      message: "Gateway granted request to protected backend resource.",
      path,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        plan: tenant.plan,
      },
      rateLimit: {
        limit: rateLimitResult.limit,
        remaining: rateLimitResult.remaining,
        algorithm: rateLimitResult.algorithm,
        latencyMs: rateLimitResult.latencyMs,
      },
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: responseHeaders,
    }
  );
}

export {
  handleGatewayRequest as GET,
  handleGatewayRequest as POST,
  handleGatewayRequest as PUT,
  handleGatewayRequest as DELETE,
};
