import { redirect } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { CommandPalette } from "@/components/layout/command-palette";

interface Me {
  id: string;
  email: string;
  name: string;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let me: Me;
  let currentOrg: Organization;
  let organizations: Organization[];

  try {
    [me, currentOrg, organizations] = await Promise.all([
      apiFetch<Me>("/v1/auth/me", { skipOrgHeader: true }),
      apiFetch<Organization>("/v1/organizations/me"),
      apiFetch<Organization[]>("/v1/organizations", { skipOrgHeader: true }),
    ]);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect("/login");
    if (err instanceof ApiError && (err.status === 403 || err.status === 400)) redirect("/orgs");
    throw err;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar currentOrg={currentOrg} organizations={organizations} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar breadcrumb={<Breadcrumb />} userName={me.name} userEmail={me.email} />
        <main className="flex-1 overflow-y-auto bg-background">{children}</main>
      </div>
      <CommandPalette />
    </div>
  );
}
