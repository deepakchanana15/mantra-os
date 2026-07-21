import { Injectable } from "@nestjs/common";
import { BaseRepository } from "../../../common/repositories/base.repository";

@Injectable()
export class CurrenciesRepository extends BaseRepository {
  /** Global reference data (ISO 4217), not tenant-scoped — no RLS policy, see rls-policies.sql design note 8. */
  findAll() {
    return this.db.currency.findMany({ where: { enabled: true }, orderBy: { code: "asc" } });
  }
}
