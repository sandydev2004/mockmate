import { getCurrentUser } from "@/lib/auth";
import { isAdminRole } from "@/lib/admin-permissions";
import { notFound } from "next/navigation";
import { AdminMfaEnrollment } from "@/components/admin/AdminMfaEnrollment";
import { MfaErrorBoundary } from "@/components/admin/MfaErrorBoundary";
import { logAdminDenial } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams?: {
    redirect?: string;
  };
}

export default async function AdminMfaPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();

  // Strict 404 masking: outsiders and non-admins receive a plain 404
  if (!user || !isAdminRole(user.role) || user.is_suspended) {
    logAdminDenial("Unauthorized visitor attempted to access /admin/mfa", {
      path: "/admin/mfa",
      userId: user?.id,
      email: user?.email,
      role: user?.role,
    });
    notFound();
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
