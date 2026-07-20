import { apiFetch, ApiError } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrgSettingsForm } from "./org-settings-form";
import { MembersTab } from "./members-tab";
import { DeletionGrantsTab } from "./deletion-grants-tab";

interface Organization {
  name: string;
  slug: string;
}

interface Member {
  id: string;
  user: { id: string; name: string; email: string };
  role: { key: string; name: string };
}

interface Grant {
  id: string;
  user: { id: string; name: string; email: string };
}

/** apiFetch throws on non-2xx — used here to gracefully hide Owner/Admin-only tabs for everyone else, rather than showing a broken page. */
async function fetchOrNull<T>(path: string): Promise<T | null> {
  try {
    return await apiFetch<T>(path);
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) return null;
    throw err;
  }
}

export default async function SettingsPage() {
  const [org, members, grants] = await Promise.all([
    apiFetch<Organization>("/v1/organizations/me"),
    fetchOrNull<Member[]>("/v1/members"),
    fetchOrNull<Grant[]>("/v1/deletion-grants"),
  ]);

  return (
    <div className="flex flex-col gap-5 p-7">
      <div>
        <h1 className="text-xl font-bold text-foreground">Settings</h1>
      </div>

      <Tabs defaultValue="organization">
        <TabsList>
          <TabsTrigger value="organization">Organization</TabsTrigger>
          {members && <TabsTrigger value="members">Members</TabsTrigger>}
          {grants && <TabsTrigger value="deletion">Deletion Access</TabsTrigger>}
        </TabsList>

        <TabsContent value="organization">
          <OrgSettingsForm initialName={org.name} initialSlug={org.slug} />
        </TabsContent>

        {members && (
          <TabsContent value="members">
            <MembersTab members={members} />
          </TabsContent>
        )}

        {grants && (
          <TabsContent value="deletion">
            <DeletionGrantsTab grants={grants} members={members ?? []} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
