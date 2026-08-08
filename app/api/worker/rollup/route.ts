import { NextRequest, NextResponse } from "next/server";
import { runUsageRollup } from "@/lib/worker/rollup";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const targetDate = body.timestamp ? new Date(body.timestamp) : new Date();

    const result = await runUsageRollup(targetDate);
    return NextResponse.json({
      success: true,
      message: "Idempotent background rollup execution complete",
      result,
    });
  } catch (error) {
    console.error("[API Worker Rollup] Error:", error);
    return NextResponse.json({ error: "Rollup job failed" }, { status: 500 });
  }
}
