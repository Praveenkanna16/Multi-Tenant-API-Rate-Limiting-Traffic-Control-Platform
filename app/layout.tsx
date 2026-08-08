import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "QuotaForge — Multi-Tenant API Rate Limiting & Traffic Control Platform",
  description: "High-performance multi-tenant API rate limiter & quota management gateway with atomic Redis operations and live traffic replay.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body className="min-h-screen bg-background text-on-surface font-body-base antialiased flex flex-col pt-nav-height">
        <Navbar />
        <main className="flex-1 w-full max-w-[1440px] mx-auto px-container-padding py-stack-lg">{children}</main>
        <footer className="border-t border-outline-variant bg-surface-container-lowest py-4 text-xs text-secondary font-mono-sm">
          <div className="max-w-[1440px] mx-auto px-container-padding flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>QuotaForge Systems Control Plane v1.0.0 — Atomic Redis Engine</span>
            <span>Zero Over-Allocation Guaranteed</span>
          </div>
        </footer>
      </body>
    </html>
  );
}

