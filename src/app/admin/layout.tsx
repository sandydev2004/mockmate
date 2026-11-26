import { requireAdminPage } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { PrivacyBanner } from "@/components/admin/PrivacyBanner";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = headers();
  const currentPath =
    headersList.get("x-mockmate-path") ||
    headersList.get("x-invoke-path") ||
    headersList.get("next-url") ||
    headersList.get("x-matched-path") ||
    "";
  const referer = headersList.get("referer") || "";
  const isMfaPage =
    currentPath === "/admin/mfa" ||
    currentPath.startsWith("/admin/mfa") ||
    currentPath.includes("/mfa") ||
    referer.includes("/admin/mfa");

  // Server-side admin verification: strictly throws notFound() for non-admins / logged out users
  // Redirects to /admin/mfa if admin is not at AAL2 (unless already on /admin/mfa)
  if (!isMfaPage) {
    await requireAdminPage(currentPath || "/admin");
  }

  if (isMfaPage) {
    return <>{children}</>;
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <PrivacyBanner />
        {children}
      </div>
    </AdminShell>
  );
}
