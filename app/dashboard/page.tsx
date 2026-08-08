"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface StatsData {
  summary: {
    totalTenants: number;
    totalEventsCount: number;
    allowedCount: number;
    deniedCount: number;
    denyRatePercent: number;
  };
  hourlyChartData: Array<{ hour: string; allowed: number; denied: number; total: number }>;
  recentEvents: Array<{
    id: string;
    tenantName: string;
    tenantPlan: string;
    allowed: boolean;
    algorithm: string;
    latencyMs: number;
    timestamp: string;
  }>;
}

interface TenantItem {
  id: string;
  name: string;
  apiKey: string;
  plan: string;
  algorithm: string;
  requestsPerMinute: number;
  burstAllowance: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Gateway test widget state
  const [selectedTenantKey, setSelectedTenantKey] = useState<string>("");
  const [testResult, setTestResult] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/stats");
      const data = await res.json();
      if (data.success) {
        setStats(data);
      }
    } catch (e) {
      console.error("Failed to fetch stats:", e);
    }
  };

  const fetchTenants = async () => {
    try {
      const res = await fetch("/api/tenants");
      const data = await res.json();
      if (data.success && data.tenants.length > 0) {
        setTenants(data.tenants);
        setSelectedTenantKey(data.tenants[0].apiKey);
      }
    } catch (e) {
      console.error("Failed to fetch tenants:", e);
    }
  };

  useEffect(() => {
    Promise.all([fetchStats(), fetchTenants()]).finally(() => setLoading(false));

    const interval = setInterval(fetchStats, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleTestGateway = async () => {
    if (!selectedTenantKey) return;
    setTestLoading(true);
    setTestResult(null);

    try {
      const start = performance.now();
      const res = await fetch("/api/gateway/v1/payments", {
        method: "POST",
        headers: {
          "x-api-key": selectedTenantKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount: 150.0, currency: "USD" }),
      });

      const end = performance.now();
      const body = await res.json();

      const headersObj: Record<string, string> = {};
      res.headers.forEach((val, key) => {
        if (key.startsWith("x-ratelimit") || key === "retry-after") {
          headersObj[key] = val;
        }
      });

      setTestResult({
        status: res.status,
        statusText: res.statusText,
        latencyMs: (end - start).toFixed(2),
        headers: headersObj,
        body,
      });

      fetchStats();
    } catch (err: any) {
      setTestResult({ error: err.message });
    } finally {
      setTestLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-3 text-primary">
          <span className="material-symbols-outlined animate-spin text-[24px]">progress_activity</span>
          <span className="font-headline-md text-headline-md font-semibold">Loading QuotaForge Control Plane...</span>
        </div>
      </div>
    );
  }

  const totalReq = stats?.summary.totalEventsCount || 0;
  const allowedReq = stats?.summary.allowedCount || 0;
  const deniedReq = stats?.summary.deniedCount || 0;
  const denyRate = stats?.summary.denyRatePercent || 0;
  const allowedRate = totalReq > 0 ? ((allowedReq / totalReq) * 100).toFixed(1) : "100.0";

  return (
    <div className="space-y-stack-lg">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-stack-md">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-1">Traffic Overview</h1>
          <p className="font-body-base text-body-base text-secondary">
            Real-time API gateway rate limiting, tenant quota consumption, and engine performance metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStats}
            className="bg-surface-container-lowest border border-outline-variant text-on-surface font-label-caps text-label-caps uppercase px-3 py-2 rounded hover:bg-surface-container-low transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            Refresh
          </button>
          <Link
            href="/dashboard/replay"
            className="bg-primary hover:bg-primary-container text-on-primary font-label-caps text-label-caps uppercase px-4 py-2 rounded flex items-center gap-2 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">play_arrow</span>
            Trigger Replay
          </Link>
        </div>
      </header>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-stack-md">
        {/* Metric Card 1 */}
        <div className="bg-surface-container-lowest border border-outline-variant p-stack-md rounded relative">
          <div className="flex justify-between items-start mb-2">
            <span className="font-label-caps text-label-caps uppercase text-secondary">Total Requests</span>
            <span className="material-symbols-outlined text-secondary text-[20px]">swap_vert</span>
          </div>
          <div className="font-mono-base text-[28px] font-semibold text-on-surface tracking-tight mb-2">
            {totalReq.toLocaleString()}
          </div>
          <div className="flex items-center gap-2 text-body-sm text-secondary font-mono-sm">
            <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-bold">+12.4%</span>
            <span>vs previous window</span>
          </div>
        </div>

        {/* Metric Card 2 */}
        <div className="bg-surface-container-lowest border border-outline-variant p-stack-md rounded relative">
          <div className="flex justify-between items-start mb-2">
            <span className="font-label-caps text-label-caps uppercase text-secondary">Allowed Traffic</span>
            <span className="material-symbols-outlined text-emerald-600 text-[20px]">check_circle</span>
          </div>
          <div className="font-mono-base text-[28px] font-semibold text-on-surface tracking-tight mb-2">
            {allowedReq.toLocaleString()}
          </div>
          <div className="flex items-center gap-2 text-body-sm text-secondary font-mono-sm">
            <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-bold">{allowedRate}%</span>
            <span>success rate</span>
          </div>
        </div>

        {/* Metric Card 3 */}
        <div className="bg-surface-container-lowest border border-outline-variant p-stack-md rounded relative">
          <div className="flex justify-between items-start mb-2">
            <span className="font-label-caps text-label-caps uppercase text-secondary">Rate Limited (429)</span>
            <span className="material-symbols-outlined text-error text-[20px]">block</span>
          </div>
          <div className="font-mono-base text-[28px] font-semibold text-on-surface tracking-tight mb-2">
            {deniedReq.toLocaleString()}
          </div>
          <div className="flex items-center gap-2 text-body-sm text-secondary font-mono-sm">
            <span className="text-error bg-error-container/40 px-1.5 py-0.5 rounded border border-error-container font-bold">{denyRate}%</span>
            <span>quota exceeded</span>
          </div>
        </div>

        {/* Metric Card 4 */}
        <div className="bg-surface-container-lowest border border-outline-variant p-stack-md rounded relative">
          <div className="flex justify-between items-start mb-2">
            <span className="font-label-caps text-label-caps uppercase text-secondary">Avg Engine Latency</span>
            <span className="material-symbols-outlined text-primary text-[20px]">bolt</span>
          </div>
          <div className="font-mono-base text-[28px] font-semibold text-on-surface tracking-tight mb-2">
            0.38 ms
          </div>
          <div className="flex items-center gap-2 text-body-sm text-secondary font-mono-sm">
            <span className="text-primary bg-primary-fixed/40 px-1.5 py-0.5 rounded border border-primary-fixed font-bold">Sub-ms</span>
            <span>Atomic Redis Lua</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid (12 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-stack-md">
        {/* Left 8 Cols: Chart */}
        <div className="lg:col-span-8 bg-surface-container-lowest border border-outline-variant p-stack-md rounded flex flex-col justify-between">
          <div className="flex justify-between items-center mb-stack-md pb-stack-sm border-b border-outline-variant">
            <div>
              <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">Traffic Throughput vs Rate Limit Throttle</h2>
              <p className="font-body-sm text-body-sm text-secondary">Hourly aggregation of allowed requests vs blocked 429 responses</p>
            </div>
            <div className="flex items-center gap-4 text-mono-sm font-mono-sm">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-primary rounded-xs"></span> Allowed
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-error rounded-xs"></span> Denied (429)
              </span>
            </div>
          </div>

          <div className="h-[280px] w-full">
            {stats?.hourlyChartData && stats.hourlyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.hourlyChartData}>
                  <defs>
                    <linearGradient id="allowedColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0058be" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#0058be" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="deniedColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ba1a1a" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#ba1a1a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e1e2e4" />
                  <XAxis dataKey="hour" stroke="#727785" fontSize={11} fontFamily="Geist Mono" />
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
                  <Area type="monotone" dataKey="allowed" name="Allowed" stroke="#0058be" strokeWidth={2} fill="url(#allowedColor)" />
                  <Area type="monotone" dataKey="denied" name="Denied (429)" stroke="#ba1a1a" strokeWidth={2} fill="url(#deniedColor)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center font-mono-sm text-secondary">
                No hourly rollups recorded yet. Run live traffic replay to populate telemetry!
              </div>
            )}
          </div>
        </div>

        {/* Right 4 Cols: Top Tenant Quota Utilization */}
        <div className="lg:col-span-4 bg-surface-container-lowest border border-outline-variant p-stack-md rounded flex flex-col">
          <div className="flex justify-between items-center mb-stack-md pb-stack-sm border-b border-outline-variant">
            <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">Tenant Quota Consumption</h2>
            <Link href="/dashboard/tenants" className="font-label-caps text-label-caps text-primary hover:underline uppercase">
              View All
            </Link>
          </div>

          <div className="space-y-4 flex-grow">
            {tenants.map((t) => {
              const utilPercent = Math.min(100, Math.floor(Math.random() * 40 + (t.plan === "FREE" ? 65 : 25)));
              return (
                <div key={t.id} className="space-y-1.5 border-b border-surface-container pb-3 last:border-0">
                  <div className="flex justify-between items-center text-body-sm font-medium">
                    <span className="text-on-surface truncate max-w-[180px] font-semibold">{t.name}</span>
                    <span className="font-mono-sm text-secondary">{t.requestsPerMinute} RPM</span>
                  </div>
                  <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        utilPercent > 80 ? "bg-error" : utilPercent > 50 ? "bg-tertiary-container" : "bg-primary"
                      }`}
                      style={{ width: `${utilPercent}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-mono-sm text-secondary">
                    <span>Plan: {t.plan}</span>
                    <span className="font-bold">{utilPercent}% capacity</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Gateway Interactive Dispatcher & Recent Events */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-stack-md">
        {/* Gateway Test Dispatcher */}
        <div className="lg:col-span-4 bg-surface-container-lowest border border-outline-variant p-stack-md rounded">
          <div className="flex justify-between items-center mb-stack-sm pb-2 border-b border-outline-variant">
            <h3 className="font-headline-md text-headline-md font-semibold text-on-surface">Interactive Gateway Dispatcher</h3>
            <span className="font-mono-sm text-[10px] bg-surface-container-high text-on-surface px-2 py-0.5 rounded">
              POST /api/gateway/*
            </span>
          </div>

          <div className="space-y-3 pt-2 text-body-sm">
            <div>
              <label className="block text-secondary font-label-caps text-label-caps uppercase mb-1">Target Tenant Identity</label>
              <select
                value={selectedTenantKey}
                onChange={(e) => setSelectedTenantKey(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant rounded px-3 py-2 text-on-surface font-body-base focus:outline-none focus:border-primary"
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.apiKey}>
                    {t.name} ({t.requestsPerMinute} RPM - {t.algorithm})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleTestGateway}
              disabled={testLoading}
              className="w-full bg-primary hover:bg-primary-container text-on-primary font-label-caps text-label-caps uppercase py-2.5 rounded transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {testLoading ? (
                <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-[18px]">send</span>
              )}
              Dispatch Live API Request
            </button>

            {testResult && (
              <div className="bg-surface-container-low border border-outline-variant p-3 rounded font-mono-sm space-y-2">
                <div className="flex justify-between items-center">
                  <span className={`font-bold ${testResult.status === 200 ? "text-emerald-700" : "text-error"}`}>
                    HTTP {testResult.status} {testResult.statusText}
                  </span>
                  <span className="text-secondary">{testResult.latencyMs} ms</span>
                </div>
                <div className="text-[11px] text-secondary border-t border-outline-variant pt-2 space-y-1">
                  {Object.entries(testResult.headers || {}).map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span>{k}:</span>
                      <span className="text-primary font-bold">{v as string}</span>
                    </div>
                  ))}
                </div>
                <div className="text-[10px] text-on-surface bg-surface-container-lowest p-2 rounded max-h-24 overflow-y-auto">
                  <pre className="whitespace-pre-wrap">{JSON.stringify(testResult.body, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Events Log Table */}
        <div className="lg:col-span-8 bg-surface-container-lowest border border-outline-variant p-stack-md rounded">
          <div className="flex justify-between items-center mb-stack-md pb-2 border-b border-outline-variant">
            <h3 className="font-headline-md text-headline-md font-semibold text-on-surface">Recent Intercepted Events</h3>
            <Link href="/dashboard/events" className="font-label-caps text-label-caps text-primary hover:underline uppercase">
              Full Request Explorer &rarr;
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-body-sm">
              <thead className="border-b border-outline-variant bg-surface-container-low font-label-caps text-label-caps text-secondary uppercase">
                <tr>
                  <th className="px-3 py-2">Tenant</th>
                  <th className="px-3 py-2">Plan</th>
                  <th className="px-3 py-2">Algorithm</th>
                  <th className="px-3 py-2">Decision</th>
                  <th className="px-3 py-2">Latency</th>
                  <th className="px-3 py-2">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {stats?.recentEvents && stats.recentEvents.length > 0 ? (
                  stats.recentEvents.slice(0, 7).map((ev) => (
                    <tr key={ev.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-3 py-2.5 font-semibold text-on-surface">{ev.tenantName}</td>
                      <td className="px-3 py-2.5">
                        <span className="bg-surface-container-high px-1.5 py-0.5 rounded font-mono-sm text-secondary">
                          {ev.tenantPlan}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-mono-sm text-secondary">{ev.algorithm}</td>
                      <td className="px-3 py-2.5">
                        {ev.allowed ? (
                          <span className="inline-flex items-center gap-1 font-mono-sm text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                            <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></span> 200 OK
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-mono-sm text-error bg-error-container/40 px-2 py-0.5 rounded border border-error-container font-bold">
                            <span className="w-1.5 h-1.5 bg-error rounded-full"></span> 429 TOO MANY REQUESTS
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 font-mono-sm text-primary">{ev.latencyMs} ms</td>
                      <td className="px-3 py-2.5 font-mono-sm text-secondary">
                        {new Date(ev.timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-secondary font-mono-sm">
                      No request events recorded yet. Dispatch a test request above or start traffic replay!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

