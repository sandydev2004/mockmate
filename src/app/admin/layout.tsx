import { requireAdminPage } from "@/lib/admin-auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { PrivacyBanner } from "@/components/admin/PrivacyBanner";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = headers();
  const currentPath = headersList.get("x-mockmate-path") || "";
  const isMfaPage = currentPath === "/admin/mfa" || currentPath.startsWith("/admin/mfa");

  // Server-side admin verification: strictly throws notFound() for non-admins / logged out users
  // Redirects to /admin/mfa if admin is not at AAL2 (unless already on /admin/mfa)
  await requireAdminPage(currentPath);

  if (isMfaPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <PrivacyBanner />
      <div className="flex-1 flex">
        <AdminSidebar />
        <main className="flex-1 bg-slate-950 p-6 md:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}

