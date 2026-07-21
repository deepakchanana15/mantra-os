import { apiFetch, ApiError } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrgSettingsForm } from "./org-settings-form";
import { MembersTab } from "./members-tab";
import { DeletionGrantsTab } from "./deletion-grants-tab";
import { CompaniesTab } from "./companies-tab";
import { CountriesTab } from "./countries-tab";
import { BrandsTab } from "./brands-tab";
import { WebsitesTab } from "./websites-tab";

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

interface Currency {
  id: string;
  code: string;
}

interface Company {
  id: string;
  name: string;
  legalName: string | null;
  baseCurrencyId: string | null;
}

interface Country {
  id: string;
  companyId: string;
  name: string;
  isoCode: string;
  currencyId: string | null;
  taxPercentage: string | null;
  enabled: boolean;
}

interface Brand {
  id: string;
  name: string;
  slug: string;
}

interface Website {
  id: string;
  countryId: string;
  brandId: string;
  domain: string | null;
  enabled: boolean;
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
  const [org, members, grants, currencies, companies, countries, brands, websites] = await Promise.all([
    apiFetch<Organization>("/v1/organizations/me"),
    fetchOrNull<Member[]>("/v1/members"),
    fetchOrNull<Grant[]>("/v1/deletion-grants"),
    fetchOrNull<Currency[]>("/v1/currencies"),
    fetchOrNull<Company[]>("/v1/companies"),
    fetchOrNull<Country[]>("/v1/countries"),
    fetchOrNull<Brand[]>("/v1/brands"),
    fetchOrNull<Website[]>("/v1/websites"),
  ]);
  const globalDomainAvailable = currencies && companies && countries && brands && websites;

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
          {globalDomainAvailable && <TabsTrigger value="companies">Companies</TabsTrigger>}
          {globalDomainAvailable && <TabsTrigger value="countries">Countries</TabsTrigger>}
          {globalDomainAvailable && <TabsTrigger value="brands">Brands</TabsTrigger>}
          {globalDomainAvailable && <TabsTrigger value="websites">Websites</TabsTrigger>}
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

        {globalDomainAvailable && (
          <>
            <TabsContent value="companies">
              <CompaniesTab companies={companies} currencies={currencies} />
            </TabsContent>
            <TabsContent value="countries">
              <CountriesTab countries={countries} companies={companies} currencies={currencies} />
            </TabsContent>
            <TabsContent value="brands">
              <BrandsTab brands={brands} />
            </TabsContent>
            <TabsContent value="websites">
              <WebsitesTab websites={websites} countries={countries} brands={brands} />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
