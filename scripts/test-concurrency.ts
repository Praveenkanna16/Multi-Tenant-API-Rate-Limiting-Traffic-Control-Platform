import { db } from "../lib/db";
import { hashApiKey } from "../lib/auth";

async function main() {
  console.log("==========================================================");
  console.log(" 🚀 QUOTAFORGE CONCURRENCY & ZERO-OVER-ALLOCATION TEST");
  console.log("==========================================================");

  // Pick or create test tenant with RPM = 20
  const tenantName = "Concurrency Benchmark Tenant";
  const apiKey = "qf_live_concurrency_test_key_999";
  const apiKeyHash = hashApiKey(apiKey);

  await db.tenant.upsert({
    where: { apiKeyHash },
    update: { requestsPerMinute: 20, burstAllowance: 5, algorithm: "TOKEN_BUCKET" },
    create: {
      name: tenantName,
      apiKey,
      apiKeyHash,
      plan: "PRO",
      algorithm: "TOKEN_BUCKET",
      requestsPerMinute: 20,
      burstAllowance: 5, // Total capacity = 25
    },
  });

  const TOTAL_CONCURRENT_REQUESTS = 100;
  console.log(`Configured Tenant Limit: 20 RPM + 5 Burst = 25 Total Tokens`);
  console.log(`Dispatching ${TOTAL_CONCURRENT_REQUESTS} simultaneous asynchronous request checks...\n`);

  const start = performance.now();

  const requests = Array.from({ length: TOTAL_CONCURRENT_REQUESTS }).map(async (_, idx) => {
    const res = await fetch("http://localhost:3000/api/gateway/v1/benchmark", {
      method: "GET",
      headers: { "x-api-key": apiKey },
    }).catch(() => null);

    return res ? res.status : 500;
  });

  const statuses = await Promise.all(requests);
  const durationMs = performance.now() - start;

  const allowed200 = statuses.filter((s) => s === 200).length;
  const denied429 = statuses.filter((s) => s === 429).length;

  console.log("----------------------------------------------------------");
  console.log(`Total Requests:         ${TOTAL_CONCURRENT_REQUESTS}`);
  console.log(`HTTP 200 OK (Allowed):    ${allowed200}`);
  console.log(`HTTP 429 Denied (Blocked): ${denied429}`);
  console.log(`Execution Time:         ${durationMs.toFixed(2)} ms`);
  console.log("----------------------------------------------------------");

  if (allowed200 <= 25) {
    console.log("✅ SUCCESS: Zero over-allocation! Quota limit strictly enforced under high concurrency.");
  } else {
    console.log(`❌ FAILURE: Over-allocation detected! ${allowed200} allowed but limit was 25.`);
  }

  await db.$disconnect();
}

main().catch((err) => {
  console.error("Error in benchmark:", err);
  process.exit(1);
});
