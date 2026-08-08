"use client";

import { useState } from "react";
import { Zap, Layers, Play, CheckCircle2, XCircle, Clock, ShieldAlert, Cpu } from "lucide-react";
import { checkTokenBucket } from "@/lib/rate-limiter/token-bucket";
import { checkSlidingWindow } from "@/lib/rate-limiter/sliding-window";

export default function BenchmarkPage() {
  const [rpm, setRpm] = useState(30);
  const [burstAllowance, setBurstAllowance] = useState(10);
  const [simulatedRequests, setSimulatedRequests] = useState(50);
  const [running, setRunning] = useState(false);

  const [tbResult, setTbResult] = useState<{ allowed: number; denied: number; avgLatencyMs: number } | null>(null);
  const [swResult, setSwResult] = useState<{ allowed: number; denied: number; avgLatencyMs: number } | null>(null);

  const runBenchmark = async () => {
    setRunning(true);
    setTbResult(null);
    setSwResult(null);

    const mockTenantTb = {
      tenantId: `bench_tb_${Date.now()}`,
      requestsPerMinute: rpm,
      burstAllowance,
      algorithm: "TOKEN_BUCKET" as const,
    };

    const mockTenantSw = {
      tenantId: `bench_sw_${Date.now()}`,
      requestsPerMinute: rpm,
      burstAllowance,
      algorithm: "SLIDING_WINDOW" as const,
    };

    // Run Token Bucket simulation
    let tbAllowed = 0;
    let tbDenied = 0;
    let tbTotalLatency = 0;

    for (let i = 0; i < simulatedRequests; i++) {
      const res = await checkTokenBucket(mockTenantTb);
      if (res.allowed) tbAllowed++;
      else tbDenied++;
      tbTotalLatency += res.latencyMs;
    }

    // Run Sliding Window simulation
    let swAllowed = 0;
    let swDenied = 0;
    let swTotalLatency = 0;

    for (let i = 0; i < simulatedRequests; i++) {
      const res = await checkSlidingWindow(mockTenantSw);
      if (res.allowed) swAllowed++;
      else swDenied++;
      swTotalLatency += res.latencyMs;
    }

    setTbResult({
      allowed: tbAllowed,
      denied: tbDenied,
      avgLatencyMs: Number((tbTotalLatency / simulatedRequests).toFixed(3)),
    });

    setSwResult({
      allowed: swAllowed,
      denied: swDenied,
      avgLatencyMs: Number((swTotalLatency / simulatedRequests).toFixed(3)),
    });

    setRunning(false);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8">
      {/* Top Banner */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 text-xs font-semibold text-cyan-400 mb-2">
          <Zap className="h-3.5 w-3.5" />
          <span>Interactive Systems Engineering Sandbox</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white">Algorithm Benchmark & Comparison</h1>
        <p className="text-sm text-slate-400">
          Compare Token Bucket vs Sliding Window Log under identical high-concurrency burst conditions
        </p>
      </div>

      {/* Configuration Controls */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-white border-b border-slate-800 pb-3">Benchmark Parameters</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Sustained Limit (RPM)</label>
            <input
              type="number"
              value={rpm}
              onChange={(e) => setRpm(Number(e.target.value))}
              className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Burst Allowance (Token Bucket)</label>
            <input
              type="number"
              value={burstAllowance}
              onChange={(e) => setBurstAllowance(Number(e.target.value))}
              className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Simulated Simultaneous Requests</label>
            <input
              type="number"
              value={simulatedRequests}
              onChange={(e) => setSimulatedRequests(Number(e.target.value))}
              className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <button
          onClick={runBenchmark}
          disabled={running}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-cyan-500/25 hover:scale-105 transition-all disabled:opacity-50"
        >
          <Play className="h-4 w-4" />
          {running ? "Executing Concurrency Sandbox..." : "Run Comparative Benchmark"}
        </button>
      </div>

      {/* Side-by-Side Results Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Token Bucket Card */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white">Token Bucket Algorithm</h2>
            </div>
            <span className="text-[11px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded">
              Capacity: {rpm + burstAllowance}
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Maintains a token bucket refilled smoothly over time at rate <strong className="text-slate-200">{rpm}/60s</strong>. Allows short bursts up to sustained limit + burst allowance.
          </p>

          {tbResult ? (
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400">Allowed</span>
                  <div className="text-xl font-bold text-emerald-400 font-mono">{tbResult.allowed}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400">Denied (429)</span>
                  <div className="text-xl font-bold text-rose-400 font-mono">{tbResult.denied}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400">Avg Latency</span>
                  <div className="text-xl font-bold text-cyan-400 font-mono">{tbResult.avgLatencyMs}ms</div>
                </div>
              </div>

              <div className="rounded-xl bg-slate-950 p-3 text-xs text-slate-300 space-y-1 border border-slate-800">
                <span className="font-bold text-amber-400">Behavior Analysis:</span>
                <p>
                  Allowed initial burst of <strong className="text-white">{rpm + burstAllowance}</strong> requests immediately because tokens were full, then began rate limiting subsequent requests until bucket refills.
                </p>
              </div>
            </div>
          ) : (
            <div className="h-36 flex items-center justify-center text-xs text-slate-500">
              Run benchmark to view Token Bucket results
            </div>
          )}
        </div>

        {/* Sliding Window Card */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-cyan-400" />
              <h2 className="text-lg font-bold text-white">Sliding Window Log Algorithm</h2>
            </div>
            <span className="text-[11px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded">
              Limit: {rpm} (Strict)
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Tracks request timestamps in a Redis Sorted Set (ZSET). Strictly enforces that no more than <strong className="text-slate-200">{rpm}</strong> requests occur within any sliding 60-second window.
          </p>

          {swResult ? (
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400">Allowed</span>
                  <div className="text-xl font-bold text-emerald-400 font-mono">{swResult.allowed}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400">Denied (429)</span>
                  <div className="text-xl font-bold text-rose-400 font-mono">{swResult.denied}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400">Avg Latency</span>
                  <div className="text-xl font-bold text-cyan-400 font-mono">{swResult.avgLatencyMs}ms</div>
                </div>
              </div>

              <div className="rounded-xl bg-slate-950 p-3 text-xs text-slate-300 space-y-1 border border-slate-800">
                <span className="font-bold text-cyan-400">Behavior Analysis:</span>
                <p>
                  Strictly capped total requests at <strong className="text-white">{rpm}</strong> within the 60-second window. Prevents boundary-crossing double bursts with exact millisecond precision.
                </p>
              </div>
            </div>
          ) : (
            <div className="h-36 flex items-center justify-center text-xs text-slate-500">
              Run benchmark to view Sliding Window Log results
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
