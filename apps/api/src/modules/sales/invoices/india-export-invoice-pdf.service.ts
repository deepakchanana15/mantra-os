import { Injectable } from "@nestjs/common";
import PDFDocument from "pdfkit";
import { MANTRA_LOGO_BASE64 } from "../../../common/assets/mantra-logo";
import { amountToWords } from "../../../common/pdf/number-to-words";
import { companyTaxLabels, formatDate, formatMoney, formatPostalAddress } from "../../../common/pdf/pdf-format";

interface IndiaExportInvoiceLine {
  quantity: number;
  unitPrice: { toString(): string };
  product: { name: string; sku: string; hsnCode: string | null };
}

interface IndiaExportCompany {
  name: string;
  legalName: string | null;
  taxId: string | null;
  registrationNumber: string | null;
  address: string | null;
  phone: string | null;
  lutArn: string | null;
  baseCurrency?: { code: string } | null;
}

interface IndiaExportInvoiceData {
  invoiceNumber: string;
  status: string;
  amount: { toString(): string };
  discountAmount: { toString(): string } | null;
  gstApplicable: boolean;
  gstRate: { toString(): string } | null;
  exportUnderLut: boolean;
  buyerTaxId: string | null;
  carriageBy: string | null;
  placeOfReceipt: string | null;
  countryOfOrigin: string | null;
  flightOrVesselNumber: string | null;
  portOfLoading: string | null;
  portOfDischarge: string | null;
  paymentTerms: string | null;
  freightTerms: string | null;
  exchangeRate: { toString(): string } | null;
  issuedAt: Date | string | null;
  dueDate: Date | string | null;
  createdAt: Date | string;
  customer: { name: string; email: string | null; phone: string | null; billingAddress: unknown } | null;
  consigneeCompany: IndiaExportCompany | null;
  consigneePhone: string | null;
  purchaseOrder: { poNumber: string | null } | null;
  lines: IndiaExportInvoiceLine[];
  company: IndiaExportCompany | null;
  country: { name: string; currency?: { code: string } | null } | null;
}

function currencyCode(invoice: IndiaExportInvoiceData): string {
  return invoice.country?.currency?.code ?? invoice.consigneeCompany?.baseCurrency?.code ?? "USD";
}

/**
 * Renders an Indian export Invoice — a fundamentally different,
 * customs/bank-oriented grid layout from InvoicePdfService's clean modern
 * design. Auto-selected in InvoicesService.getPdf() whenever the issuing
 * Company's base currency is INR. See DECISIONS.md "India export invoice
 * compliance".
 */
@Injectable()
export class IndiaExportInvoicePdfService {
  generate(invoice: IndiaExportInvoiceData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: "A4", margin: 40 });
      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const currency = currencyCode(invoice);
      const leftX = 40;
      const pageRight = 555;
      const midX = leftX + (pageRight - leftX) / 2;
      const borderColor = "#C9C7C0";

      const subtotal = Number(invoice.amount);
      const discount = Number(invoice.discountAmount ?? 0);
      const total = subtotal - discount;
      const exchangeRate = invoice.exchangeRate != null ? Number(invoice.exchangeRate) : null;
      const gstRatePct = invoice.gstRate != null ? Number(invoice.gstRate) : 0;
      const igst = !invoice.exportUnderLut && invoice.gstApplicable ? Math.round(total * (gstRatePct / 100) * 100) / 100 : 0;
      const grandTotal = total + igst;
      const taxableValueInr = exchangeRate != null ? Math.round(total * exchangeRate * 100) / 100 : null;
      const igstAmountInr = exchangeRate != null ? Math.round(igst * exchangeRate * 100) / 100 : null;

      const consigneeLabels = companyTaxLabels(invoice.consigneeCompany);
      const companyLabels = companyTaxLabels(invoice.company);

      // Logo + title
      const logo = Buffer.from(MANTRA_LOGO_BASE64, "base64");
      doc.image(logo, leftX, 35, { width: 50 });
      doc.fontSize(16).fillColor("#111111").font("Helvetica-Bold").text("INVOICE", leftX, 40, { width: pageRight - leftX, align: "center" });
      doc.font("Helvetica");
      let y = 95;

      function rule() {
        doc.moveTo(leftX, y).lineTo(pageRight, y).strokeColor(borderColor).stroke();
      }
      function label(text: string, x: number, width: number) {
        doc.fontSize(8).fillColor("#999999").text(text, x, y, { width });
      }
      function value(text: string, x: number, width: number) {
        doc.fontSize(9).fillColor("#111111").text(text, x, y, { width });
      }

      // ── Consignor / Invoice No & Date / IEC / GSTIN ──────────────────
      rule();
      y += 6;
      label("CONSIGNOR", leftX, 240);
      label("INVOICE NO. & DATE", midX, 130);
      label("IEC NUMBER", midX + 135, 130);
      y += 11;
      value(invoice.company?.legalName ?? invoice.company?.name ?? "Mantra Sports International", leftX, 240);
      value(`${invoice.invoiceNumber}  |  ${formatDate(invoice.issuedAt ?? invoice.createdAt)}`, midX, 130);
      value(invoice.company?.registrationNumber ?? "—", midX + 135, 130);
      y += 14;
      if (invoice.company?.address) {
        doc.fontSize(8).fillColor("#444444");
        for (const line of invoice.company.address.split("\n")) {
          doc.text(line, leftX, y, { width: 240 });
          y += 10;
        }
      }
      const consignorGstY = y - (invoice.company?.address?.split("\n").length ?? 0) * 10;
      doc.fontSize(8).fillColor("#999999").text(`${companyLabels.taxIdLabel} No.`, midX, consignorGstY, { width: 130 });
      doc.fontSize(9).fillColor("#111111").text(invoice.company?.taxId ?? "—", midX, consignorGstY + 11, { width: 130 });
      if (invoice.purchaseOrder?.poNumber) {
        doc.fontSize(8).fillColor("#999999").text("Buyer's PO No.", midX + 135, consignorGstY, { width: 130 });
        doc.fontSize(9).fillColor("#111111").text(invoice.purchaseOrder.poNumber, midX + 135, consignorGstY + 11, { width: 130 });
      }
      y = Math.max(y, consignorGstY + 24) + 10;

      // ── Consignee / Buyer ──────────────────────────────────────────
      rule();
      y += 6;
      label("CONSIGNEE", leftX, 240);
      label("BUYER (IF OTHER THAN CONSIGNEE)", midX, 240);
      y += 11;
      const consigneeName = invoice.consigneeCompany?.legalName ?? invoice.consigneeCompany?.name ?? "—";
      value(consigneeName, leftX, 240);
      const buyerText = invoice.customer ? invoice.customer.name : "Same as Consignee";
      value(buyerText, midX, 240);
      y += 14;
      let consigneeBlockY = y;
      if (invoice.consigneeCompany?.address) {
        doc.fontSize(8).fillColor("#444444");
        for (const line of invoice.consigneeCompany.address.split("\n")) {
          doc.text(line, leftX, consigneeBlockY, { width: 240 });
          consigneeBlockY += 10;
        }
      }
      const consigneePhone = invoice.consigneePhone ?? invoice.consigneeCompany?.phone;
      const consigneeTaxLine = [
        invoice.consigneeCompany?.taxId ? `${consigneeLabels.taxIdLabel}: ${invoice.consigneeCompany.taxId}` : null,
        invoice.consigneeCompany?.registrationNumber ? `${consigneeLabels.registrationLabel}: ${invoice.consigneeCompany.registrationNumber}` : null,
      ]
        .filter(Boolean)
        .join("   ");
      if (consigneeTaxLine) {
        doc.fontSize(8).fillColor("#444444").text(consigneeTaxLine, leftX, consigneeBlockY, { width: 240 });
        consigneeBlockY += 10;
      }
      if (consigneePhone) {
        doc.fontSize(8).fillColor("#444444").text(`Phone: ${consigneePhone}`, leftX, consigneeBlockY, { width: 240 });
        consigneeBlockY += 10;
      }

      let buyerBlockY = y;
      if (invoice.customer) {
        const buyerLines = [invoice.customer.email, invoice.customer.phone].filter((l): l is string => !!l);
        doc.fontSize(8).fillColor("#444444");
        for (const line of [...buyerLines, ...formatPostalAddress(invoice.customer.billingAddress)]) {
          doc.text(line, midX, buyerBlockY, { width: 240 });
          buyerBlockY += 10;
        }
      }
      if (invoice.buyerTaxId) {
        doc.fontSize(8).fillColor("#444444").text(`Buyer Tax ID: ${invoice.buyerTaxId}`, midX, buyerBlockY, { width: 240 });
        buyerBlockY += 10;
      }
      y = Math.max(consigneeBlockY, buyerBlockY) + 10;

      // ── Shipping particulars grid (3 columns x 3 rows) ─────────────
      const colW = (pageRight - leftX) / 3;
      function shipRow(cells: [string, string][]) {
        rule();
        y += 6;
        for (let i = 0; i < cells.length; i++) {
          label(cells[i][0], leftX + i * colW, colW - 8);
        }
        y += 11;
        for (let i = 0; i < cells.length; i++) {
          value(cells[i][1], leftX + i * colW, colW - 8);
        }
        y += 16;
      }
      shipRow([
        ["CARRIAGE BY", invoice.carriageBy ?? "—"],
        ["PLACE OF RECEIPT", invoice.placeOfReceipt ?? "—"],
        ["COUNTRY OF ORIGIN", invoice.countryOfOrigin ?? "India"],
      ]);
      shipRow([
        ["FLIGHT / VESSEL NO.", invoice.flightOrVesselNumber ?? "—"],
        ["PORT OF LOADING", invoice.portOfLoading ?? "—"],
        ["COUNTRY OF FINAL DESTINATION", invoice.country?.name ?? "—"],
      ]);
      shipRow([
        ["PORT OF DISCHARGE", invoice.portOfDischarge ?? "—"],
        ["TERMS OF DELIVERY & PAYMENT", invoice.paymentTerms ?? "—"],
        ["FREIGHT", invoice.freightTerms ?? "—"],
      ]);
      rule();
      y += 14;

      // ── Line items table ────────────────────────────────────────────
      const colSno = leftX;
      const colDesc = leftX + 30;
      const colHsn = leftX + 260;
      const colQty = leftX + 330;
      const colRate = leftX + 380;
      const colTotal = leftX + 440;

      doc.fontSize(8).fillColor("#999999");
      doc.text("S.NO", colSno, y, { width: 30 });
      doc.text("PARTICULARS", colDesc, y, { width: 225 });
      doc.text("HS CODE", colHsn, y, { width: 65 });
      doc.text("QTY", colQty, y, { width: 45, align: "right" });
      doc.text("RATE", colRate, y, { width: 55, align: "right" });
      doc.text("TOTAL", colTotal, y, { width: pageRight - colTotal, align: "right" });
      y += 12;
      rule();
      y += 8;

      invoice.lines.forEach((line, index) => {
        const lineTotal = line.quantity * Number(line.unitPrice);
        doc.fontSize(9).fillColor("#111111");
        doc.text(String(index + 1), colSno, y, { width: 30 });
        doc.text(line.product.name, colDesc, y, { width: 225 });
        doc.text(line.product.hsnCode ?? "—", colHsn, y, { width: 65 });
        doc.text(String(line.quantity), colQty, y, { width: 45, align: "right" });
        doc.text(formatMoney(line.unitPrice, currency), colRate, y, { width: 55, align: "right" });
        doc.text(formatMoney(lineTotal, currency), colTotal, y, { width: pageRight - colTotal, align: "right" });
        y += 16;
      });
      y += 4;
      rule();
      y += 10;

      // ── Totals ───────────────────────────────────────────────────────
      const totalsLabelX = leftX + 300;
      const totalsValueX = leftX + 420;
      doc.fontSize(9).fillColor("#444444");
      doc.text(`Total (${currency})`, totalsLabelX, y, { width: 115, align: "right" });
      doc.text(formatMoney(total, currency), totalsValueX, y, { width: pageRight - totalsValueX, align: "right" });
      y += 14;

      if (invoice.exportUnderLut) {
        doc.fontSize(8).fillColor("#444444").text("SUPPLY MEANT FOR EXPORT UNDER LUT WITHOUT PAYMENT OF INTEGRATED TAX", leftX, y, { width: pageRight - leftX });
        y += 12;
        if (invoice.company?.lutArn) {
          doc.text(`LUT ARN: ${invoice.company.lutArn}`, leftX, y, { width: pageRight - leftX });
          y += 12;
        }
      } else if (invoice.gstApplicable) {
        if (taxableValueInr != null) {
          doc.fontSize(9).fillColor("#444444");
          doc.text("Taxable Value (INR)", totalsLabelX, y, { width: 115, align: "right" });
          doc.text(formatMoney(taxableValueInr, "INR"), totalsValueX, y, { width: pageRight - totalsValueX, align: "right" });
          y += 14;
        }
        doc.text(`IGST (${gstRatePct}%)`, totalsLabelX, y, { width: 115, align: "right" });
        doc.text(formatMoney(igst, currency), totalsValueX, y, { width: pageRight - totalsValueX, align: "right" });
        y += 14;
        if (igstAmountInr != null) {
          doc.text("IGST Amount (INR)", totalsLabelX, y, { width: 115, align: "right" });
          doc.text(formatMoney(igstAmountInr, "INR"), totalsValueX, y, { width: pageRight - totalsValueX, align: "right" });
          y += 14;
        }
      }

      doc.fontSize(10).fillColor("#111111").font("Helvetica-Bold");
      doc.text(`Grand Total (${currency})`, totalsLabelX, y, { width: 115, align: "right" });
      doc.text(formatMoney(grandTotal, currency), totalsValueX, y, { width: pageRight - totalsValueX, align: "right" });
      doc.font("Helvetica");
      y += 24;

      doc.fontSize(9).fillColor("#444444").text(`Amount in words: ${amountToWords(grandTotal, currency)}`, leftX, y, { width: pageRight - leftX });
      y += 30;

      // ── Signatory ───────────────────────────────────────────────────
      doc.fontSize(9).fillColor("#111111").text(`For ${invoice.company?.legalName ?? invoice.company?.name ?? "Mantra Sports International"}`, leftX, y);
      y += 40;
      doc.fontSize(9).fillColor("#444444").text("Authorised Signatory", leftX, y);

      doc.end();
    });
  }
}
