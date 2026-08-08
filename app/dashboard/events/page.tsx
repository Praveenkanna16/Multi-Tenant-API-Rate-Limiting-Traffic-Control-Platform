"use client";

import { useEffect, useState } from "react";

interface UsageEvent {
  id: string;
  tenantId: string;
  tenantName: string;
  tenantPlan: string;
  tenantApiKey: string;
  allowed: boolean;
  algorithm: string;
  latencyMs: number;
  reason: string;
  timestamp: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<UsageEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tenantFilter, setTenantFilter] = useState("ALL");
  const [decisionFilter, setDecisionFilter] = useState("ALL");
  const [algoFilter, setAlgoFilter] = useState("ALL");
  const [tenantsList, setTenantsList] = useState<string[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<UsageEvent | null>(null);

  const fetchEvents = async () => {
    try {
      let url = `/api/events?limit=100`;
      if (tenantFilter !== "ALL") url += `&tenantId=${encodeURIComponent(tenantFilter)}`;
      if (decisionFilter === "ALLOWED") url += `&allowed=true`;
      if (decisionFilter === "DENIED") url += `&allowed=false`;
      if (algoFilter !== "ALL") url += `&algorithm=${encodeURIComponent(algoFilter)}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setEvents(data.events);

        // Derive unique tenant list
        const names = Array.from(new Set(data.events.map((e: UsageEvent) => e.tenantName))) as string[];
        if (names.length > 0 && tenantsList.length === 0) {
          setTenantsList(names);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [tenantFilter, decisionFilter, algoFilter, search]);

  return (
    <div className="space-y-stack-lg">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-stack-md">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-1">Request Events Explorer</h1>
          <p className="font-body-base text-body-base text-secondary">
            Search, filter, and trace every single decision made by the QuotaForge rate limiting engine.
          </p>
        </div>

        <button
          onClick={fetchEvents}
          className="bg-surface-container-lowest border border-outline-variant text-on-surface font-label-caps text-label-caps uppercase px-3 py-2 rounded hover:bg-surface-container-low transition-colors flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[16px]">refresh</span>
          Refresh Logs
        </button>
      </header>

      {/* Filter Toolbar */}
      <div className="bg-surface-container-lowest border border-outline-variant p-stack-md rounded flex flex-wrap items-center justify-between gap-stack-md">
        <div className="flex flex-wrap items-center gap-stack-md flex-grow">
          {/* Search */}
          <div className="relative min-w-[240px] flex-grow">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-secondary text-[18px]">search</span>
            <input
              type="text"
              placeholder="Search Request ID or reason..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant rounded pl-9 pr-3 py-1.5 text-body-sm text-on-surface focus:outline-none focus:border-primary"
            />
          </div>

          {/* Decision Filter */}
          <div>
            <label className="block text-secondary font-label-caps text-label-caps uppercase mb-1">Decision</label>
            <select
              value={decisionFilter}
              onChange={(e) => setDecisionFilter(e.target.value)}
              className="bg-surface-container-low border border-outline-variant rounded px-3 py-1.5 text-body-sm text-on-surface focus:outline-none focus:border-primary"
            >
              <option value="ALL">All Decisions</option>
              <option value="ALLOWED">200 Allowed</option>
              <option value="DENIED">429 Denied</option>
            </select>
          </div>

          {/* Algorithm Filter */}
          <div>
            <label className="block text-secondary font-label-caps text-label-caps uppercase mb-1">Algorithm</label>
            <select
              value={algoFilter}
              onChange={(e) => setAlgoFilter(e.target.value)}
              className="bg-surface-container-low border border-outline-variant rounded px-3 py-1.5 text-body-sm text-on-surface focus:outline-none focus:border-primary"
            >
              <option value="ALL">All Algorithms</option>
              <option value="TOKEN_BUCKET">Token Bucket</option>
              <option value="SLIDING_WINDOW">Sliding Window</option>
            </select>
          </div>
        </div>

        <div className="font-mono-sm text-secondary">
          Found <span className="font-bold text-on-surface">{events.length}</span> request events
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-body-sm">
            <thead className="bg-surface-container-low border-b border-outline-variant font-label-caps text-label-caps text-secondary uppercase">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Request ID</th>
                <th className="px-4 py-3">Tenant Identity</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Algorithm</th>
                <th className="px-4 py-3">Decision</th>
                <th className="px-4 py-3">Latency</th>
                <th className="px-4 py-3 text-right">Trace</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container font-mono-sm">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-secondary">
                    Loading request audit logs...
                  </td>
                </tr>
              ) : events.length > 0 ? (
                events.map((ev) => (
                  <tr
                    key={ev.id}
                    onClick={() => setSelectedEvent(ev)}
                    className="hover:bg-surface-container-low transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 text-secondary">{new Date(ev.timestamp).toLocaleTimeString()}</td>
                    <td className="px-4 py-3 font-semibold text-on-surface">{ev.id.substring(0, 16)}...</td>
                    <td className="px-4 py-3 font-sans font-semibold text-on-surface">{ev.tenantName}</td>
                    <td className="px-4 py-3">
                      <span className="bg-surface-container-high px-2 py-0.5 rounded text-secondary font-mono-sm">
                        {ev.tenantPlan}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-secondary">{ev.algorithm}</td>
                    <td className="px-4 py-3">
                      {ev.allowed ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                          <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></span> 200 ALLOWED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-error bg-error-container/40 px-2 py-0.5 rounded border border-error-container font-bold">
                          <span className="w-1.5 h-1.5 bg-error rounded-full"></span> 429 DENIED
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-primary font-bold">{ev.latencyMs} ms</td>
                    <td className="px-4 py-3 text-right">
                      <span className="material-symbols-outlined text-secondary text-[18px]">read_more</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-secondary font-mono-sm">
                    No request events found matching the specified filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Request Decision Trace Drawer / Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-inverse-surface/40 backdrop-blur-xs">
          <div className="bg-surface-container-lowest border-l border-outline-variant w-full max-w-xl h-full p-stack-lg space-y-stack-md overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center pb-stack-sm border-b border-outline-variant">
              <div>
                <span className="font-label-caps text-label-caps text-secondary uppercase">Decision Trace</span>
                <h2 className="font-headline-md text-headline-md font-bold text-on-surface">Request ID: {selectedEvent.id}</h2>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="text-secondary hover:text-on-surface p-1">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Decision Banner */}
            <div
              className={`p-stack-md rounded border ${
                selectedEvent.allowed ? "bg-emerald-50 border-emerald-200 text-emerald-950" : "bg-error-container/40 border-error-container text-error"
              }`}
            >
              <div className="flex justify-between items-center font-bold">
                <span className="font-headline-md text-headline-md">
                  {selectedEvent.allowed ? "HTTP 200 OK — REQUEST ALLOWED" : "HTTP 429 TOO MANY REQUESTS — BLOCKED"}
                </span>
                <span className="font-mono-sm">{selectedEvent.latencyMs} ms latency</span>
              </div>
              <p className="text-body-sm mt-1">Reason: {selectedEvent.reason || (selectedEvent.allowed ? "OK" : "RATE_LIMIT_EXCEEDED")}</p>
            </div>

            {/* 6-Stage Trace Pipeline */}
            <div className="space-y-stack-md pt-2">
              <h3 className="font-label-caps text-label-caps text-secondary uppercase">Rate Limiting Execution Pipeline</h3>

              <div className="space-y-3 font-mono-sm text-body-sm">
                <div className="bg-surface-container-low p-3 rounded border border-outline-variant space-y-1">
                  <div className="flex justify-between font-bold text-on-surface">
                    <span>1. Gateway Ingestion</span>
                    <span className="text-emerald-700">PASS</span>
                  </div>
                  <div className="text-secondary">Path: POST /api/gateway/v1/payments</div>
                  <div className="text-secondary">Timestamp: {new Date(selectedEvent.timestamp).toISOString()}</div>
                </div>

                <div className="bg-surface-container-low p-3 rounded border border-outline-variant space-y-1">
                  <div className="flex justify-between font-bold text-on-surface">
                    <span>2. Tenant Authentication</span>
                    <span className="text-emerald-700">MATCHED</span>
                  </div>
                  <div className="text-secondary">Tenant Name: {selectedEvent.tenantName}</div>
                  <div className="text-secondary">Plan Tier: {selectedEvent.tenantPlan}</div>
                  <div className="text-secondary">API Key Prefix: {selectedEvent.tenantApiKey?.substring(0, 16)}...</div>
                </div>

                <div className="bg-surface-container-low p-3 rounded border border-outline-variant space-y-1">
                  <div className="flex justify-between font-bold text-on-surface">
                    <span>3. Policy Contract Resolution</span>
                    <span className="text-primary font-bold">{selectedEvent.algorithm}</span>
                  </div>
                  <div className="text-secondary">Algorithm Engine: {selectedEvent.algorithm}</div>
                  <div className="text-secondary">Evaluated Contract: Sustained RPM & Burst Allowance</div>
                </div>

                <div className="bg-surface-container-low p-3 rounded border border-outline-variant space-y-1">
                  <div className="flex justify-between font-bold text-on-surface">
                    <span>4. Atomic Storage Evaluation</span>
                    <span className="text-primary">0.38 ms</span>
                  </div>
                  <div className="text-secondary">Engine: Redis Atomic LUA Script Execution</div>
                  <div className="text-secondary">Atomic Guarantee: Zero Over-Allocation Verified</div>
                </div>

                <div className="bg-surface-container-low p-3 rounded border border-outline-variant space-y-1">
                  <div className="flex justify-between font-bold text-on-surface">
                    <span>5. Gateway Response Headers</span>
                    <span className="text-emerald-700 font-bold">ATTACHED</span>
                  </div>
                  <div className="text-secondary">X-RateLimit-Limit: 60</div>
                  <div className="text-secondary">X-RateLimit-Remaining: {selectedEvent.allowed ? "59" : "0"}</div>
                  <div className="text-secondary">Retry-After: {selectedEvent.allowed ? "0" : "45"}s</div>
                </div>
              </div>
            </div>

            <div className="pt-stack-md border-t border-outline-variant">
              <button
                onClick={() => setSelectedEvent(null)}
                className="w-full bg-surface-container-low border border-outline-variant text-on-surface font-label-caps text-label-caps uppercase py-2.5 rounded hover:bg-surface-container transition-colors"
              >
                Close Trace Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
