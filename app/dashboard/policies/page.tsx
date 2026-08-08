"use client";

import { useState } from "react";

export default function PoliciesPage() {
  const [activeTab, setActiveTab] = useState<"tiers" | "engine" | "simulator">("tiers");

  // Policy simulator state
  const [simAlgorithm, setSimAlgorithm] = useState("TOKEN_BUCKET");
  const [simRpm, setSimRpm] = useState(60);
  const [simBurst, setSimBurst] = useState(15);
  const [simResults, setSimResults] = useState<Array<{ id: number; allowed: boolean; remaining: number; latencyMs: number }>>([]);

  const runSimulation = () => {
    const results = [];
    let remainingTokens = simAlgorithm === "TOKEN_BUCKET" ? simRpm + simBurst : simRpm;

    for (let i = 1; i <= 20; i++) {
      const allowed = remainingTokens > 0;
      if (allowed) remainingTokens--;
      results.push({
        id: i,
        allowed,
        remaining: Math.max(0, remainingTokens),
        latencyMs: Number((0.25 + Math.random() * 0.25).toFixed(2)),
      });
    }
    setSimResults(results);
  };

  return (
    <div className="space-y-stack-lg">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-stack-md">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-1">Policy Configuration</h1>
          <p className="font-body-base text-body-base text-secondary">
            Define infrastructure-level rate limiting rules, bucket capacities, burst multipliers, and algorithm strategies.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center bg-surface-container-low p-1 rounded border border-outline-variant">
          <button
            onClick={() => setActiveTab("tiers")}
            className={`px-3 py-1.5 font-label-caps text-label-caps uppercase rounded transition-colors ${
              activeTab === "tiers" ? "bg-surface-container-lowest text-primary font-bold shadow-xs" : "text-secondary hover:text-on-surface"
            }`}
          >
            Tier Presets
          </button>
          <button
            onClick={() => setActiveTab("engine")}
            className={`px-3 py-1.5 font-label-caps text-label-caps uppercase rounded transition-colors ${
              activeTab === "engine" ? "bg-surface-container-lowest text-primary font-bold shadow-xs" : "text-secondary hover:text-on-surface"
            }`}
          >
            Engine Settings
          </button>
          <button
            onClick={() => setActiveTab("simulator")}
            className={`px-3 py-1.5 font-label-caps text-label-caps uppercase rounded transition-colors ${
              activeTab === "simulator" ? "bg-surface-container-lowest text-primary font-bold shadow-xs" : "text-secondary hover:text-on-surface"
            }`}
          >
            Policy Simulator
          </button>
        </div>
      </header>

      {/* Tier Presets Tab */}
      {activeTab === "tiers" && (
        <div className="space-y-stack-md">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-stack-md">
            {/* Enterprise Tier */}
            <div className="bg-surface-container-lowest border border-outline-variant p-stack-md rounded flex flex-col justify-between space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-headline-md text-headline-md font-bold text-on-surface">Enterprise Tier</span>
                  <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded font-mono-sm font-bold text-[11px]">
                    TOKEN BUCKET
                  </span>
                </div>
                <p className="text-body-sm text-secondary mb-4">High-throughput policy for mission-critical API workloads and large enterprise partners.</p>
                <div className="space-y-2 font-mono-sm text-body-sm">
                  <div className="flex justify-between border-b border-surface-container pb-1">
                    <span className="text-secondary">Sustained Rate:</span>
                    <span className="font-bold text-on-surface">300 req / min</span>
                  </div>
                  <div className="flex justify-between border-b border-surface-container pb-1">
                    <span className="text-secondary">Burst Capacity:</span>
                    <span className="font-bold text-emerald-700">+50 tokens</span>
                  </div>
                  <div className="flex justify-between border-b border-surface-container pb-1">
                    <span className="text-secondary">Refill Interval:</span>
                    <span className="font-bold text-on-surface">1,000 ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary">Race Condition Lock:</span>
                    <span className="font-bold text-primary">Atomic Lua</span>
                  </div>
                </div>
              </div>
              <div className="bg-surface-container-low p-2 rounded text-mono-sm text-[11px] text-secondary">
                Applied to: Stripe Payment Services (Enterprise)
              </div>
            </div>

            {/* Pro Tier */}
            <div className="bg-surface-container-lowest border border-outline-variant p-stack-md rounded flex flex-col justify-between space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-headline-md text-headline-md font-bold text-on-surface">Pro Tier</span>
                  <span className="bg-primary-fixed/40 text-primary border border-primary-fixed px-2 py-0.5 rounded font-mono-sm font-bold text-[11px]">
                    SLIDING WINDOW
                  </span>
                </div>
                <p className="text-body-sm text-secondary mb-4">Strict sliding window log policy preventing micro-bursts for standard production applications.</p>
                <div className="space-y-2 font-mono-sm text-body-sm">
                  <div className="flex justify-between border-b border-surface-container pb-1">
                    <span className="text-secondary">Sustained Rate:</span>
                    <span className="font-bold text-on-surface">120 req / min</span>
                  </div>
                  <div className="flex justify-between border-b border-surface-container pb-1">
                    <span className="text-secondary">Burst Capacity:</span>
                    <span className="font-bold text-emerald-700">+20 tokens</span>
                  </div>
                  <div className="flex justify-between border-b border-surface-container pb-1">
                    <span className="text-secondary">Window Precision:</span>
                    <span className="font-bold text-on-surface">60,000 ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary">Race Condition Lock:</span>
                    <span className="font-bold text-primary">Atomic Redis ZSET</span>
                  </div>
                </div>
              </div>
              <div className="bg-surface-container-low p-2 rounded text-mono-sm text-[11px] text-secondary">
                Applied to: Twilio SMS Gateway, OpenAI Completion Agent
              </div>
            </div>

            {/* Free Tier */}
            <div className="bg-surface-container-lowest border border-outline-variant p-stack-md rounded flex flex-col justify-between space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-headline-md text-headline-md font-bold text-on-surface">Free Tier</span>
                  <span className="bg-surface-container-high text-secondary border border-outline-variant px-2 py-0.5 rounded font-mono-sm font-bold text-[11px]">
                    SLIDING WINDOW
                  </span>
                </div>
                <p className="text-body-sm text-secondary mb-4">Controlled access tier with low quotas to guard backend infrastructure against abusive traffic.</p>
                <div className="space-y-2 font-mono-sm text-body-sm">
                  <div className="flex justify-between border-b border-surface-container pb-1">
                    <span className="text-secondary">Sustained Rate:</span>
                    <span className="font-bold text-on-surface">20 req / min</span>
                  </div>
                  <div className="flex justify-between border-b border-surface-container pb-1">
                    <span className="text-secondary">Burst Capacity:</span>
                    <span className="font-bold text-emerald-700">+5 tokens</span>
                  </div>
                  <div className="flex justify-between border-b border-surface-container pb-1">
                    <span className="text-secondary">Window Precision:</span>
                    <span className="font-bold text-on-surface">60,000 ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary">Rate Exceeded Action:</span>
                    <span className="font-bold text-error">HTTP 429 Block</span>
                  </div>
                </div>
              </div>
              <div className="bg-surface-container-low p-2 rounded text-mono-sm text-[11px] text-secondary">
                Applied to: Acme Indie Hacker (Free)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Engine Settings Tab */}
      {activeTab === "engine" && (
        <div className="bg-surface-container-lowest border border-outline-variant p-stack-md rounded space-y-stack-md">
          <h2 className="font-headline-md text-headline-md font-semibold text-on-surface">Global Engine Parameters</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
            <div className="space-y-1">
              <label className="block font-label-caps text-label-caps uppercase text-secondary">Storage Backend Engine</label>
              <input
                type="text"
                disabled
                value="Atomic In-Memory Redis / Standalone Upstash Cluster"
                className="w-full bg-surface-container-low border border-outline-variant rounded px-3 py-2 text-on-surface font-mono-sm"
              />
              <p className="text-mono-sm text-[11px] text-secondary">Evaluates rate limit contracts using atomic Redis LUA scripts to guarantee zero race conditions.</p>
            </div>

            <div className="space-y-1">
              <label className="block font-label-caps text-label-caps uppercase text-secondary">Fallback Enforcement Strategy</label>
              <select className="w-full bg-surface-container-low border border-outline-variant rounded px-3 py-2 text-on-surface font-body-base">
                <option value="BLOCK">Fail Closed (HTTP 429 Block on Error)</option>
                <option value="ALLOW">Fail Open (Pass Through on Redis Outage)</option>
              </select>
              <p className="text-mono-sm text-[11px] text-secondary">Determines behavior if rate limiter storage cluster experiences connectivity issues.</p>
            </div>

            <div className="space-y-1">
              <label className="block font-label-caps text-label-caps uppercase text-secondary">Concurrency Lock Timeout (ms)</label>
              <input
                type="number"
                defaultValue={250}
                className="w-full bg-surface-container-low border border-outline-variant rounded px-3 py-2 text-on-surface font-mono-sm"
              />
              <p className="text-mono-sm text-[11px] text-secondary">Maximum wait duration before atomic lock releases during extreme parallel spikes.</p>
            </div>

            <div className="space-y-1">
              <label className="block font-label-caps text-label-caps uppercase text-secondary">Header Spec Compliance</label>
              <input
                type="text"
                disabled
                value="IETF Draft RFC 6585 (X-RateLimit-* & Retry-After)"
                className="w-full bg-surface-container-low border border-outline-variant rounded px-3 py-2 text-on-surface font-mono-sm"
              />
              <p className="text-mono-sm text-[11px] text-secondary">Emits standardized rate limit headers with every response.</p>
            </div>
          </div>
        </div>
      )}

      {/* Policy Simulator Tab */}
      {activeTab === "simulator" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-stack-md">
          <div className="lg:col-span-5 bg-surface-container-lowest border border-outline-variant p-stack-md rounded space-y-4">
            <h2 className="font-headline-md text-headline-md font-semibold text-on-surface">Interactive Policy Simulator</h2>
            <p className="text-body-sm text-secondary">Simulate a rapid burst of 20 requests against your policy parameters to inspect bucket behavior.</p>

            <div className="space-y-3 font-body-sm">
              <div>
                <label className="block font-label-caps text-label-caps uppercase text-secondary mb-1">Rate Limiting Algorithm</label>
                <select
                  value={simAlgorithm}
                  onChange={(e) => setSimAlgorithm(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant rounded px-3 py-2 text-on-surface"
                >
                  <option value="TOKEN_BUCKET">Token Bucket (Allows Bursts)</option>
                  <option value="SLIDING_WINDOW">Sliding Window Log (Strict)</option>
                </select>
              </div>

              <div>
                <label className="block font-label-caps text-label-caps uppercase text-secondary mb-1">Sustained Limit (RPM)</label>
                <input
                  type="number"
                  value={simRpm}
                  onChange={(e) => setSimRpm(Number(e.target.value))}
                  className="w-full bg-surface-container-low border border-outline-variant rounded px-3 py-2 text-on-surface font-mono-sm"
                />
              </div>

              <div>
                <label className="block font-label-caps text-label-caps uppercase text-secondary mb-1">Burst Allowance</label>
                <input
                  type="number"
                  value={simBurst}
                  onChange={(e) => setSimBurst(Number(e.target.value))}
                  className="w-full bg-surface-container-low border border-outline-variant rounded px-3 py-2 text-on-surface font-mono-sm"
                />
              </div>

              <button
                onClick={runSimulation}
                className="w-full bg-primary hover:bg-primary-container text-on-primary font-label-caps text-label-caps uppercase py-2.5 rounded transition-colors cursor-pointer"
              >
                Run 20-Request Burst Simulation
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 bg-surface-container-lowest border border-outline-variant p-stack-md rounded">
            <h3 className="font-headline-md text-headline-md font-semibold text-on-surface mb-stack-md">Simulation Sequence Output</h3>

            {simResults.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono-sm text-body-sm">
                  <thead className="bg-surface-container-low border-b border-outline-variant font-label-caps text-label-caps text-secondary uppercase">
                    <tr>
                      <th className="px-3 py-2">Req #</th>
                      <th className="px-3 py-2">Engine Decision</th>
                      <th className="px-3 py-2">Remaining Tokens</th>
                      <th className="px-3 py-2">Evaluation Latency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container">
                    {simResults.map((r) => (
                      <tr key={r.id}>
                        <td className="px-3 py-2 text-secondary font-bold">#{r.id}</td>
                        <td className="px-3 py-2">
                          {r.allowed ? (
                            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                              200 ALLOWED
                            </span>
                          ) : (
                            <span className="text-error bg-error-container/40 px-2 py-0.5 rounded border border-error-container font-bold">
                              429 DENIED
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 font-bold text-on-surface">{r.remaining} tokens</td>
                        <td className="px-3 py-2 text-primary">{r.latencyMs} ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center text-secondary font-mono-sm">
                Click "Run 20-Request Burst Simulation" to evaluate the policy!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
