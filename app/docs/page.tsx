"use client";

import { useState } from "react";
import Link from "next/link";

export default function DocsPage() {
  const [selectedLang, setSelectedLang] = useState<"curl" | "javascript" | "python" | "go">("curl");
  const [copied, setCopied] = useState(false);

  const snippets = {
    curl: `curl -X POST https://quotaforge.com/api/gateway/v1/payments \\
  -H "x-api-key: qf_live_stripe_demo_key_998127391823" \\
  -H "Content-Type: application/json" \\
  -d '{"amount": 150.00, "currency": "USD"}'`,
    javascript: `const response = await fetch("https://quotaforge.com/api/gateway/v1/payments", {
  method: "POST",
  headers: {
    "x-api-key": "qf_live_stripe_demo_key_998127391823",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ amount: 150.00, currency: "USD" })
});

const data = await response.json();
console.log("Allowed:", response.ok, "Remaining:", response.headers.get("X-RateLimit-Remaining"));`,
    python: `import requests

url = "https://quotaforge.com/api/gateway/v1/payments"
headers = {
    "x-api-key": "qf_live_stripe_demo_key_998127391823",
    "Content-Type": "application/json"
}
payload = {"amount": 150.00, "currency": "USD"}

response = requests.post(url, json=payload, headers=headers)
if response.status_code == 429:
    print(f"Rate limited! Retry after {response.headers.get('Retry-After')} seconds.")
else:
    print("Success:", response.json())`,
    go: `package main

import (
	"fmt"
	"net/http"
	"strings"
)

func main() {
	url := "https://quotaforge.com/api/gateway/v1/payments"
	payload := strings.NewReader(\`{"amount": 150.00, "currency": "USD"}\`)

	req, _ := http.NewRequest("POST", url, payload)
	req.Header.Add("x-api-key", "qf_live_stripe_demo_key_998127391823")
	req.Header.Add("Content-Type", "application/json")

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer res.Body.Close()

	fmt.Println("HTTP Status:", res.StatusCode)
}`,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(snippets[selectedLang]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-stack-lg max-w-5xl mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-stack-md">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-1">API Reference & Integration Guide</h1>
          <p className="font-body-base text-body-base text-secondary">
            Integration specifications, gateway headers, API key authentication, and code snippets.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="bg-surface-container-lowest border border-outline-variant text-on-surface font-label-caps text-label-caps uppercase px-4 py-2 rounded hover:bg-surface-container-low transition-colors"
        >
          &larr; Back to Dashboard
        </Link>
      </header>

      {/* Gateway Endpoint Overview */}
      <div className="bg-surface-container-lowest border border-outline-variant p-stack-md rounded space-y-3">
        <h2 className="font-headline-md text-headline-md font-semibold text-on-surface">1. Base Gateway Endpoint</h2>
        <p className="text-body-base text-secondary">
          All client requests destined for rate-limited backend endpoints should be routed through the QuotaForge proxy prefix:
        </p>
        <div className="bg-surface-container-low border border-outline-variant p-3 rounded font-mono-sm font-bold text-primary">
          POST /api/gateway/[...path]
        </div>
      </div>

      {/* Authentication Headers */}
      <div className="bg-surface-container-lowest border border-outline-variant p-stack-md rounded space-y-3">
        <h2 className="font-headline-md text-headline-md font-semibold text-on-surface">2. API Key Authentication</h2>
        <p className="text-body-base text-secondary">
          Provide your tenant API Key in either the <code className="bg-surface-container px-1.5 py-0.5 rounded font-mono-sm">x-api-key</code> request header or as a Bearer Token:
        </p>
        <div className="space-y-2 font-mono-sm text-body-sm">
          <div className="bg-surface-container-low p-2.5 rounded border border-outline-variant">
            <span className="text-secondary font-bold">Header Method:</span> x-api-key: qf_live_stripe_demo_key_998127391823
          </div>
          <div className="bg-surface-container-low p-2.5 rounded border border-outline-variant">
            <span className="text-secondary font-bold">Bearer Method:</span> Authorization: Bearer qf_live_stripe_demo_key_998127391823
          </div>
        </div>
      </div>

      {/* Standard Response Headers */}
      <div className="bg-surface-container-lowest border border-outline-variant p-stack-md rounded space-y-3">
        <h2 className="font-headline-md text-headline-md font-semibold text-on-surface">3. Standard Gateway Response Headers</h2>
        <p className="text-body-base text-secondary">
          QuotaForge emits IETF draft compliant headers on every response to aid client-side backoff algorithms:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-body-sm">
            <thead className="bg-surface-container-low border-b border-outline-variant font-label-caps text-label-caps text-secondary uppercase">
              <tr>
                <th className="px-3 py-2">Header Name</th>
                <th className="px-3 py-2">Description</th>
                <th className="px-3 py-2">Example Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container font-mono-sm">
              <tr>
                <td className="px-3 py-2.5 font-bold text-primary">X-RateLimit-Limit</td>
                <td className="px-3 py-2.5 text-secondary">Sustained request limit permitted in window</td>
                <td className="px-3 py-2.5 text-on-surface">60</td>
              </tr>
              <tr>
                <td className="px-3 py-2.5 font-bold text-primary">X-RateLimit-Remaining</td>
                <td className="px-3 py-2.5 text-secondary">Remaining request allocation in current window</td>
                <td className="px-3 py-2.5 text-on-surface">42</td>
              </tr>
              <tr>
                <td className="px-3 py-2.5 font-bold text-primary">X-RateLimit-Reset</td>
                <td className="px-3 py-2.5 text-secondary">Epoch timestamp (ms) when allocation resets</td>
                <td className="px-3 py-2.5 text-on-surface">1723112000000</td>
              </tr>
              <tr>
                <td className="px-3 py-2.5 font-bold text-error">Retry-After</td>
                <td className="px-3 py-2.5 text-secondary">Seconds client must wait before retrying (on 429)</td>
                <td className="px-3 py-2.5 text-on-surface">45</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Code Snippets Viewer */}
      <div className="bg-surface-container-lowest border border-outline-variant p-stack-md rounded space-y-stack-md">
        <div className="flex justify-between items-center pb-2 border-b border-outline-variant">
          <h2 className="font-headline-md text-headline-md font-semibold text-on-surface">4. Integration Code Snippets</h2>

          <div className="flex items-center gap-2">
            {(["curl", "javascript", "python", "go"] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setSelectedLang(lang)}
                className={`px-3 py-1 font-label-caps text-label-caps uppercase rounded transition-colors ${
                  selectedLang === lang
                    ? "bg-primary text-on-primary font-bold"
                    : "bg-surface-container-low text-secondary hover:text-on-surface"
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-surface-container-low border border-outline-variant p-stack-md rounded relative font-mono-sm">
          <button
            onClick={handleCopy}
            className="absolute right-3 top-3 bg-surface-container-highest border border-outline-variant px-3 py-1 rounded text-body-sm font-label-caps text-label-caps uppercase hover:bg-surface-container transition-colors"
          >
            {copied ? "Copied!" : "Copy Code"}
          </button>
          <pre className="overflow-x-auto text-on-surface leading-relaxed">{snippets[selectedLang]}</pre>
        </div>
      </div>
    </div>
  );
}
