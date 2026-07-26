import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { TenantContextService } from "../context/tenant-context.service";

export type BusinessCodeEntity = "customer" | "opportunity";

/**
 * Generates human-readable business IDs like "MS-AU-20260726-01" for
 * Customers and Opportunities — see DECISIONS.md "Business ID codes for
 * Customers and Opportunities". Format: {org's codePrefix}-{country
 * isoCode}-{YYYYMMDD}-{daily sequence for that entity+country, 2+ digits}.
 *
 * The sequence is per (organization, entity type, country) per day — a
 * Customer and an Opportunity created the same day each start their own
 * count at 01, and each country counts separately, so this deliberately
 * does NOT share a counter across entity types or countries.
 */
@Injectable()
export class BusinessCodeService {
  constructor(private readonly tenantContext: TenantContextService) {}

  private get db() {
    return this.tenantContext.db;
  }

  async next(entity: BusinessCodeEntity, params: { companyId?: string | null; countryId?: string | null }): Promise<string> {
    const organizationId = this.tenantContext.organizationId;
    const isoCode = await this.resolveIsoCode(params);
    const settings = await this.db.organizationSettings.findUnique({ where: { organizationId } });
    const prefix = settings?.codePrefix ?? "ORG";

    const now = new Date();
    const dateKey = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(now.getUTCDate()).padStart(2, "0")}`;
    const scope = `${entity}:${isoCode}`;

    const rows = await this.db.$queryRawUnsafe<{ count: number }[]>(
      `INSERT INTO daily_business_code_counters ("id", "organizationId", "scope", "dateKey", "count")
       VALUES ($1, $2, $3, $4, 1)
       ON CONFLICT ("organizationId", "scope", "dateKey")
       DO UPDATE SET count = daily_business_code_counters.count + 1
       RETURNING count`,
      randomUUID(),
      organizationId,
      scope,
      dateKey,
    );
    const sequence = String(rows[0].count).padStart(2, "0");

    return `${prefix}-${isoCode}-${dateKey}-${sequence}`;
  }

  private async resolveIsoCode(params: { companyId?: string | null; countryId?: string | null }): Promise<string> {
    if (params.countryId) {
      const country = await this.db.country.findUnique({ where: { id: params.countryId } });
      if (country) return country.isoCode;
    }
    if (params.companyId) {
      const country = await this.db.country.findFirst({ where: { companyId: params.companyId } });
      if (country) return country.isoCode;
    }
    return "XX";
  }
}
