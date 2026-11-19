import { Injectable } from "@nestjs/common";
import { BaseRepository } from "../../../common/repositories/base.repository";
import { TenantContextService } from "../../../common/context/tenant-context.service";

export interface ExportableContact {
  name: string;
  phone: string;
  email: string | null;
}

function normalizePhone(value: string): string {
  return value.replace(/\D/g, "");
}

@Injectable()
export class ContactsExportRepository extends BaseRepository {
  constructor(tenantContext: TenantContextService) {
    super(tenantContext);
  }

  /**
   * Customers + not-yet-converted Opportunities (ones with a linked
   * Customer are skipped — that same person is already in the Customer
   * list), deduplicated by phone digits so the same person submitting
   * twice doesn't produce two vCards.
   *
   * `countryIso` (e.g. "AU") filters both to that Country's records only —
   * resolved to a countryId first rather than filtering by isoCode
   * directly, since that's what's actually stored on Customer/Opportunity.
   * Records predating this field's rollout have a null countryId and are
   * excluded from a country-filtered export (included in the unfiltered
   * one) — there's no reliable way to backfill which country an old record
   * belongs to from the data alone.
   */
  async findAllContacts(countryIso?: string): Promise<ExportableContact[]> {
    let countryId: string | undefined;
    if (countryIso) {
      const country = await this.db.country.findFirst({
        where: { organizationId: this.organizationId, isoCode: countryIso, deletedAt: null },
        select: { id: true },
      });
      countryId = country?.id ?? "__no_match__";
    }

    const [customers, opportunities] = await Promise.all([
      this.db.customer.findMany({
        where: {
          organizationId: this.organizationId,
          deletedAt: null,
          phone: { not: null },
          ...(countryId ? { countryId } : {}),
        },
        select: { name: true, phone: true, email: true },
      }),
      this.db.opportunity.findMany({
        where: {
          organizationId: this.organizationId,
          deletedAt: null,
          customerId: null,
          leadPhone: { not: null },
          ...(countryId ? { countryId } : {}),
        },
        select: { leadName: true, leadPhone: true, leadEmail: true },
      }),
    ]);

    const seen = new Map<string, ExportableContact>();

    for (const c of customers) {
      if (!c.phone) continue;
      const key = normalizePhone(c.phone);
      if (!key || seen.has(key)) continue;
      seen.set(key, { name: c.name, phone: c.phone, email: c.email });
    }

    for (const o of opportunities) {
      if (!o.leadPhone) continue;
      const key = normalizePhone(o.leadPhone);
      if (!key || seen.has(key)) continue;
      seen.set(key, { name: o.leadName ?? "Unknown", phone: o.leadPhone, email: o.leadEmail });
    }

    return [...seen.values()];
  }
}
