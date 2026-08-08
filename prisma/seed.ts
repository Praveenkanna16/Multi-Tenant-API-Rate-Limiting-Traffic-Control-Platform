import { PrismaClient } from "@prisma/client";
import { generateApiKey, hashApiKey } from "../lib/auth";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding QuotaForge initial tenants...");

  // Clean existing
  await prisma.usageRollup.deleteMany();
  await prisma.usageEvent.deleteMany();
  await prisma.tenant.deleteMany();

  const stripeKey = "qf_live_stripe_demo_key_998127391823";
  const twilioKey = "qf_live_twilio_demo_key_441239812731";
  const openaiKey = "qf_live_openai_demo_key_771928371928";
  const freeTierKey = "qf_live_freetier_demo_key_1129381273";

  const tenants = [
    {
      name: "Stripe Payment Services (Enterprise)",
      apiKey: stripeKey,
      apiKeyHash: hashApiKey(stripeKey),
      plan: "ENTERPRISE",
      algorithm: "TOKEN_BUCKET",
      requestsPerMinute: 300,
      burstAllowance: 50,
    },
    {
      name: "Twilio SMS Gateway (Pro)",
      apiKey: twilioKey,
      apiKeyHash: hashApiKey(twilioKey),
      plan: "PRO",
      algorithm: "SLIDING_WINDOW",
      requestsPerMinute: 120,
      burstAllowance: 20,
    },
    {
      name: "OpenAI Completion Agent (Pro)",
      apiKey: openaiKey,
      apiKeyHash: hashApiKey(openaiKey),
      plan: "PRO",
      algorithm: "TOKEN_BUCKET",
      requestsPerMinute: 60,
      burstAllowance: 10,
    },
    {
      name: "Acme Indie Hacker (Free)",
      apiKey: freeTierKey,
      apiKeyHash: hashApiKey(freeTierKey),
      plan: "FREE",
      algorithm: "SLIDING_WINDOW",
      requestsPerMinute: 20,
      burstAllowance: 5,
    },
  ];

  for (const t of tenants) {
    const created = await prisma.tenant.create({
      data: t,
    });
    console.log(`Created tenant ${created.name} (ID: ${created.id}) - Key: ${t.apiKey}`);
  }

  // Seed sample past 4 hours of rollups for instant visualization
  const tenantsList = await prisma.tenant.findMany();
  const now = new Date();

  for (let i = 4; i >= 1; i--) {
    const hourBucket = new Date(now);
    hourBucket.setHours(hourBucket.getHours() - i, 0, 0, 0);

    for (const t of tenantsList) {
      const isFree = t.plan === "FREE";
      const allowedCount = isFree ? 45 + Math.floor(Math.random() * 20) : 400 + Math.floor(Math.random() * 200);
      const deniedCount = isFree ? 15 + Math.floor(Math.random() * 10) : Math.floor(Math.random() * 5);

      await prisma.usageRollup.create({
        data: {
          tenantId: t.id,
          hourBucket,
          allowedCount,
          deniedCount,
          avgLatencyMs: Number((0.8 + Math.random() * 0.4).toFixed(2)),
        },
      });
    }
  }

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
