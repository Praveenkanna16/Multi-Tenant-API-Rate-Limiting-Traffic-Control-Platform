import { db } from "../lib/db";
import { hashApiKey } from "../lib/auth";

interface RequestResult {
  status: number | null;
  networkError: boolean;
  errorDetail: string | null;
}

async function discoverServerBaseUrl(): Promise<string | null> {
  // Respect explicit environment overrides if set
  if (process.env.BASE_URL) return process.env.BASE_URL;
  if (process.env.PORT) return `http://localhost:${process.env.PORT}`;

  // Candidate ports commonly used in Next.js development
  const candidatePorts = [3000, 3001, 3002];
  for (const port of candidatePorts) {
    const candidateUrl = `http://localhost:${port}`;
    try {
      const res = await fetch(`${candidateUrl}/api/health`, {
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) {
        const body = (await res.json().catch(() => ({}))) as { services?: { gateway?: unknown } };
        if (body?.services?.gateway) {
          return candidateUrl;
        }
      }
    } catch {
      // Ignore connection errors during discovery scan
    }
  }

  return null;
}

async function main() {
  console.log("==========================================================");
  console.log(" 🚀 QUOTAFORGE CONCURRENCY & ZERO-OVER-ALLOCATION TEST");
  console.log("==========================================================");

  const baseUrl = await discoverServerBaseUrl();
  if (!baseUrl) {
    console.error("❌ CRITICAL ERROR: Unable to locate running QuotaForge server on ports 3000, 3001, or 3002.");
    console.error("Please ensure the application server is running (`npm run dev`).\n");
    console.log("RESULT: TEST INVALID / FAILED");
    process.exit(1);
  }

  console.log(`Connected Target Server: ${baseUrl}`);

  const tenantName = "Concurrency Benchmark Tenant";
  const apiKey = "qf_live_concurrency_test_key_999";
  const apiKeyHash = hashApiKey(apiKey);

  // Clean up any stale benchmark tenant to ensure fresh in-process token bucket state
  await db.tenant.deleteMany({
    where: { apiKeyHash },
  });

  const tenant = await db.tenant.create({
    data: {
      name: tenantName,
      apiKey,
      apiKeyHash,
      plan: "PRO",
      algorithm: "TOKEN_BUCKET",
      requestsPerMinute: 20,
      burstAllowance: 5, // Total configured capacity = 25 tokens
    },
  });

  const CONFIGURED_CAPACITY = tenant.requestsPerMinute + tenant.burstAllowance; // 25
  const TOTAL_CONCURRENT_REQUESTS = 100;

  console.log(`Configured Tenant Limit: ${tenant.requestsPerMinute} RPM + ${tenant.burstAllowance} Burst = ${CONFIGURED_CAPACITY} Total Tokens`);
  console.log(`Dispatching ${TOTAL_CONCURRENT_REQUESTS} simultaneous asynchronous request checks...\n`);

  const start = performance.now();

  const requests: Promise<RequestResult>[] = Array.from({ length: TOTAL_CONCURRENT_REQUESTS }).map(async () => {
    try {
      const res = await fetch(`${baseUrl}/api/gateway/v1/benchmark`, {
        method: "GET",
        headers: { "x-api-key": apiKey },
      });
      return {
        status: res.status,
        networkError: false,
        errorDetail: null,
      };
    } catch (err: any) {
      return {
        status: null,
        networkError: true,
        errorDetail: err?.message || String(err),
      };
    }
  });

  const results = await Promise.all(requests);
  const durationMs = performance.now() - start;

  // Telemetry Aggregation
  const http200Allowed = results.filter((r) => r.status === 200).length;
  const http429Blocked = results.filter((r) => r.status === 429).length;
  const http500Error = results.filter((r) => r.status === 500).length;
  const otherHttpStatus = results.filter(
    (r) => r.status !== null && r.status !== 200 && r.status !== 429 && r.status !== 500
  ).length;
  const networkErrors = results.filter((r) => r.networkError).length;
  const totalCompleted = results.filter((r) => r.status !== null).length;
  const totalSuccessfulHandled = http200Allowed + http429Blocked;
  const requestsPerSec = ((TOTAL_CONCURRENT_REQUESTS / durationMs) * 1000).toFixed(2);

  console.log("----------------------------------------------------------");
  console.log(`Total Requests Dispatched:        ${TOTAL_CONCURRENT_REQUESTS}`);
  console.log(`HTTP 200 OK / Allowed:             ${http200Allowed}`);
  console.log(`HTTP 429 / Blocked:                ${http429Blocked}`);
  console.log(`HTTP 500 Server Errors:            ${http500Error}`);
  console.log(`Other HTTP Statuses:               ${otherHttpStatus}`);
  console.log(`Network / Connection Errors:      ${networkErrors}`);
  console.log(`Total Completed HTTP Responses:    ${totalCompleted}`);
  console.log(`Total Handled (200 + 429):        ${totalSuccessfulHandled}`);
  console.log(`Execution Time:                    ${durationMs.toFixed(2)} ms`);
  console.log(`Requests Per Second:               ${requestsPerSec} req/sec`);
  console.log(`Configured Capacity:               ${CONFIGURED_CAPACITY}`);
  console.log("----------------------------------------------------------");

  // Strict Validation Assertions
  const allRequestsCompleted = totalCompleted === TOTAL_CONCURRENT_REQUESTS;
  const zeroNetworkErrors = networkErrors === 0;
  const zeroUnexpectedStatuses = http500Error === 0 && otherHttpStatus === 0;
  const bothBehaviorsObserved = http200Allowed > 0 && http429Blocked > 0;
  const zeroOverAllocation = http200Allowed <= CONFIGURED_CAPACITY;

  const isTestValidAndPassed =
    allRequestsCompleted &&
    zeroNetworkErrors &&
    zeroUnexpectedStatuses &&
    bothBehaviorsObserved &&
    zeroOverAllocation;

  if (isTestValidAndPassed) {
    console.log("STATUS: VALID");
    console.log(`✅ BENCHMARK SUCCESS: Zero over-allocation! Strictly allowed ${http200Allowed} requests (Limit: ${CONFIGURED_CAPACITY}) and blocked ${http429Blocked} under 100 concurrent requests.`);
  } else {
    console.log("STATUS: TEST INVALID / FAILED");
    if (!allRequestsCompleted) {
      console.log(` - Incomplete requests: Only ${totalCompleted}/${TOTAL_CONCURRENT_REQUESTS} received HTTP responses.`);
    }
    if (!zeroNetworkErrors) {
      console.log(` - Network failures detected: ${networkErrors} request(s) failed with connection errors.`);
    }
    if (!zeroUnexpectedStatuses) {
      console.log(` - Unexpected HTTP statuses: ${http500Error} 500 errors, ${otherHttpStatus} non-standard status responses.`);
    }
    if (!bothBehaviorsObserved) {
      console.log(` - Expected both HTTP 200 and HTTP 429 responses, but observed 200: ${http200Allowed}, 429: ${http429Blocked}.`);
    }
    if (!zeroOverAllocation) {
      console.log(` - OVER-ALLOCATION DETECTED! Allowed ${http200Allowed} requests, exceeding capacity of ${CONFIGURED_CAPACITY}.`);
    }
    process.exit(1);
  }

  await db.$disconnect();
}

main().catch((err) => {
  console.error("Error in benchmark:", err);
  process.exit(1);
});
