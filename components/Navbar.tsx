"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const links = [
    { href: "/dashboard", label: "Overview" },
    { href: "/dashboard/traffic", label: "Traffic" },
    { href: "/dashboard/tenants", label: "Tenants" },
    { href: "/dashboard/policies", label: "Policies" },
    { href: "/dashboard/analytics", label: "Usage" },
    { href: "/dashboard/events", label: "Events" },
    { href: "/dashboard/replay", label: "Replay" },
    { href: "/dashboard/health", label: "Health" },
  ];

  return (
    <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-container-padding h-nav-height bg-surface-container-lowest border-b border-outline-variant">
      <div className="flex items-center gap-6 h-full">
        <Link href="/dashboard" className="font-headline-md text-headline-md font-bold text-on-surface flex items-center gap-2">
          QuotaForge
        </Link>
        <div className="hidden lg:flex items-center gap-1 h-full ml-4">
          {links.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`h-full flex items-center px-3 font-label-caps text-label-caps uppercase transition-colors hover:bg-surface-container-low ${
                  isActive
                    ? "text-primary border-b-2 border-primary font-bold"
                    : "text-secondary hover:text-on-surface"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Link
          href="/docs"
          className="text-secondary hover:text-on-surface font-label-caps text-label-caps uppercase transition-colors hidden sm:block px-2 py-1 hover:bg-surface-container-low rounded"
        >
          Documentation
        </Link>
        <button
          title="Settings"
          className="text-secondary hover:text-on-surface cursor-pointer active:opacity-80 flex items-center justify-center w-8 h-8 rounded hover:bg-surface-container-low transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">settings</span>
        </button>
        <button
          title="Notifications"
          className="text-secondary hover:text-on-surface cursor-pointer active:opacity-80 flex items-center justify-center w-8 h-8 rounded hover:bg-surface-container-low transition-colors relative"
        >
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full"></span>
        </button>
        <div className="w-8 h-8 rounded bg-surface-container-high border border-outline-variant flex items-center justify-center overflow-hidden cursor-pointer">
          <span className="material-symbols-outlined text-secondary text-[20px]">account_circle</span>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden text-secondary hover:text-on-surface p-1"
          aria-label="Toggle Navigation"
        >
          <span className="material-symbols-outlined">{mobileMenuOpen ? "close" : "menu"}</span>
        </button>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="absolute top-nav-height left-0 w-full bg-surface-container-lowest border-b border-outline-variant shadow-lg lg:hidden flex flex-col p-4 space-y-2 z-50">
          {links.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-2 font-label-caps text-label-caps uppercase rounded ${
                  isActive ? "bg-primary-container/10 text-primary font-bold" : "text-secondary hover:bg-surface-container-low"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            href="/docs"
            onClick={() => setMobileMenuOpen(false)}
            className="px-4 py-2 font-label-caps text-label-caps uppercase rounded text-secondary hover:bg-surface-container-low"
          >
            Documentation
          </Link>
        </div>
      )}
    </nav>
  );
}

