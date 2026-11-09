/** One row in a record's (Opportunity/Customer) activity timeline — composed at read time from several tables, see each entity repository's `findActivity()`. */
export interface ActivityEntry {
  id: string;
  type: "CREATED" | "STAGE_CHANGE" | "WHATSAPP_MESSAGE" | "QUOTE" | "SALES_ORDER" | "INVOICE" | "NOTE" | "AUDIT";
  timestamp: Date;
  title: string;
  detail: string | null;
  actor: string | null;
}
