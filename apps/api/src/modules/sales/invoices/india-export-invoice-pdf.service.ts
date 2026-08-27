import { Injectable } from "@nestjs/common";
import PDFDocument from "pdfkit";
import { MANTRA_LOGO_BASE64 } from "../../../common/assets/mantra-logo";
import { amountToWords } from "../../../common/pdf/number-to-words";
import { companyTaxLabels, formatDate, formatMoney, formatNumber, formatPostalAddress } from "../../../common/pdf/pdf-format";

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

const BORDER = "#999999";
const LABEL_COLOR = "#666666";
const VALUE_COLOR = "#111111";
const PAD = 4;

/**
 * Renders an Indian export Invoice as a bordered grid — the customs/bank
 * template exporters already use (Consignor/Consignee cells, shipping
 * particulars, HSN-coded line items with a Taxable Value INR / IGST %/
 * Amount INR breakdown) — rather than InvoicePdfService's clean modern
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
      const fullW = pageRight - leftX;

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

      // ── Small grid-drawing helpers ────────────────────────────────────
      function rect(x: number, y: number, w: number, h: number) {
        doc.rect(x, y, w, h).strokeColor(BORDER).stroke();
      }
      function vline(x: number, y1: number, y2: number) {
        doc.moveTo(x, y1).lineTo(x, y2).strokeColor(BORDER).stroke();
      }
      function hline(x1: number, x2: number, y: number) {
        doc.moveTo(x1, y).lineTo(x2, y).strokeColor(BORDER).stroke();
      }
      function cellLabel(text: string, x: number, y: number, w: number, opts?: PDFKit.Mixins.TextOptions) {
        doc.fontSize(7).fillColor(LABEL_COLOR).font("Helvetica-Bold").text(text, x + PAD, y + 2, { width: w - PAD * 2, ...opts });
        doc.font("Helvetica");
      }
      function cellValue(text: string, x: number, y: number, w: number, opts?: PDFKit.Mixins.TextOptions) {
        doc.fontSize(9).fillColor(VALUE_COLOR).text(text, x + PAD, y, { width: w - PAD * 2, ...opts });
      }

      // ── Logo + title ────────────────────────────────────────────────
      const logo = Buffer.from(MANTRA_LOGO_BASE64, "base64");
      doc.image(logo, leftX, 30, { width: 45 });
      doc.fontSize(16).fillColor("#111111").font("Helvetica-Bold").text("INVOICE", leftX, 35, { width: fullW, align: "center" });
      doc.font("Helvetica");
      let y = 85;

      // ── Section 1: Consignor / Invoice No & Date / IEC / GSTIN / PO ──
      const s1ColB = leftX + 220;
      const s1ColC = leftX + 220 + 147;
      const s1H = 95;
      rect(leftX, y, fullW, s1H);
      vline(s1ColB, y, y + s1H);
      vline(s1ColC, y, y + s1H);
      hline(s1ColB, pageRight, y + 47);

      cellLabel("CONSIGNOR", leftX, y, 220);
      doc.fontSize(9).fillColor(VALUE_COLOR).font("Helvetica-Bold").text(invoice.company?.legalName ?? invoice.company?.name ?? "Mantra Sports International", leftX + PAD, y + 12, { width: 220 - PAD * 2 });
      doc.font("Helvetica");
      let consignorY = y + 24;
      if (invoice.company?.address) {
        doc.fontSize(8).fillColor("#444444");
        for (const line of invoice.company.address.split("\n")) {
          doc.text(line, leftX + PAD, consignorY, { width: 220 - PAD * 2 });
          consignorY += 10;
        }
      }

      cellLabel("INVOICE NO. & DATE", s1ColB, y, 147);
      cellValue(`${invoice.invoiceNumber} | ${formatDate(invoice.issuedAt ?? invoice.createdAt)}`, s1ColB, y + 12, 147);
      cellLabel(`${companyLabels.taxIdLabel} NO.`, s1ColB, y + 47, 147);
      cellValue(invoice.company?.taxId ?? "—", s1ColB, y + 59, 147);

      cellLabel(`${companyLabels.registrationLabel} NUMBER`, s1ColC, y, pageRight - s1ColC);
      cellValue(invoice.company?.registrationNumber ?? "—", s1ColC, y + 12, pageRight - s1ColC);
      cellLabel("BUYER'S PO NO.", s1ColC, y + 47, pageRight - s1ColC);
      cellValue(invoice.purchaseOrder?.poNumber ?? "—", s1ColC, y + 59, pageRight - s1ColC);

      y += s1H;

      // ── Section 2: Consignee / Buyer ──────────────────────────────────
      const s2Mid = leftX + fullW / 2;
      const s2H = 92;
      rect(leftX, y, fullW, s2H);
      vline(s2Mid, y, y + s2H);

      cellLabel("CONSIGNEE", leftX, y, fullW / 2);
      doc.fontSize(9).fillColor(VALUE_COLOR).font("Helvetica-Bold").text(invoice.consigneeCompany?.legalName ?? invoice.consigneeCompany?.name ?? "—", leftX + PAD, y + 12, { width: fullW / 2 - PAD * 2 });
      doc.font("Helvetica");
      let consigneeY = y + 24;
      if (invoice.consigneeCompany?.address) {
        doc.fontSize(8).fillColor("#444444");
        for (const line of invoice.consigneeCompany.address.split("\n")) {
          doc.text(line, leftX + PAD, consigneeY, { width: fullW / 2 - PAD * 2 });
          consigneeY += 10;
        }
      }
      const consigneeTaxLine = [
        invoice.consigneeCompany?.taxId ? `${consigneeLabels.taxIdLabel}: ${invoice.consigneeCompany.taxId}` : null,
        invoice.consigneeCompany?.registrationNumber ? `${consigneeLabels.registrationLabel}: ${invoice.consigneeCompany.registrationNumber}` : null,
      ]
        .filter(Boolean)
        .join("   ");
      if (consigneeTaxLine) {
        doc.fontSize(8).fillColor("#444444").text(consigneeTaxLine, leftX + PAD, consigneeY, { width: fullW / 2 - PAD * 2 });
        consigneeY += 10;
      }
      const consigneePhone = invoice.consigneePhone ?? invoice.consigneeCompany?.phone;
      if (consigneePhone) {
        doc.fontSize(8).fillColor("#444444").text(`Phone: ${consigneePhone}`, leftX + PAD, consigneeY, { width: fullW / 2 - PAD * 2 });
      }

      cellLabel("BUYER (IF OTHER THAN CONSIGNEE)", s2Mid, y, fullW / 2);
      cellValue(invoice.customer ? invoice.customer.name : "Same as Consignee", s2Mid, y + 12, fullW / 2);
      let buyerY = y + 24;
      if (invoice.customer) {
        const buyerLines = [invoice.customer.email, invoice.customer.phone].filter((l): l is string => !!l);
        doc.fontSize(8).fillColor("#444444");
        for (const line of [...buyerLines, ...formatPostalAddress(invoice.customer.billingAddress)]) {
          doc.text(line, s2Mid + PAD, buyerY, { width: fullW / 2 - PAD * 2 });
          buyerY += 10;
        }
      }
      if (invoice.buyerTaxId) {
        doc.fontSize(8).fillColor("#444444").text(`Buyer Tax ID: ${invoice.buyerTaxId}`, s2Mid + PAD, buyerY, { width: fullW / 2 - PAD * 2 });
      }

      y += s2H;

      // ── Section 3: Shipping particulars (3 cols x 3 rows) ─────────────
      const s3ColW = fullW / 3;
      const s3RowH = 26;
      const s3H = s3RowH * 3;
      rect(leftX, y, fullW, s3H);
      vline(leftX + s3ColW, y, y + s3H);
      vline(leftX + s3ColW * 2, y, y + s3H);
      hline(leftX, pageRight, y + s3RowH);
      hline(leftX, pageRight, y + s3RowH * 2);

      const shipRows: [string, string][][] = [
        [
          ["CARRIAGE BY", invoice.carriageBy ?? "—"],
          ["PLACE OF RECEIPT", invoice.placeOfReceipt ?? "—"],
          ["COUNTRY OF ORIGIN", invoice.countryOfOrigin ?? "India"],
        ],
        [
          ["FLIGHT / VESSEL NO.", invoice.flightOrVesselNumber ?? "—"],
          ["PORT OF LOADING", invoice.portOfLoading ?? "—"],
          ["COUNTRY OF FINAL DESTINATION", invoice.country?.name ?? "—"],
        ],
        [
          ["PORT OF DISCHARGE", invoice.portOfDischarge ?? "—"],
          ["TERMS OF DELIVERY & PAYMENT", invoice.paymentTerms ?? "—"],
          ["FREIGHT", invoice.freightTerms ?? "—"],
        ],
      ];
      shipRows.forEach((row, rowIndex) => {
        const rowY = y + rowIndex * s3RowH;
        row.forEach(([lbl, val], colIndex) => {
          const colX = leftX + colIndex * s3ColW;
          cellLabel(lbl, colX, rowY, s3ColW);
          cellValue(val, colX, rowY + 12, s3ColW);
        });
      });

      y += s3H + 10;

      // ── Section 4: Line items table ────────────────────────────────────
      const cols = [
        { label: "S.NO", width: 28, align: "left" as const },
        { label: "PARTICULARS", width: 137, align: "left" as const },
        { label: "HS CODE", width: 55, align: "left" as const },
        { label: "QTY", width: 32, align: "right" as const },
        { label: "RATE", width: 48, align: "right" as const },
        { label: `TOTAL ${currency}`, width: 55, align: "right" as const },
        { label: "TAXABLE INR", width: 62, align: "right" as const },
        { label: "IGST %", width: 40, align: "right" as const },
        { label: "AMOUNT INR", width: 58, align: "right" as const },
      ];
      const colX: number[] = [];
      {
        let x = leftX;
        for (const col of cols) {
          colX.push(x);
          x += col.width;
        }
      }
      const headerH = 20;
      const rowH = 18;
      const totalsRowH = 18;
      const tableH = headerH + invoice.lines.length * rowH + totalsRowH;

      rect(leftX, y, fullW, tableH);
      for (let i = 1; i < cols.length; i++) {
        vline(colX[i], y, y + tableH);
      }
      hline(leftX, pageRight, y + headerH);
      hline(leftX, pageRight, y + tableH - totalsRowH);

      cols.forEach((col, i) => {
        doc.fontSize(7).fillColor(LABEL_COLOR).font("Helvetica-Bold").text(col.label, colX[i] + PAD, y + 6, { width: col.width - PAD * 2, align: col.align });
      });
      doc.font("Helvetica");

      let rowY = y + headerH;
      invoice.lines.forEach((line, index) => {
        const lineTotal = line.quantity * Number(line.unitPrice);
        doc.fontSize(8).fillColor(VALUE_COLOR);
        doc.text(String(index + 1), colX[0] + PAD, rowY + 4, { width: cols[0].width - PAD * 2 });
        doc.text(line.product.name, colX[1] + PAD, rowY + 4, { width: cols[1].width - PAD * 2 });
        doc.text(line.product.hsnCode ?? "—", colX[2] + PAD, rowY + 4, { width: cols[2].width - PAD * 2 });
        doc.text(String(line.quantity), colX[3] + PAD, rowY + 4, { width: cols[3].width - PAD * 2, align: "right" });
        doc.text(formatNumber(line.unitPrice), colX[4] + PAD, rowY + 4, { width: cols[4].width - PAD * 2, align: "right" });
        doc.text(formatNumber(lineTotal), colX[5] + PAD, rowY + 4, { width: cols[5].width - PAD * 2, align: "right" });
        rowY += rowH;
      });

      // Totals row — same columns as the line items, matching the export template
      const totalsY = y + tableH - totalsRowH;
      doc.fontSize(8).font("Helvetica-Bold").fillColor(VALUE_COLOR);
      doc.text(formatNumber(total), colX[5] + PAD, totalsY + 5, { width: cols[5].width - PAD * 2, align: "right" });
      if (taxableValueInr != null) {
        doc.text(formatNumber(taxableValueInr), colX[6] + PAD, totalsY + 5, { width: cols[6].width - PAD * 2, align: "right" });
      }
      if (!invoice.exportUnderLut && invoice.gstApplicable) {
        doc.text(`${gstRatePct}%`, colX[7] + PAD, totalsY + 5, { width: cols[7].width - PAD * 2, align: "right" });
        if (igstAmountInr != null) {
          doc.text(formatNumber(igstAmountInr), colX[8] + PAD, totalsY + 5, { width: cols[8].width - PAD * 2, align: "right" });
        }
      }
      doc.font("Helvetica");

      y += tableH + 8;

      // ── Declaration (LUT / IGST) ───────────────────────────────────────
      if (invoice.exportUnderLut) {
        doc.fontSize(8).fillColor("#444444").text("SUPPLY MEANT FOR EXPORT UNDER LUT WITHOUT PAYMENT OF INTEGRATED TAX", leftX, y, { width: fullW });
        y += 11;
        if (invoice.company?.lutArn) {
          doc.text(`LUT ARN: ${invoice.company.lutArn}`, leftX, y, { width: fullW });
          y += 11;
        }
        y += 4;
      } else if (invoice.gstApplicable) {
        doc.fontSize(8).fillColor("#444444").text("SUPPLY MEANT FOR EXPORT ON PAYMENT OF INTEGRATED TAX", leftX, y, { width: fullW });
        y += 15;
      }

      // ── Amount in words + boxed grand total ────────────────────────────
      const wordsH = 22;
      const grandTotalBoxW = 110;
      rect(leftX, y, fullW, wordsH);
      vline(pageRight - grandTotalBoxW, y, y + wordsH);
      doc.fontSize(8).fillColor(LABEL_COLOR).font("Helvetica-Bold").text("AMOUNT IN WORDS", leftX + PAD, y + 3, { width: fullW - grandTotalBoxW - PAD * 2 });
      doc.font("Helvetica").fontSize(8).fillColor(VALUE_COLOR).text(amountToWords(grandTotal, currency), leftX + PAD, y + 12, { width: fullW - grandTotalBoxW - PAD * 2 });
      doc.fontSize(10).font("Helvetica-Bold").fillColor(VALUE_COLOR).text(formatMoney(grandTotal, currency), pageRight - grandTotalBoxW + PAD, y + 7, { width: grandTotalBoxW - PAD * 2, align: "right" });
      doc.font("Helvetica");

      y += wordsH + 30;

      // ── Signatory ───────────────────────────────────────────────────
      doc.fontSize(9).fillColor(VALUE_COLOR).text(`For ${invoice.company?.legalName ?? invoice.company?.name ?? "Mantra Sports International"}`, leftX, y);
      y += 36;
      doc.fontSize(9).fillColor(LABEL_COLOR).text("Authorised Signatory", leftX, y);

      doc.end();
    });
  }
}
