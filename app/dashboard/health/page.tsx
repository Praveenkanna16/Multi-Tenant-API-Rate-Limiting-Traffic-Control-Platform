"use client";

import { useEffect, useState } from "react";

interface HealthData {
  services: {
    gateway: {
      status: string;
      latencyMs: number;
      uptimePercent: number;
      version: string;
    };
    redis: {
      status: string;
      type: string;
      activeKeys: number;
      hitRatePercent: number;
      memoryUsageMb: number;
    };
    database: {
      status: string;
      provider: string;
      latencyMs: number;
      totalTenants: number;
      totalEvents: number;
      totalRollups: number;
    };
    rollupWorker: {
      status: string;
      lastRollupTime: string;
      intervalMinutes: number;
    };
  };
  securityAudit: {
    hashingAlgorithm: string;
    keyPrefix: string;
    activeApiKeys: number;
    exposureRisk: string;
  };
}

export default function SystemHealthPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    try {
      const res = await fetch("/api/health");
      const data = await res.json();
      if (data.success) {
        setHealth(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-3 text-primary font-body-base">
          <span className="material-symbols-outlined animate-spin text-[24px]">progress_activity</span>
          <span className="font-headline-md text-headline-md font-semibold">Performing Infrastructure Health Checks...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-stack-lg">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-stack-md">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-1">System Health & Security</h1>
          <p className="font-body-base text-body-base text-secondary">
            Monitor Redis cluster connectivity, database health, worker rollup status, and API key security.
          </p>
        </div>

        <button
          onClick={fetchHealth}
          className="bg-surface-container-lowest border border-outline-variant text-on-surface font-label-caps text-label-caps uppercase px-3 py-2 rounded hover:bg-surface-container-low transition-colors flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[16px]">refresh</span>
          Run Health Diagnostics
        </button>
      </header>

      {/* Services Health Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-stack-md">
        {/* Gateway */}
        <div className="bg-surface-container-lowest border border-outline-variant p-stack-md rounded space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-headline-md text-[16px] font-bold text-on-surface">Rate Limit Gateway</span>
            <span className="inline-flex items-center gap-1 font-mono-sm text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
              <span className="w-2 h-2 bg-emerald-600 rounded-full animate-ping"></span>
              {health?.services.gateway.status}
            </span>
          </div>
          <div className="space-y-1 font-mono-sm text-body-sm pt-2">
            <div className="flex justify-between border-b border-surface-container pb-1 text-secondary">
              <span>Avg Latency:</span>
              <span className="font-bold text-primary">{health?.services.gateway.latencyMs} ms</span>
            </div>
            <div className="flex justify-between border-b border-surface-container pb-1 text-secondary">
              <span>System Uptime:</span>
              <span className="font-bold text-on-surface">{health?.services.gateway.uptimePercent}%</span>
            </div>
            <div className="flex justify-between text-secondary">
              <span>Gateway Version:</span>
              <span className="font-bold text-on-surface">{health?.services.gateway.version}</span>
            </div>
          </div>
        </div>

        {/* Redis Engine */}
        <div className="bg-surface-container-lowest border border-outline-variant p-stack-md rounded space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-headline-md text-[16px] font-bold text-on-surface">Redis Storage</span>
            <span className="inline-flex items-center gap-1 font-mono-sm text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
              <span className="w-2 h-2 bg-emerald-600 rounded-full"></span>
              {health?.services.redis.status}
            </span>
          </div>
          <div className="space-y-1 font-mono-sm text-body-sm pt-2">
            <div className="flex justify-between border-b border-surface-container pb-1 text-secondary">
              <span>Active Bucket Keys:</span>
              <span className="font-bold text-on-surface">{health?.services.redis.activeKeys}</span>
            </div>
            <div className="flex justify-between border-b border-surface-container pb-1 text-secondary">
              <span>Cache Hit Rate:</span>
              <span className="font-bold text-emerald-700">{health?.services.redis.hitRatePercent}%</span>
            </div>
            <div className="flex justify-between text-secondary">
              <span>RAM Allocation:</span>
              <span className="font-bold text-on-surface">{health?.services.redis.memoryUsageMb} MB</span>
            </div>
          </div>
        </div>

        {/* Database */}
        <div className="bg-surface-container-lowest border border-outline-variant p-stack-md rounded space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-headline-md text-[16px] font-bold text-on-surface">Database Engine</span>
            <span className="inline-flex items-center gap-1 font-mono-sm text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
              <span className="w-2 h-2 bg-emerald-600 rounded-full"></span>
              {health?.services.database.status}
            </span>
          </div>
          <div className="space-y-1 font-mono-sm text-body-sm pt-2">
            <div className="flex justify-between border-b border-surface-container pb-1 text-secondary">
              <span>Query Latency:</span>
              <span className="font-bold text-primary">{health?.services.database.latencyMs} ms</span>
            </div>
            <div className="flex justify-between border-b border-surface-container pb-1 text-secondary">
              <span>Total Audit Events:</span>
              <span className="font-bold text-on-surface">{health?.services.database.totalEvents}</span>
            </div>
            <div className="flex justify-between text-secondary">
              <span>Rollup Records:</span>
              <span className="font-bold text-on-surface">{health?.services.database.totalRollups}</span>
            </div>
          </div>
        </div>

        {/* Rollup Worker */}
        <div className="bg-surface-container-lowest border border-outline-variant p-stack-md rounded space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-headline-md text-[16px] font-bold text-on-surface">Rollup Worker</span>
            <span className="inline-flex items-center gap-1 font-mono-sm text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
              <span className="w-2 h-2 bg-emerald-600 rounded-full"></span>
              {health?.services.rollupWorker.status}
            </span>
          </div>
          <div className="space-y-1 font-mono-sm text-body-sm pt-2">
            <div className="flex justify-between border-b border-surface-container pb-1 text-secondary">
              <span>Job Interval:</span>
              <span className="font-bold text-on-surface">{health?.services.rollupWorker.intervalMinutes} min</span>
            </div>
            <div className="flex justify-between text-secondary">
              <span>Last Execution:</span>
              <span className="font-bold text-on-surface truncate max-w-[120px]">
                {health?.services.rollupWorker.lastRollupTime ? new Date(health.services.rollupWorker.lastRollupTime).toLocaleTimeString() : "Now"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Security Audit Card */}
      <div className="bg-surface-container-lowest border border-outline-variant p-stack-md rounded space-y-stack-md">
        <div className="flex justify-between items-center pb-2 border-b border-outline-variant">
          <div>
            <h2 className="font-headline-md text-headline-md font-semibold text-on-surface">API Key Security Audit</h2>
            <p className="text-body-sm text-secondary">Cryptographic hashing & credential isolation validation</p>
          </div>
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded font-mono-sm font-bold text-[11px]">
            PASSED AUDIT
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-stack-md font-mono-sm text-body-sm">
          <div className="bg-surface-container-low p-3 rounded border border-outline-variant">
            <div className="text-secondary text-[11px] font-label-caps uppercase mb-1">Hash Algorithm</div>
            <div className="font-bold text-on-surface">{health?.securityAudit.hashingAlgorithm}</div>
          </div>

          <div className="bg-surface-container-low p-3 rounded border border-outline-variant">
            <div className="text-secondary text-[11px] font-label-caps uppercase mb-1">Key Prefix Standard</div>
            <div className="font-bold text-primary">{health?.securityAudit.keyPrefix}</div>
          </div>

          <div className="bg-surface-container-low p-3 rounded border border-outline-variant">
            <div className="text-secondary text-[11px] font-label-caps uppercase mb-1">Active Credentials</div>
            <div className="font-bold text-on-surface">{health?.securityAudit.activeApiKeys} Keys Monitored</div>
          </div>

          <div className="bg-surface-container-low p-3 rounded border border-outline-variant">
            <div className="text-secondary text-[11px] font-label-caps uppercase mb-1">Database Exposure Risk</div>
            <div className="font-bold text-emerald-700">{health?.securityAudit.exposureRisk}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
