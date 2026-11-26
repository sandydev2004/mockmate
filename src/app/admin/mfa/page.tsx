import { getCurrentUser } from "@/lib/auth";
import { isAdminRole } from "@/lib/admin-permissions";
import { redirect } from "next/navigation";
import { AdminMfaEnrollment } from "@/components/admin/AdminMfaEnrollment";
import { MfaErrorBoundary } from "@/components/admin/MfaErrorBoundary";
import { logAdminDenial } from "@/lib/admin-auth";
import { ShieldAlert, ArrowLeft, LogOut } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams?: {
    redirect?: string;
  };
}

export default async function AdminMfaPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent("/admin/mfa")}`);
  }

  // If user is logged in but does not have admin permissions
  if (!isAdminRole(user.role) || user.is_suspended) {
    logAdminDenial("Unauthorized visitor attempted to access /admin/mfa", {
      path: "/admin/mfa",
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Admin Privileges Required</h2>
            <p className="text-sm text-slate-400 mt-1">
              You are signed in as <span className="font-semibold text-slate-200">{user.email}</span>.
            </p>
            <p className="text-xs text-amber-400/90 mt-0.5">
              Current account role: <span className="font-mono font-bold uppercase">{user.role}</span>
            </p>
          </div>

          <div className="text-xs text-slate-400 bg-slate-950/70 p-4 rounded-xl border border-slate-800 text-left space-y-2">
            <p className="font-semibold text-slate-300">To enable admin access:</p>
            <p>Run the following query in your Supabase SQL Editor to grant super_admin rights:</p>
            <code className="block bg-slate-900 text-indigo-300 p-2.5 rounded-lg font-mono text-[11px] overflow-x-auto border border-slate-800">
              UPDATE public.profiles SET role = &apos;super_admin&apos; WHERE email = &apos;{user.email}&apos;;
            </code>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href="/dashboard"
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Candidate Dashboard</span>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Switch Account</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const redirectPath = searchParams?.redirect || "/admin";

  return (
    <MfaErrorBoundary>
      <AdminMfaEnrollment
        userEmail={user.email}
        userRole={user.role}
        redirectPath={redirectPath}
      />
    </MfaErrorBoundary>
  );
}
