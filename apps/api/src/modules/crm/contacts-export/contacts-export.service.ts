import { Injectable } from "@nestjs/common";
import { ContactsExportRepository } from "./contacts-export.repository";

function escapeVCardText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}

/**
 * One BEGIN:VCARD...END:VCARD block per contact, vCard 3.0 — the format
 * both iOS and Android import natively ("Add All Contacts" from a single
 * multi-entry .vcf), so getting every Customer/Opportunity onto a phone
 * is a one-time file transfer rather than per-contact manual entry.
 */
@Injectable()
export class ContactsExportService {
  constructor(private readonly contacts: ContactsExportRepository) {}

  async buildVCard(): Promise<string> {
    const contacts = await this.contacts.findAllContacts();

    const blocks = contacts.map((c) => {
      const lines = ["BEGIN:VCARD", "VERSION:3.0", `FN:${escapeVCardText(c.name)}`, `TEL;TYPE=CELL:${c.phone}`];
      if (c.email) lines.push(`EMAIL:${escapeVCardText(c.email)}`);
      lines.push("END:VCARD");
      return lines.join("\r\n");
    });

    return blocks.join("\r\n") + "\r\n";
  }
}
