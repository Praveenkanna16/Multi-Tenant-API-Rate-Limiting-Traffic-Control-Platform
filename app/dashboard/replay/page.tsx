"use client";

import { useState, useRef, useEffect } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface ReplayStreamEvent {
  step: number;
  total: number;
  requestId: string;
  tenantId: string;
  tenantName: string;
  algorithm: string;
  allowed: boolean;
  remaining: number;
  limit: number;
  resetMs: number;
  retryAfterSec: number;
  latencyMs: number;
  timestamp: string;
}

export default function ReplayPage() {
  const [pattern, setPattern] = useState<"MIXED" | "SPIKY" | "NORMAL" | "OVERLIMIT">("SPIKY");
  const [totalEvents, setTotalEvents] = useState(60);

  const [isStreaming, setIsStreaming] = useState(false);
  const [events, setEvents] = useState<ReplayStreamEvent[]>([]);
  const [lastEvent, setLastEvent] = useState<ReplayStreamEvent | null>(null);

  // Real-time aggregate counters
  const [allowedCount, setAllowedCount] = useState(0);
  const [deniedCount, setDeniedCount] = useState(0);
  const [chartData, setChartData] = useState<Array<{ step: number; allowed: number; denied: number }>>([]);

  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [events]);

  const startReplayStream = async () => {
    setIsStreaming(true);
    setEvents([]);
    setLastEvent(null);
    setAllowedCount(0);
    setDeniedCount(0);
    setChartData([]);

    try {
      const res = await fetch("/api/replay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pattern, totalEvents }),
      });

      if (!res.body) return;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      let currentAllowed = 0;
      let currentDenied = 0;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.replace("data: ", "").trim();
            if (!dataStr) continue;

            try {
              const parsed = JSON.parse(dataStr);

              if (parsed.type === "EVENT") {
                const ev: ReplayStreamEvent = parsed;
                setEvents((prev) => [...prev, ev]);
                setLastEvent(ev);

                if (ev.allowed) {
                  currentAllowed++;
                  setAllowedCount((c) => c + 1);
                } else {
                  currentDenied++;
                  setDeniedCount((c) => c + 1);
                }

                setChartData((prev) => [
                  ...prev,
                  {
                    step: ev.step,
                    allowed: currentAllowed,
                    denied: currentDenied,
                  },
                ]);
              } else if (parsed.type === "COMPLETE") {
                setIsStreaming(false);
              }
            } catch (e) {
              console.error("JSON parse error:", e);
            }
          }
        }
      }
    } catch (err) {
      console.error("Stream error:", err);
    } finally {
      setIsStreaming(false);
    }
  };

  const totalStreamed = allowedCount + deniedCount;
  const denyPercentage = totalStreamed > 0 ? ((deniedCount / totalStreamed) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-stack-lg">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-stack-md">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-headline-lg text-headline-lg text-on-surface">Traffic Replay Engine</h1>
            <span className="bg-primary-fixed/40 text-primary border border-primary-fixed px-2.5 py-0.5 rounded font-mono-sm text-[11px] font-bold">
              REAL-TIME SSE STREAM
            </span>
          </div>
          <p className="font-body-base text-body-base text-secondary">
            Simulate high-concurrency traffic bursts, stress test rate-limiting policies, and visualize live request decision paths.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!isStreaming ? (
            <button
              onClick={startReplayStream}
              className="bg-primary hover:bg-primary-container text-on-primary font-label-caps text-label-caps uppercase px-5 py-2.5 rounded flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">play_arrow</span>
              Start Traffic Replay
            </button>
          ) : (
            <button
              onClick={() => setIsStreaming(false)}
              className="bg-error hover:bg-error/90 text-on-error font-label-caps text-label-caps uppercase px-5 py-2.5 rounded flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">stop</span>
              Pause Replay
            </button>
          )}
        </div>
      </header>

      {/* Traffic Controls Configuration */}
      <div className="bg-surface-container-lowest border border-outline-variant p-stack-md rounded flex flex-wrap items-center justify-between gap-stack-md">
        <div className="flex flex-wrap items-center gap-stack-md">
          <div>
            <label className="block text-secondary font-label-caps text-label-caps uppercase mb-1">Traffic Pattern</label>
            <div className="flex items-center bg-surface-container-low p-1 rounded border border-outline-variant">
              {(["SPIKY", "NORMAL", "OVERLIMIT", "MIXED"] as const).map((p) => (
                <button
                  key={p}
                  disabled={isStreaming}
                  onClick={() => setPattern(p)}
                  className={`px-3 py-1 font-label-caps text-label-caps uppercase rounded transition-colors ${
                    pattern === p
                      ? "bg-surface-container-lowest text-primary font-bold shadow-xs"
                      : "text-secondary hover:text-on-surface"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-secondary font-label-caps text-label-caps uppercase mb-1">Total Requests</label>
            <select
              disabled={isStreaming}
              value={totalEvents}
              onChange={(e) => setTotalEvents(Number(e.target.value))}
              className="bg-surface-container-low border border-outline-variant rounded px-3 py-1.5 text-body-sm text-on-surface focus:outline-none focus:border-primary"
            >
              <option value={40}>40 Requests</option>
              <option value={60}>60 Requests</option>
              <option value={100}>100 Requests</option>
            </select>
          </div>
        </div>

        <div className="font-mono-sm text-secondary">
          Engine Mode: <span className="font-bold text-on-surface">Atomic Redis Lua Pipeline</span>
        </div>
      </div>

      {/* Visual Traffic Flow Diagram */}
      <div className="bg-surface-container-lowest border border-outline-variant p-stack-md rounded space-y-stack-md">
        <div className="flex justify-between items-center pb-2 border-b border-outline-variant">
          <h2 className="font-headline-md text-headline-md font-semibold text-on-surface">Live Architecture Decision Flow</h2>
          {isStreaming && (
            <span className="inline-flex items-center gap-1.5 text-emerald-700 font-mono-sm text-[11px] bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 font-bold">
              <span className="w-2 h-2 bg-emerald-600 rounded-full animate-ping"></span>
              STREAMING PACKETS
            </span>
          )}
        </div>

        {/* 5-Node Gateway Visual Diagram */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative py-4">
          {/* Node 1: Clients */}
          <div className="bg-surface-container-low border border-outline-variant p-3 rounded text-center relative flex flex-col items-center justify-center">
            <span className="material-symbols-outlined text-secondary text-[24px] mb-1">devices</span>
            <div className="font-headline-md text-[14px] font-bold text-on-surface">Clients</div>
            <div className="font-mono-sm text-[11px] text-secondary">Traffic Generator</div>
          </div>

          {/* Node 2: Gateway */}
          <div className="bg-surface-container-low border border-outline-variant p-3 rounded text-center relative flex flex-col items-center justify-center">
            <span className="material-symbols-outlined text-primary text-[24px] mb-1">router</span>
            <div className="font-headline-md text-[14px] font-bold text-on-surface">QuotaForge Gateway</div>
            <div className="font-mono-sm text-[11px] text-secondary">Auth & Policy Lookup</div>
          </div>

          {/* Node 3: Rate Limit Engine */}
          <div
            className={`border p-3 rounded text-center relative flex flex-col items-center justify-center transition-colors ${
              lastEvent
                ? lastEvent.allowed
                  ? "bg-emerald-50 border-emerald-300"
                  : "bg-error-container/30 border-error-container"
                : "bg-surface-container-low border-outline-variant"
            }`}
          >
            <span className="material-symbols-outlined text-on-surface text-[24px] mb-1">memory</span>
            <div className="font-headline-md text-[14px] font-bold text-on-surface">Rate Limit Engine</div>
            <div className="font-mono-sm text-[11px] text-secondary">Atomic Contract Check</div>
          </div>

          {/* Node 4: Redis Storage */}
          <div className="bg-surface-container-low border border-outline-variant p-3 rounded text-center relative flex flex-col items-center justify-center">
            <span className="material-symbols-outlined text-tertiary text-[24px] mb-1">database</span>
            <div className="font-headline-md text-[14px] font-bold text-on-surface">Redis Cluster</div>
            <div className="font-mono-sm text-[11px] text-secondary">Atomic Lua Script</div>
          </div>

          {/* Node 5: Protected API / Blocked */}
          <div
            className={`border p-3 rounded text-center relative flex flex-col items-center justify-center transition-colors ${
              lastEvent
                ? lastEvent.allowed
                  ? "bg-emerald-100 border-emerald-300"
                  : "bg-error-container border-error"
                : "bg-surface-container-low border-outline-variant"
            }`}
          >
            <span className="material-symbols-outlined text-[24px] mb-1">
              {lastEvent ? (lastEvent.allowed ? "cloud_done" : "block") : "cloud"}
            </span>
            <div className="font-headline-md text-[14px] font-bold text-on-surface">
              {lastEvent ? (lastEvent.allowed ? "Protected Upstream API" : "429 Rate Limit Drop") : "Protected Upstream"}
            </div>
            <div className="font-mono-sm text-[11px] text-secondary">
              {lastEvent ? (lastEvent.allowed ? "200 OK Response" : "429 Too Many Requests") : "Destination Backend"}
            </div>
          </div>
        </div>
      </div>

      {/* Telemetry KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-stack-md">
        <div className="bg-surface-container-lowest border border-outline-variant p-stack-md rounded">
          <div className="text-secondary font-label-caps text-label-caps uppercase mb-1">Replay Volume</div>
          <div className="font-mono-base text-[24px] font-semibold text-on-surface tracking-tight">
            {totalStreamed} / {totalEvents}
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant p-stack-md rounded">
          <div className="text-secondary font-label-caps text-label-caps uppercase mb-1">Allowed (200 OK)</div>
          <div className="font-mono-base text-[24px] font-semibold text-emerald-700 tracking-tight">
            {allowedCount}
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant p-stack-md rounded">
          <div className="text-secondary font-label-caps text-label-caps uppercase mb-1">Blocked (429)</div>
          <div className="font-mono-base text-[24px] font-semibold text-error tracking-tight">
            {deniedCount}
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant p-stack-md rounded">
          <div className="text-secondary font-label-caps text-label-caps uppercase mb-1">Throttle Rate %</div>
          <div className="font-mono-base text-[24px] font-semibold text-tertiary-container tracking-tight">
            {denyPercentage}%
          </div>
        </div>
      </div>

      {/* Replay Stream Chart & Log Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-stack-md">
        {/* Stream Chart */}
        <div className="lg:col-span-6 bg-surface-container-lowest border border-outline-variant p-stack-md rounded flex flex-col justify-between">
          <h2 className="font-headline-md text-headline-md font-semibold text-on-surface mb-stack-md pb-stack-sm border-b border-outline-variant">
            Live Stream Throughput Chart
          </h2>

          <div className="h-[260px] w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="allowedStream" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0058be" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#0058be" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="deniedStream" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ba1a1a" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#ba1a1a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e1e2e4" />
                  <XAxis dataKey="step" stroke="#727785" fontSize={11} fontFamily="Geist Mono" />
                  <YAxis stroke="#727785" fontSize={11} fontFamily="Geist Mono" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderColor: "#c2c6d6",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontFamily: "Geist Mono",
                    }}
                  />
                  <Area type="monotone" dataKey="allowed" name="Allowed" stroke="#0058be" strokeWidth={2} fill="url(#allowedStream)" />
                  <Area type="monotone" dataKey="denied" name="Denied" stroke="#ba1a1a" strokeWidth={2} fill="url(#deniedStream)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center font-mono-sm text-secondary">
                Click "Start Traffic Replay" to visualize real-time request decisions!
              </div>
            )}
          </div>
        </div>

        {/* Live Replay Event Stream Log */}
        <div className="lg:col-span-6 bg-surface-container-lowest border border-outline-variant p-stack-md rounded flex flex-col justify-between">
          <div className="flex justify-between items-center mb-stack-md pb-stack-sm border-b border-outline-variant">
            <h2 className="font-headline-md text-headline-md font-semibold text-on-surface">Replay Telemetry Stream</h2>
            <span className="font-mono-sm text-[11px] text-secondary">{events.length} events received</span>
          </div>

          <div ref={logContainerRef} className="h-[260px] overflow-y-auto space-y-2 font-mono-sm pr-1">
            {events.length > 0 ? (
              events.map((ev, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded border text-body-sm space-y-1 transition-all ${
                    ev.allowed ? "bg-emerald-50 border-emerald-200 text-emerald-950" : "bg-error-container/30 border-error-container text-error"
                  }`}
                >
                  <div className="flex justify-between items-center font-bold">
                    <span className="font-sans">{ev.tenantName}</span>
                    <span>{ev.allowed ? "200 ALLOWED" : `429 BLOCKED (Retry ${ev.retryAfterSec}s)`}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-secondary font-mono-sm">
                    <span>Algorithm: {ev.algorithm}</span>
                    <span>Quota: {ev.remaining} / {ev.limit}</span>
                    <span>Latency: {ev.latencyMs} ms</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex h-full items-center justify-center text-secondary font-mono-sm">
                Waiting for traffic replay execution...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

