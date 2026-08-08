import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateApiKey } from "@/lib/auth";

export async function GET() {
  try {
    const tenants = await db.tenant.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { events: true, rollups: true },
        },
      },
    });

    return NextResponse.json({ success: true, tenants });
  } catch (error) {
    console.error("[API Tenants GET] Error:", error);
    return NextResponse.json({ error: "Failed to fetch tenants" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, plan = "PRO", algorithm = "SLIDING_WINDOW", requestsPerMinute = 60, burstAllowance = 10 } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Tenant name is required" }, { status: 400 });
    }

    const { apiKey, keyHash } = generateApiKey();

    const tenant = await db.tenant.create({
      data: {
        name,
        apiKey,
        apiKeyHash: keyHash,
        plan: plan.toUpperCase(),
        algorithm: algorithm.toUpperCase(),
        requestsPerMinute: Number(requestsPerMinute),
        burstAllowance: Number(burstAllowance),
      },
    });

    // Return the plaintext API Key ONCE upon creation
    return NextResponse.json({
      success: true,
      tenant,
      apiKey,
      warning: "Save this API Key now! It will not be shown again in cleartext.",
    });
  } catch (error) {
    console.error("[API Tenants POST] Error:", error);
    return NextResponse.json({ error: "Failed to create tenant" }, { status: 500 });
  }
}
