"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Video,
  ShieldAlert,
  CreditCard,
  Cpu,
  Code2,
  FileCheck2,
  Download,
  LogOut,
  Sparkles,
  ChevronRight,
  Menu,
  X,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

interface AdminShellProps {
  children: React.ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const navItems = [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/users", label: "Users & Credits", icon: Users },
    { href: "/admin/interviews", label: "Interviews", icon: Video },
    { href: "/admin/integrity", label: "Review Queue", icon: ShieldAlert },
    { href: "/admin/payments", label: "Payments", icon: CreditCard },
    { href: "/admin/ai-settings", label: "AI & Platform", icon: Cpu },
    { href: "/admin/problems", label: "DSA Problems", icon: Code2 },
    { href: "/admin/audit", label: "Audit Trail", icon: FileCheck2 },
    { href: "/admin/system-check", label: "System Check", icon: CheckCircle2 },
  ];

  const getPageTitle = (path: string | null) => {
    if (!path || path === "/admin") return "Overview";
    if (path.startsWith("/admin/users")) return "Users & Credits";
    if (path.startsWith("/admin/interviews")) return "Interviews";
    if (path.startsWith("/admin/integrity")) return "Review Queue";
    if (path.startsWith("/admin/payments")) return "Payments";
    if (path.startsWith("/admin/ai-settings")) return "AI & Platform";
    if (path.startsWith("/admin/problems")) return "DSA Problems";
    if (path.startsWith("/admin/audit")) return "Audit Trail";
    if (path.startsWith("/admin/system-check")) return "System Diagnostics";
    if (path.startsWith("/admin/mfa")) return "2-Step MFA";
    return "Admin Portal";
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.warn("Logout failed:", err);
    }
  };

  const navContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-200">
      {/* Brand header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base text-white tracking-tight">MockMate</span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                Admin
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Operations Portal</p>
          </div>
        </Link>

        {/* Mobile close button */}
        <button
          onClick={() => setDrawerOpen(false)}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Close admin menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
          Management
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setDrawerOpen(false)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                isActive
                  ? "bg-rose-500/10 text-rose-400 font-semibold border border-rose-500/20"
                  : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-rose-400" : "text-slate-400"}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
            </Link>
          );
        })}

        <div className="pt-4 px-3 pb-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
          Data Export
        </div>
        <div className="space-y-1">
          <a
            href="/api/admin/export?type=users"
            download
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800/50 min-h-[44px]"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span>Export Users (CSV)</span>
          </a>
          <a
            href="/api/admin/export?type=interviews"
            download
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800/50 min-h-[44px]"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span>Export Interviews (CSV)</span>
          </a>
          <a
            href="/api/admin/export?type=payments"
            download
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800/50 min-h-[44px]"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span>Export Payments (CSV)</span>
          </a>
        </div>
      </nav>

      {/* Footer controls */}
      <div className="p-3 border-t border-slate-800 space-y-2">
        <Link
          href="/dashboard"
          onClick={() => setDrawerOpen(false)}
          className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-lg text-xs text-slate-300 hover:bg-slate-800 transition-colors min-h-[44px]"
        >
          <span>Back to Candidate App</span>
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-lg text-xs text-rose-400 hover:bg-rose-950/40 border border-rose-900/30 transition-colors min-h-[44px]"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Admin Log Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col w-full">
      {/* Compact Mobile & Tablet Top Bar (<1024px): menu button, page title, theme toggle */}
      <header className="lg:hidden sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-3 sm:px-4 h-14 flex items-center justify-between w-full">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 -ml-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
            aria-label="Open admin navigation drawer"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <Link href="/admin" className="w-7 h-7 rounded-lg bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
            </Link>
            <span className="font-bold text-sm text-white truncate max-w-[130px] sm:max-w-xs">
              {getPageTitle(pathname)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <ThemeToggle />
          <Link
            href="/dashboard"
            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Candidate App"
          >
            App
          </Link>
        </div>
      </header>

      {/* Off-canvas mobile/tablet drawer backdrop & panel (Closes on route change & outside tap) */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Touch Backdrop */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer slideout */}
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {navContent}
          </div>
        </div>
      )}

      {/* Main Layout Area */}
      <div className="flex-1 flex min-w-0 w-full">
        {/* Desktop Static Sidebar (>=1024px) */}
        <aside className="hidden lg:flex w-64 shrink-0 flex-col min-h-[calc(100vh-2rem)] border-r border-slate-800">
          {navContent}
        </aside>

        {/* Content Pane: Uses 100% full width on mobile/tablet, never squeezed! */}
        <main className="flex-1 min-w-0 w-full p-3 sm:p-5 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full min-w-0 overflow-x-hidden">{children}</div>
        </main>
      </div>
    </div>
  );
}
