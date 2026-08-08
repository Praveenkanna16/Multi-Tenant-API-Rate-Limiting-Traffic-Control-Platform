import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateApiKey } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const tenant = await db.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: { events: true, rollups: true },
        },
        events: {
          take: 10,
          orderBy: { timestamp: "desc" },
        },
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, tenant });
  } catch (error) {
    console.error("[API Tenants GET ID] Error:", error);
    return NextResponse.json({ error: "Failed to fetch tenant" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { name, plan, algorithm, requestsPerMinute, burstAllowance, regenerateKey } = body;

    let newApiKey: string | undefined = undefined;
    let newKeyHash: string | undefined = undefined;

    if (regenerateKey) {
      const generated = generateApiKey();
      newApiKey = generated.apiKey;
      newKeyHash = generated.keyHash;
    }

    const tenant = await db.tenant.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(plan && { plan: plan.toUpperCase() }),
        ...(algorithm && { algorithm: algorithm.toUpperCase() }),
        ...(requestsPerMinute !== undefined && { requestsPerMinute: Number(requestsPerMinute) }),
        ...(burstAllowance !== undefined && { burstAllowance: Number(burstAllowance) }),
        ...(newApiKey && { apiKey: newApiKey, apiKeyHash: newKeyHash }),
      },
    });

    return NextResponse.json({
      success: true,
      tenant,
      ...(newApiKey && { apiKey: newApiKey, warning: "Save this new API Key now! It will not be shown again." }),
    });
  } catch (error) {
    console.error("[API Tenants PATCH] Error:", error);
    return NextResponse.json({ error: "Failed to update tenant" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    await db.tenant.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Tenant deleted" });
  } catch (error) {
    console.error("[API Tenants DELETE] Error:", error);
    return NextResponse.json({ error: "Failed to delete tenant" }, { status: 500 });
  }
}

