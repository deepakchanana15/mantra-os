export const RECORD_DELETED_EVENT = "record.deleted";

export interface RecordDeletedEvent {
  organizationId: string;
  entityType: string;
  entityId: string;
  performedById: string;
}
