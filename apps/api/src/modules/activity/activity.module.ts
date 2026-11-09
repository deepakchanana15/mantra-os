import { Module } from "@nestjs/common";
import { AuditLogRepository } from "./audit-log/audit-log.repository";
import { NotesRepository } from "./notes/notes.repository";

/**
 * Shared, entity-agnostic building blocks for a record's activity
 * timeline — Notes and the audit trail work the same way for any entity
 * (Opportunity, Customer, and whatever grows a timeline next); each
 * entity's own repository composes these with its own domain-specific
 * history (stage changes, quotes/orders, WhatsApp messages, ...).
 */
@Module({
  providers: [NotesRepository, AuditLogRepository],
  exports: [NotesRepository, AuditLogRepository],
})
export class ActivityModule {}
