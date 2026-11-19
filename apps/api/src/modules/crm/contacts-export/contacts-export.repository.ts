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
   */
  async findAllContacts(): Promise<ExportableContact[]> {
    const [customers, opportunities] = await Promise.all([
      this.db.customer.findMany({
        where: { organizationId: this.organizationId, deletedAt: null, phone: { not: null } },
        select: { name: true, phone: true, email: true },
      }),
      this.db.opportunity.findMany({
        where: { organizationId: this.organizationId, deletedAt: null, customerId: null, leadPhone: { not: null } },
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
