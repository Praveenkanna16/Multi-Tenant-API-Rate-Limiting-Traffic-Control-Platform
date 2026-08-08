import { describe, it, expect } from "vitest";

function evaluateBenchmarkResult(params: {
  totalDispatched: number;
  http200Allowed: number;
  http429Blocked: number;
  http500Error: number;
  otherHttpStatus: number;
  networkErrors: number;
  configuredCapacity: number;
}) {
  const totalCompleted = params.http200Allowed + params.http429Blocked + params.http500Error + params.otherHttpStatus;
  const allRequestsCompleted = totalCompleted === params.totalDispatched;
  const zeroNetworkErrors = params.networkErrors === 0;
  const zeroUnexpectedStatuses = params.http500Error === 0 && params.otherHttpStatus === 0;
  const bothBehaviorsObserved = params.http200Allowed > 0 && params.http429Blocked > 0;
  const zeroOverAllocation = params.http200Allowed <= params.configuredCapacity;

  const isTestValidAndPassed =
    allRequestsCompleted &&
    zeroNetworkErrors &&
    zeroUnexpectedStatuses &&
    bothBehaviorsObserved &&
    zeroOverAllocation;

  return {
    isTestValidAndPassed,
    totalCompleted,
  };
}

describe("Concurrency Benchmark Observability & Safety Guards", () => {
  it("should fail when server is unreachable and 0 HTTP responses are received (previous false-positive flaw)", () => {
    const result = evaluateBenchmarkResult({
      totalDispatched: 100,
      http200Allowed: 0,
      http429Blocked: 0,
      http500Error: 0,
      otherHttpStatus: 0,
      networkErrors: 100,
      configuredCapacity: 25,
    });

    expect(result.isTestValidAndPassed).toBe(false);
    expect(result.totalCompleted).toBe(0);
  });

  it("should fail when over-allocation occurs (allowed > capacity)", () => {
    const result = evaluateBenchmarkResult({
      totalDispatched: 100,
      http200Allowed: 30, // Exceeds 25
      http429Blocked: 70,
      http500Error: 0,
      otherHttpStatus: 0,
      networkErrors: 0,
      configuredCapacity: 25,
    });

    expect(result.isTestValidAndPassed).toBe(false);
  });

  it("should fail when unexpected HTTP 500 errors occur", () => {
    const result = evaluateBenchmarkResult({
      totalDispatched: 100,
      http200Allowed: 25,
      http429Blocked: 70,
      http500Error: 5,
      otherHttpStatus: 0,
      networkErrors: 0,
      configuredCapacity: 25,
    });

    expect(result.isTestValidAndPassed).toBe(false);
  });

  it("should pass when clean 25 allowed and 75 blocked with 0 errors are recorded", () => {
    const result = evaluateBenchmarkResult({
      totalDispatched: 100,
      http200Allowed: 25,
      http429Blocked: 75,
      http500Error: 0,
      otherHttpStatus: 0,
      networkErrors: 0,
      configuredCapacity: 25,
    });

    expect(result.isTestValidAndPassed).toBe(true);
    expect(result.totalCompleted).toBe(100);
  });
});
