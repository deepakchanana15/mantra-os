import { Injectable } from "@nestjs/common";
import PDFDocument from "pdfkit";
import { MANTRA_LOGO_BASE64 } from "../../../common/assets/mantra-logo";
import { formatDate, formatMoney, formatPostalAddress } from "../../../common/pdf/pdf-format";

interface InvoicePdfLine {
  quantity: number;
  unitPrice: { toString(): string };
  product: { name: string; sku: string };
}

interface InvoicePdfData {
  invoiceNumber: string;
  status: string;
  amount: { toString(): string };
  discountAmount: { toString(): string } | null;
  gstApplicable: boolean;
  issuedAt: Date | string | null;
  dueDate: Date | string | null;
  createdAt: Date | string;
  customer: {
    name: string;
    email: string | null;
    phone: string | null;
    // Prisma Json field — shape follows AddressDto by convention, but isn't
    // type-guaranteed, so formatBillingAddress() narrows it defensively.
    billingAddress: unknown;
  };
  lines: InvoicePdfLine[];
  company: {
    name: string;
    legalName: string | null;
    taxId: string | null;
    registrationNumber: string | null;
    address: string | null;
    bankDetails: string | null;
    baseCurrency?: { code: string } | null;
  } | null;
  country: { currency?: { code: string } | null } | null;
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  PAID: "Paid",
  OVERDUE: "Overdue",
  VOID: "Void",
};

function currencyCode(invoice: InvoicePdfData): string {
  return invoice.country?.currency?.code ?? invoice.company?.baseCurrency?.code ?? "USD";
}

/**
 * Renders an Invoice as a PDF. Stays a plain "Invoice", never "Tax
 * Invoice" — see DECISIONS.md "Invoice PDF generation". GST is opt-in per
 * invoice (`gstApplicable`) at a fixed 10% rate, breaking out as its own
 * line between the post-discount Total and the Grand Total.
 */
@Injectable()
export class InvoicePdfService {
  generate(invoice: InvoicePdfData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const currency = currencyCode(invoice);
      const logo = Buffer.from(MANTRA_LOGO_BASE64, "base64");
      const subtotal = Number(invoice.amount);
      const discount = Number(invoice.discountAmount ?? 0);
      const total = subtotal - discount;
      const discountPercent = subtotal > 0 ? (discount / subtotal) * 100 : 0;
      const gst = invoice.gstApplicable ? Math.round(total * 0.1 * 100) / 100 : 0;
      const grandTotal = total + gst;

      // Header: logo + invoice title/number
      doc.image(logo, 50, 45, { width: 60 });
      doc.fontSize(22).fillColor("#111111").text("INVOICE", 0, 50, { align: "right" });
      doc.fontSize(10).fillColor("#666666").text(invoice.invoiceNumber, { align: "right" });
      doc.moveDown(2);

      // From / Bill To — two columns, flush to the left and right margins
      const colTop = 130;
      const leftX = 50;
      const pageRight = 545;
      const rightX = pageRight - 240;

      doc.fontSize(9).fillColor("#999999").text("FROM", leftX, colTop);
      doc.fontSize(11).fillColor("#111111").text(invoice.company?.legalName ?? invoice.company?.name ?? "Mantra Sports", leftX, colTop + 14, { width: 240 });
      let fromY = colTop + 30;
      if (invoice.company?.address) {
        doc.fontSize(9).fillColor("#444444");
        for (const line of invoice.company.address.split("\n")) {
          doc.text(line, leftX, fromY, { width: 240 });
          fromY += 12;
        }
      }
      const isAustralianCompany = invoice.company?.baseCurrency?.code === "AUD";
      if (invoice.company?.taxId) {
        doc.fontSize(9).fillColor("#444444").text(`${isAustralianCompany ? "ABN" : "Tax ID"}: ${invoice.company.taxId}`, leftX, fromY, { width: 240 });
        fromY += 12;
      }
      if (invoice.company?.registrationNumber) {
        doc.fontSize(9).fillColor("#444444").text(`${isAustralianCompany ? "ACN" : "Registration"}: ${invoice.company.registrationNumber}`, leftX, fromY, { width: 240 });
        fromY += 12;
      }

      doc.fontSize(9).fillColor("#999999").text("BILL TO", rightX, colTop, { width: 240, align: "right" });
      doc.fontSize(11).fillColor("#111111").text(invoice.customer.name, rightX, colTop + 14, { width: 240, align: "right" });
      let toY = colTop + 30;
      const contactLines = [invoice.customer.email, invoice.customer.phone].filter((l): l is string => !!l);
      for (const line of [...contactLines, ...formatPostalAddress(invoice.customer.billingAddress)]) {
        doc.fontSize(9).fillColor("#444444").text(line, rightX, toY, { width: 240, align: "right" });
        toY += 12;
      }

      // Meta row: issue date (left) / due date (center) / status (right)
      const metaY = Math.max(fromY, toY) + 20;
      const metaColWidth = 150;
      const metaCenterX = leftX + (pageRight - leftX - metaColWidth) / 2;
      const metaRightX = pageRight - metaColWidth;
      doc.fontSize(9).fillColor("#999999");
      doc.text("ISSUE DATE", leftX, metaY, { width: metaColWidth });
      doc.text("DUE DATE", metaCenterX, metaY, { width: metaColWidth, align: "center" });
      doc.text("STATUS", metaRightX, metaY, { width: metaColWidth, align: "right" });
      doc.fontSize(10).fillColor("#111111");
      doc.text(formatDate(invoice.issuedAt ?? invoice.createdAt), leftX, metaY + 14, { width: metaColWidth });
      doc.text(formatDate(invoice.dueDate), metaCenterX, metaY + 14, { width: metaColWidth, align: "center" });
      doc.text(STATUS_LABELS[invoice.status] ?? invoice.status, metaRightX, metaY + 14, { width: metaColWidth, align: "right" });

      // Line items table
      let tableY = metaY + 50;
      const colDesc = leftX;
      const colQty = 340;
      const colPrice = 400;
      const colTotal = 480;

      doc.moveTo(leftX, tableY).lineTo(545, tableY).strokeColor("#E0DFDB").stroke();
      tableY += 8;
      doc.fontSize(9).fillColor("#999999");
      doc.text("DESCRIPTION", colDesc, tableY);
      doc.text("QTY", colQty, tableY, { width: 50, align: "right" });
      doc.text("UNIT PRICE", colPrice, tableY, { width: 70, align: "right" });
      doc.text("TOTAL", colTotal, tableY, { width: 65, align: "right" });
      tableY += 16;
      doc.moveTo(leftX, tableY).lineTo(545, tableY).strokeColor("#E0DFDB").stroke();
      tableY += 10;

      if (invoice.lines.length > 0) {
        for (const line of invoice.lines) {
          const lineTotal = line.quantity * Number(line.unitPrice);
          doc.fontSize(10).fillColor("#111111").text(line.product.name, colDesc, tableY, { width: 280 });
          doc.fontSize(8).fillColor("#999999").text(line.product.sku, colDesc, tableY + 13, { width: 280 });
          doc.fontSize(10).fillColor("#111111");
          doc.text(String(line.quantity), colQty, tableY, { width: 50, align: "right" });
          doc.text(formatMoney(line.unitPrice, currency), colPrice, tableY, { width: 70, align: "right" });
          doc.text(formatMoney(lineTotal, currency), colTotal, tableY, { width: 65, align: "right" });
          tableY += 30;
        }
      } else {
        doc.fontSize(10).fillColor("#111111").text("Services / goods provided", colDesc, tableY, { width: 280 });
        doc.text(formatMoney(subtotal, currency), colTotal, tableY, { width: 65, align: "right" });
        tableY += 24;
      }

      doc.moveTo(leftX, tableY).lineTo(545, tableY).strokeColor("#E0DFDB").stroke();
      tableY += 12;

      if (discount > 0) {
        doc.fontSize(10).fillColor("#444444");
        doc.text("Subtotal", colPrice, tableY, { width: 70, align: "right" });
        doc.text(formatMoney(subtotal, currency), colTotal, tableY, { width: 65, align: "right" });
        tableY += 16;
        doc.text(`Discount (${discountPercent.toFixed(2)}%)`, colPrice - 40, tableY, { width: 110, align: "right" });
        doc.text(`-${formatMoney(discount, currency)}`, colTotal, tableY, { width: 65, align: "right" });
        tableY += 16;
      }

      if (invoice.gstApplicable) {
        doc.fontSize(10).fillColor("#444444");
        doc.text("Total", colPrice, tableY, { width: 70, align: "right" });
        doc.text(formatMoney(total, currency), colTotal - 20, tableY, { width: 85, align: "right" });
        tableY += 16;
        doc.text("GST (10%)", colPrice - 40, tableY, { width: 110, align: "right" });
        doc.text(formatMoney(gst, currency), colTotal - 20, tableY, { width: 85, align: "right" });
        tableY += 16;
        doc.fontSize(11).fillColor("#111111");
        doc.text("Grand Total", colPrice - 40, tableY, { width: 110, align: "right" });
        doc.font("Helvetica-Bold").text(formatMoney(grandTotal, currency), colTotal - 20, tableY, { width: 85, align: "right" });
        doc.font("Helvetica");
        tableY += 30;
      } else {
        doc.fontSize(11).fillColor("#111111");
        doc.text("Total", colPrice, tableY, { width: 70, align: "right" });
        doc.font("Helvetica-Bold").text(formatMoney(total, currency), colTotal - 20, tableY, { width: 85, align: "right" });
        doc.font("Helvetica");
        tableY += 30;
      }

      if (invoice.company?.bankDetails) {
        doc.fontSize(9).fillColor("#999999").text("PAYMENT DETAILS", leftX, tableY);
        tableY += 14;
        doc.fontSize(9).fillColor("#444444");
        for (const line of invoice.company.bankDetails.split("\n")) {
          doc.text(line, leftX, tableY, { width: 300 });
          tableY += 12;
        }
      }

      doc.fontSize(9).fillColor("#999999").text("Thank you for your business.", leftX, 750, { width: 495, align: "center" });

      doc.end();
    });
  }
}
