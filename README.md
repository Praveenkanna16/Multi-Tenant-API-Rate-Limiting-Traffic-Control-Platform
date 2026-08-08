# QuotaForge

### Multi-Tenant API Rate Limiting & Traffic Control Platform

---

## What is QuotaForge?

QuotaForge is a system that controls how many requests different users or companies can send to an API. 

It acts as an infrastructure gateway layer in front of backend servers to prevent one customer from sending too many requests and slowing down or crashing the system for everyone else.

---

## Why Did I Build This?

When companies offer Web APIs (like payment gateways, artificial intelligence services, or messaging APIs), thousands of users connect at the same time:
* **Overload Prevention**: If a user sends a massive burst of requests, backend databases and servers can crash.
* **Fair Resource Sharing**: Different customers subscribe to different tiers (Free, Pro, Enterprise). Enterprise customers should get higher limits, while free users get lower limits.
* **Reliable Traffic Control**: Rate limiting must happen instantly (in under 1 millisecond) and accurately, even when hundreds of requests hit the system at the exact same moment.

QuotaForge was built to solve these critical infrastructure challenges with atomic, zero-race-condition accuracy and real-time operational visibility.

---

## How Does It Work?

```text
Client Application
       ↓
QuotaForge Gateway Proxy (/api/gateway/*)
       ↓
API Key Hashing & Tenant Lookup
       ↓
Atomic Redis Rate Limit Engine (Token Bucket / Sliding Window)
       ↓
┌───────────────────────┴───────────────────────┐
│                                               │
▼                                               ▼
Allowed (200 OK)                        Blocked (429 Too Many Requests)
↓                                               ↓
Protected Backend Resource              Stopped & Retry-After Header Returned
```

1. **Client sends request**: A user or app sends an HTTP request with an API Key.
2. **Gateway intercepts**: QuotaForge checks the API Key and finds the tenant's rate limit rules.
3. **Redis engine evaluates**: An atomic Redis script checks if the tenant has remaining capacity.
4. **Instant decision**: If within limit, the request proceeds to the backend resource (200 OK). If limit is exceeded, QuotaForge immediately stops the request and returns `HTTP 429 Too Many Requests`.

---

## What Can QuotaForge Do?

* **Multi-Tenant API Management**: Provision and manage isolated limits per customer or API Key.
* **Dual Rate Limiting Engines**: Switch between Token Bucket (allows smooth bursts) and Sliding Window Log (strict boundary control).
* **Zero Over-Allocation Guarantee**: Single-threaded atomic Redis evaluations ensure zero race conditions under 500+ parallel requests.
* **Live Traffic Replay Engine**: Stream live traffic patterns (Spiky, Burst, Mixed) over Server-Sent Events (SSE) with interactive architecture flow visualizers.
* **Real-time Live Traffic Monitor**: View streaming incoming requests, latency percentiles, and decision badges in real time.
* **Request Events Explorer**: Search, filter, and inspect detailed 6-stage decision traces for every intercepted request.
* **System Health & Diagnostics**: Real-time operational telemetry for Gateway, Redis, SQLite/Prisma, and background workers.
* **Idempotent Hourly Worker Rollups**: Background worker pipeline that aggregates raw logs into hourly summaries.

---

## Main Features

### 1. Multi-Tenant Management
Create, edit, and delete tenant identities. Each tenant receives a unique API key (stored securely as a SHA-256 hash) along with specific rate-limiting rules (Requests Per Minute and Burst Allowance).

### 2. Atomic Rate Limiting
Evaluates requests against Token Bucket or Sliding Window algorithms using single-threaded atomic execution, guaranteeing that limits are enforced accurately even during concurrent spikes.

### 3. Traffic Replay Engine
Simulate real-world traffic bursts and observe how the gateway processes, permits, or throttles incoming request streams in real time.

### 4. Request Events Explorer
Search and inspect full decision traces for any request. View the exact execution pipeline from authentication to Redis check and header output.

### 5. API Reference & Docs
Complete developer documentation detailing gateway routes (`/api/gateway/*`), authentication headers (`x-api-key`), standard rate limit headers, and interactive code snippets in cURL, JavaScript, Python, and Go.

---

## Architecture

```text
Frontend (Next.js 14 App Router + TailwindCSS + Recharts)
       ↓
Backend API Routes (/api/gateway, /api/tenants, /api/events, /api/replay)
       ↓
Redis Storage Engine (Atomic Lua Scripts)
       ↓
Database (Prisma ORM + SQLite / PostgreSQL)
       ↓
Background Rollup Worker (Hourly Idempotent Aggregates)
```

---

## Technology Stack

* **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Vanilla CSS & TailwindCSS, Recharts.
* **Backend**: Next.js Serverless Routes, Node.js, TypeScript.
* **Rate Limiting Engine**: Atomic Redis Lua Scripts & In-Memory Redis Engine.
* **Database**: Prisma ORM, SQLite / PostgreSQL.
* **Realtime**: Server-Sent Events (SSE) & WebSockets.
* **Testing**: Vitest unit & integration test runner, custom concurrency verification scripts.

---

## How Rate Limiting Works

1. **Request**: Client sends an API request to `/api/gateway/*`.
2. **Tenant & Policy**: Gateway resolves the tenant identity via `x-api-key` SHA-256 hash.
3. **Algorithm Check**:
   * **Token Bucket**: Refills tokens at a constant rate ($R = \frac{\text{RPM}}{60000}$ tokens/ms). Requests take 1 token. Burst capacity absorbs short spikes.
   * **Sliding Window Log**: Stores timestamps in a sorted set (`ZSET`). Prunes items older than 60 seconds and counts active requests.
4. **Redis Lua Execution**: The check occurs inside an atomic script in Redis.
5. **Decision**:
   * **Allowed**: HTTP 200 OK + `X-RateLimit-Remaining` header.
   * **Denied**: HTTP 429 Too Many Requests + `Retry-After` header.

---

## Example Request Flow

```bash
# Send an API request through the QuotaForge Gateway
curl -X POST http://localhost:3000/api/gateway/v1/payments \
  -H "x-api-key: qf_live_stripe_demo_key_998127391823" \
  -H "Content-Type: application/json" \
  -d '{"amount": 150.00, "currency": "USD"}'
```

**Response (HTTP 200 OK)**:
```json
{
  "success": true,
  "message": "Gateway granted request to protected backend resource.",
  "tenant": { "name": "Stripe Payment Services (Enterprise)", "plan": "ENTERPRISE" },
  "rateLimit": { "limit": 300, "remaining": 299, "algorithm": "TOKEN_BUCKET", "latencyMs": 0.38 }
}
```

---

## Project Structure

```text
quatoforge/
├── app/
│   ├── api/
│   │   ├── gateway/[...path]/   # API Gateway rate limiting proxy
│   │   ├── tenants/             # Tenant CRUD & API key management
│   │   ├── events/              # Request audit log search & filters
│   │   ├── health/              # Infrastructure health telemetry
│   │   ├── replay/              # SSE live traffic replay stream
│   │   ├── stats/               # Dashboard telemetry API
│   │   └── worker/rollup/       # Hourly rollup worker job
│   ├── dashboard/
│   │   ├── page.tsx             # Traffic Overview
│   │   ├── traffic/page.tsx     # Live Traffic Monitor
│   │   ├── tenants/page.tsx     # Tenant Management
│   │   ├── policies/page.tsx    # Policy Configuration
│   │   ├── analytics/page.tsx   # Usage Analytics
│   │   ├── events/page.tsx      # Request Events Explorer
│   │   ├── replay/page.tsx      # Traffic Replay Engine
│   │   └── health/page.tsx      # System Health & Security
│   ├── docs/page.tsx            # API Reference & Docs
│   ├── globals.css              # Global styles & Google fonts
│   └── layout.tsx               # Root layout & Stitch Top Navigation Bar
├── components/
│   └── Navbar.tsx               # Top 64px Navigation Bar
├── lib/
│   ├── rate-limiter/            # Token Bucket & Sliding Window algorithms
│   ├── worker/rollup.ts         # Hourly aggregation worker logic
│   ├── replay/                  # Synthetic traffic generator
│   ├── db.ts                    # Prisma client singleton
│   └── auth.ts                  # SHA-256 API key hashing
├── prisma/
│   ├── schema.prisma            # Database models (Tenant, UsageEvent, UsageRollup)
│   └── seed.ts                  # Seed script for initial tenants
├── tests/                       # Vitest test suites
├── scripts/                     # Concurrency verification test
├── README.md
└── package.json
```

---

## Getting Started

### 1. Clone Repository
```bash
git clone https://github.com/Praveenkanna16/Multi-Tenant-API-Rate-Limiting-Traffic-Control-Platform.git
cd Multi-Tenant-API-Rate-Limiting-Traffic-Control-Platform
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env` file in the root directory:
```env
DATABASE_URL="file:./dev.db"
```

### 4. Initialize Database & Seed Demo Data
```bash
npx prisma db push
npx tsx prisma/seed.ts
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Testing

### Run Vitest Unit Tests
```bash
npm test
```
Runs test cases verifying Token Bucket capacity, Sliding Window boundary enforcement, and atomic execution.

### Run Concurrency Race Condition Verification
```bash
npm run test:concurrency
```
Dispatches 100 simultaneous parallel requests against a tenant with capacity = 25 tokens. Asserts **exactly 25 allowed and 75 blocked (zero over-allocation)**.

---

## Deployment

The application can be deployed on Vercel or any Node.js hosting platform:
1. Connect GitHub repository to deployment service.
2. Configure `DATABASE_URL` environment variable.
3. Build command: `npm run build`
4. Start command: `npm start`

---

## Design System

The QuotaForge user interface is built on the **Industrial Minimalism & Precision Engineering** design system (`stitch_quotaforge_control_plane`):
* **Colors**: Light neutral background (`#F7F8FA`), white containers (`#FFFFFF`), outline borders (`#E2E8F0`), primary blue (`#0058BE`), error red (`#BA1A1A`).
* **Typography**: **Geist** for headlines, **Inter** for body copy, and **Geist Mono** for technical telemetry data.
* **Layout**: Fixed 64px Top Navigation Bar with clear active states and flat tonal depth.

---

## Engineering Decisions

* **Why Redis Lua Scripts?**: Traditional read-then-write database operations suffer from race conditions under parallel load. Redis executes Lua scripts atomically in a single thread, guaranteeing accurate counter updates.
* **Why Dual Algorithms?**: Token Bucket suits burstable API services (like file uploads), while Sliding Window Log suits strict security APIs (like login or payment endpoints).
* **Why Asynchronous Event Logging?**: Gateway evaluation returns in <0.4ms; event logging to the database occurs asynchronously so backend latency is not impacted.
* **Why Idempotent Rollups?**: The background worker aggregates events using composite keys `(tenantId, hourBucket)`, preventing duplicate counts during worker retries.

---

## Technical Challenges

* **Eliminating Race Conditions**: Preventing concurrent requests from bypassing rate limits required strict atomic primitives.
* **Real-time Visualization**: Streaming live traffic telemetry over Server-Sent Events (SSE) required managing connection lifecycles cleanly without client memory leaks.

---

## Future Improvements

* **Distributed Redis Cluster Support**: Expand multi-region Redis cluster failover.
* **Custom Dynamic Rate Policies**: Allow tenant self-service custom policy definitions.
* **Webhooks & Alerts**: Trigger Slack/Email alerts when a tenant exceeds 90% quota capacity.

---

## What I Learned

* System architecture for high-concurrency API gateways.
* Writing atomic Lua scripts for Redis rate limiting.
* Developing production-grade control planes matching professional design specifications.
* Designing idempotent background data rollup pipelines.

---

## Author

**Praveenkanna16**  
GitHub: [Praveenkanna16](https://github.com/Praveenkanna16)
