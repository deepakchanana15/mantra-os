import { redirect } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { AuthShell } from "@/components/layout/auth-shell";
import { OrgPicker } from "./org-picker";

interface Organization {
  id: string;
  name: string;
  slug: string;
}

export default async function OrgsPage() {
  let organizations: Organization[];
  try {
    organizations = await apiFetch<Organization[]>("/v1/organizations", { skipOrgHeader: true });
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      redirect("/login");
    }
    throw err;
  }

  if (organizations.length === 0) {
    return (
      <AuthShell title="No organizations yet" description="Ask an Owner or Admin to invite you to an organization.">
        <div />
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Choose an organization" description="Select which organization to work in.">
      <OrgPicker organizations={organizations} />
    </AuthShell>
  );
}
