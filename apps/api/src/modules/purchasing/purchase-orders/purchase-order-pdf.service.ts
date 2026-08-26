import { Injectable } from "@nestjs/common";
import PDFDocument from "pdfkit";
import { MANTRA_LOGO_BASE64 } from "../../../common/assets/mantra-logo";
import { formatDate, formatMoney, formatPostalAddress } from "../../../common/pdf/pdf-format";

interface PurchaseOrderPdfLine {
  quantity: number;
  unitCost: { toString(): string };
  product: { name: string; sku: string };
}

interface PurchaseOrderPdfData {
  id: string;
  poNumber: string | null;
  status: string;
  orderDate: Date | string;
  deliveryDueDate: Date | string | null;
  supplier: {
    name: string;
    email: string | null;
    phone: string | null;
    // Prisma Json field — shape follows AddressDto by convention, but isn't type-guaranteed.
    address: unknown;
  };
  lines: PurchaseOrderPdfLine[];
  company: { name: string; legalName: string | null; taxId: string | null; address: string | null; baseCurrency?: { code: string } | null } | null;
  country: { currency?: { code: string } | null } | null;
  currency: { code: string } | null;
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  PARTIALLY_RECEIVED: "Partially Received",
  RECEIVED: "Received",
  CANCELLED: "Cancelled",
};

function currencyCode(order: PurchaseOrderPdfData): string {
  return order.currency?.code ?? order.country?.currency?.code ?? order.company?.baseCurrency?.code ?? "USD";
}

/** Falls back to a short, stable reference derived from the id for POs predating the poNumber field. */
function displayReference(order: PurchaseOrderPdfData): string {
  return order.poNumber ?? `PO-${order.id.slice(0, 8).toUpperCase()}`;
}

/**
 * Renders a Purchase Order as a PDF — mirrors InvoicePdfService, but Mantra
 * is the buyer here, not the seller, so the roles are reversed: "FROM" is
 * still Mantra's own company details, but the counterparty block is
 * "SUPPLIER" rather than "BILL TO", and there's no GST/Tax Invoice concern
 * since this isn't a sale.
 */
@Injectable()
export class PurchaseOrderPdfService {
  generate(order: PurchaseOrderPdfData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const currency = currencyCode(order);
      const logo = Buffer.from(MANTRA_LOGO_BASE64, "base64");
      const total = order.lines.reduce((sum, line) => sum + line.quantity * Number(line.unitCost), 0);

      // Header: logo + document title/reference
      doc.image(logo, 50, 45, { width: 60 });
      doc.fontSize(20).fillColor("#111111").text("PURCHASE ORDER", 0, 50, { align: "right" });
      doc.fontSize(10).fillColor("#666666").text(displayReference(order), { align: "right" });
      doc.moveDown(2);

      // From / Supplier — two columns
      const colTop = 130;
      const leftX = 50;
      const rightX = 320;

      doc.fontSize(9).fillColor("#999999").text("FROM", leftX, colTop);
      doc.fontSize(11).fillColor("#111111").text(order.company?.legalName ?? order.company?.name ?? "Mantra Sports", leftX, colTop + 14, { width: 240 });
      let fromY = colTop + 30;
      if (order.company?.address) {
        doc.fontSize(9).fillColor("#444444");
        for (const line of order.company.address.split("\n")) {
          doc.text(line, leftX, fromY, { width: 240 });
          fromY += 12;
        }
      }
      if (order.company?.taxId) {
        doc.fontSize(9).fillColor("#444444").text(`Tax ID: ${order.company.taxId}`, leftX, fromY, { width: 240 });
      }

      doc.fontSize(9).fillColor("#999999").text("SUPPLIER", rightX, colTop);
      doc.fontSize(11).fillColor("#111111").text(order.supplier.name, rightX, colTop + 14, { width: 220 });
      let toY = colTop + 30;
      const contactLines = [order.supplier.email, order.supplier.phone].filter((l): l is string => !!l);
      for (const line of [...contactLines, ...formatPostalAddress(order.supplier.address)]) {
        doc.fontSize(9).fillColor("#444444").text(line, rightX, toY, { width: 220 });
        toY += 12;
      }

      // Meta row: order date / delivery due date / status
      const metaY = Math.max(fromY, toY) + 20;
      doc.fontSize(9).fillColor("#999999");
      doc.text("ORDER DATE", leftX, metaY);
      doc.text("DELIVERY DUE DATE", leftX + 150, metaY);
      doc.text("STATUS", leftX + 300, metaY);
      doc.fontSize(10).fillColor("#111111");
      doc.text(formatDate(order.orderDate), leftX, metaY + 14);
      doc.text(formatDate(order.deliveryDueDate), leftX + 150, metaY + 14);
      doc.text(STATUS_LABELS[order.status] ?? order.status, leftX + 300, metaY + 14);

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
      doc.text("UNIT COST", colPrice, tableY, { width: 70, align: "right" });
      doc.text("TOTAL", colTotal, tableY, { width: 65, align: "right" });
      tableY += 16;
      doc.moveTo(leftX, tableY).lineTo(545, tableY).strokeColor("#E0DFDB").stroke();
      tableY += 10;

      for (const line of order.lines) {
        const lineTotal = line.quantity * Number(line.unitCost);
        doc.fontSize(10).fillColor("#111111").text(line.product.name, colDesc, tableY, { width: 280 });
        doc.fontSize(8).fillColor("#999999").text(line.product.sku, colDesc, tableY + 13, { width: 280 });
        doc.fontSize(10).fillColor("#111111");
        doc.text(String(line.quantity), colQty, tableY, { width: 50, align: "right" });
        doc.text(formatMoney(line.unitCost, currency), colPrice, tableY, { width: 70, align: "right" });
        doc.text(formatMoney(lineTotal, currency), colTotal, tableY, { width: 65, align: "right" });
        tableY += 30;
      }

      doc.moveTo(leftX, tableY).lineTo(545, tableY).strokeColor("#E0DFDB").stroke();
      tableY += 12;
      doc.fontSize(11).fillColor("#111111");
      doc.text("Total", colPrice, tableY, { width: 70, align: "right" });
      doc.font("Helvetica-Bold").text(formatMoney(total, currency), colTotal - 20, tableY, { width: 85, align: "right" });
      doc.font("Helvetica");

      doc.fontSize(9).fillColor("#999999").text("Please confirm receipt of this order.", leftX, 750, { width: 495, align: "center" });

      doc.end();
    });
  }
}
