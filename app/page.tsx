import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-stack-lg max-w-5xl mx-auto py-stack-lg">
      {/* Hero Header */}
      <div className="bg-surface-container-lowest border border-outline-variant p-8 md:p-12 rounded space-y-6 text-center">
        <div className="inline-flex items-center gap-2 bg-primary-fixed/40 text-primary border border-primary-fixed px-3 py-1 rounded font-mono-sm text-[11px] font-bold">
          <span className="w-2 h-2 bg-primary rounded-full animate-ping"></span>
          INDUSTRIAL INFRASTRUCTURE CONTROL PLANE
        </div>

        <h1 className="font-headline-lg text-[36px] md:text-[48px] font-bold text-on-surface leading-tight tracking-tight max-w-3xl mx-auto">
          QuotaForge — Multi-Tenant API Rate Limiting Platform
        </h1>

        <p className="font-body-base text-[16px] text-secondary max-w-2xl mx-auto leading-relaxed">
          High-performance API rate limiting & quota enforcement gateway powered by atomic Redis LUA evaluations, token bucket & sliding window algorithms, and real-time operational telemetry.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-stack-md pt-4">
          <Link
            href="/dashboard"
            className="bg-primary hover:bg-primary-container text-on-primary font-label-caps text-label-caps uppercase px-6 py-3.5 rounded flex items-center gap-2 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">dashboard</span>
            Open Control Plane Dashboard
          </Link>
          <Link
            href="/dashboard/replay"
            className="bg-surface-container-lowest border border-outline-variant text-on-surface font-label-caps text-label-caps uppercase px-6 py-3.5 rounded hover:bg-surface-container-low transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">play_arrow</span>
            Launch Traffic Replay
          </Link>
        </div>
      </div>

      {/* Feature Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-stack-md">
        <div className="bg-surface-container-lowest border border-outline-variant p-stack-md rounded space-y-2">
          <div className="font-headline-md text-headline-md font-semibold text-on-surface">Atomic Execution</div>
          <p className="font-body-sm text-body-sm text-secondary">
            Redis LUA scripts evaluate rate limits single-threaded in under 0.4ms. Zero race conditions under high concurrent load.
          </p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant p-stack-md rounded space-y-2">
          <div className="font-headline-md text-headline-md font-semibold text-on-surface">Dual Algorithms</div>
          <p className="font-body-sm text-body-sm text-secondary">
            Supports both Token Bucket (burst allowance) and Sliding Window Log (strict boundary) algorithms per tenant.
          </p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant p-stack-md rounded space-y-2">
          <div className="font-headline-md text-headline-md font-semibold text-on-surface">Worker Rollups</div>
          <p className="font-body-sm text-body-sm text-secondary">
            Background pipeline aggregates raw append-only usage logs into hourly rollups for sub-millisecond reporting queries.
          </p>
        </div>
      </div>
    </div>
  );
}

