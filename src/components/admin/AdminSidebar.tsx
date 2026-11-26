"use client";

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
  Server,
} from "lucide-react";

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/users", label: "Users & Credits", icon: Users },
    { href: "/admin/interviews", label: "Interviews", icon: Video },
    { href: "/admin/integrity", label: "Review Queue", icon: ShieldAlert },
    { href: "/admin/payments", label: "Payments", icon: CreditCard },
    { href: "/admin/ai-settings", label: "AI & Platform", icon: Cpu },
    { href: "/admin/problems", label: "DSA Problems", icon: Code2 },
    { href: "/admin/audit", label: "Audit Trail", icon: FileCheck2 },
    { href: "/admin/system-check", label: "System Health", icon: Server },
  ];

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.warn("Logout failed:", err);
    }
  };

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-200 flex flex-col flex-shrink-0 min-h-screen">
      {/* Brand header */}
      <div className="p-5 border-b border-slate-800">
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
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-rose-500/10 text-rose-400 font-semibold border border-rose-500/20"
                  : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? "text-rose-400" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </div>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-rose-400" />}
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
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800/50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Users (CSV)</span>
          </a>
          <a
            href="/api/admin/export?type=interviews"
            download
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800/50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Interviews (CSV)</span>
          </a>
          <a
            href="/api/admin/export?type=payments"
            download
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800/50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Payments (CSV)</span>
          </a>
        </div>
      </nav>

      {/* Footer controls */}
      <div className="p-3 border-t border-slate-800 space-y-2">
        <Link
          href="/dashboard"
          className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg text-xs text-slate-300 hover:bg-slate-800 transition-colors"
        >
          <span>Back to Candidate App</span>
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg text-xs text-rose-400 hover:bg-rose-950/40 border border-rose-900/30 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Admin Log Out</span>
        </button>
      </div>
    </aside>
  );
}

