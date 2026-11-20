"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "./ThemeToggle";
import {
  Sparkles,
  Zap,
  BarChart3,
  FileText,
  PlayCircle,
  Menu,
  X,
  CreditCard,
  User,
  LogOut,
  ShieldCheck,
  Home,
  HelpCircle,
} from "lucide-react";

export interface NavbarProps {
  initialRole?: string | null;
  initialUser?: {
    full_name?: string | null;
    email?: string | null;
    credits?: number | null;
    role?: string | null;
  } | null;
}

export function Navbar({ initialRole = null, initialUser = null }: NavbarProps = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [credits, setCredits] = useState<number | null>(initialUser?.credits ?? null);
  const [userName, setUserName] = useState<string | null>(initialUser?.full_name ?? null);
  const [userEmail, setUserEmail] = useState<string | null>(initialUser?.email ?? null);
  const [userRole, setUserRole] = useState<string | null>(initialRole ?? initialUser?.role ?? null);

  const isLoggedIn = Boolean(userName || userEmail);

  useEffect(() => {
    let isMounted = true;
    const fetchSession = async () => {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        if (!isMounted) return;
        if (data.user) {
          setCredits(typeof data.user.credits === "number" ? data.user.credits : 0);
          setUserName(data.user.full_name || data.user.email?.split("@")[0] || null);
          setUserEmail(data.user.email);
          setUserRole(data.user.role || "user");
        } else {
          setCredits(null);
          setUserName(null);
          setUserEmail(null);
          setUserRole(null);
        }
      } catch {
        if (!isMounted) return;
        setCredits(null);
        setUserName(null);
        setUserEmail(null);
        setUserRole(null);
      }
    };

    fetchSession();

    const handleAuthChange = () => fetchSession();
    window.addEventListener("auth-state-change", handleAuthChange);

    return () => {
      isMounted = false;
      window.removeEventListener("auth-state-change", handleAuthChange);
    };
  }, [pathname]);

  const handleLogout = async () => {
    try {
      setCredits(null);
      setUserName(null);
      setUserEmail(null);
      setUserRole(null);
      try {
        localStorage.removeItem("mockmate_user");
        localStorage.removeItem("mockmate_credits");
        localStorage.removeItem("mockmate_profile");
        sessionStorage.clear();
      } catch { }
      window.dispatchEvent(new Event("auth-state-change"));
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.warn("Logout failed:", err);
    }
  };

  const loggedInNavLinks = [
    { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
    { href: "/interview/setup", label: "New Interview", icon: PlayCircle },
    { href: "/resume-tailor", label: "Resume Tailor", icon: FileText },
    { href: "/progress", label: "Progress", icon: BarChart3 },
    { href: "/pricing", label: "Pricing", icon: CreditCard },
  ];

  const loggedOutNavLinks = [
    { href: "/pricing", label: "Pricing", icon: CreditCard },
    { href: "/#how-it-works", label: "How it works", icon: HelpCircle },
  ];

  const navLinks = isLoggedIn ? loggedInNavLinks : loggedOutNavLinks;

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                MockMate
              </span>
            </Link>
            <span className="hidden md:inline-flex items-center text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
              Placement AI
            </span>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                      ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right Action Items */}
          <div className="hidden md:flex items-center gap-3">
            {/* Credits pill (Only visible to authenticated users; loaded dynamically from server profile) */}
            {isLoggedIn && (
              <>
                {(userRole === "admin" || userRole === "super_admin") ? (
                  <div
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                    title="Admin account: unlimited interview access"
                  >
                    <Zap className="w-3.5 h-3.5 text-indigo-500 fill-indigo-500" />
                    <span>Admin: unlimited</span>
                  </div>
                ) : credits !== null ? (
                  <Link
                    href="/pricing"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>{`${credits} ${credits === 1 ? "Credit" : "Credits"}`}</span>
                  </Link>
                ) : null}
              </>
            )}

            <ThemeToggle />

            {userName || userEmail ? (
              <div className="flex items-center gap-1.5">
                {(userRole === "admin" || userRole === "super_admin" || userRole === "support") && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400 px-2.5 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors"
                    title="MockMate Admin Portal"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Admin</span>
                  </Link>
                )}
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="max-w-[130px] truncate">{userName || userEmail?.split("@")[0]}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  title="Log out"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium ${isActive
                    ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}

          {(userRole === "admin" || userRole === "super_admin" || userRole === "support") && (
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40"
            >
              <ShieldCheck className="w-4 h-4" />
              Admin Portal
            </Link>
          )}

          {isLoggedIn ? (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              {(userRole === "admin" || userRole === "super_admin") ? (
                <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300">
                  <Zap className="w-4 h-4 text-indigo-500 fill-indigo-500" />
                  <span>Admin: unlimited</span>
                </div>
              ) : credits !== null ? (
                <Link
                  href="/pricing"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300"
                >
                  <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>{`${credits} ${credits === 1 ? "Credit" : "Credits"}`}</span>
                </Link>
              ) : (
                <div />
              )}

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300"
              >
                Log Out ({userName || userEmail?.split("@")[0]})
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Log In
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
