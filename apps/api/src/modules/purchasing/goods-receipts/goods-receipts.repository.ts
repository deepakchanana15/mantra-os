import { Injectable, NotFoundException } from "@nestjs/common";
import { BaseRepository } from "../../../common/repositories/base.repository";
import { CreateGoodsReceiptDto } from "./dto/create-goods-receipt.dto";

@Injectable()
export class GoodsReceiptsRepository extends BaseRepository {
  findAll(params: { skip?: number; take?: number; purchaseOrderId?: string }) {
    return this.db.goodsReceipt.findMany({
      where: {
        organizationId: this.organizationId,
        ...(params.purchaseOrderId ? { purchaseOrderId: params.purchaseOrderId } : {}),
      },
      include: { warehouse: true, lines: true },
      skip: params.skip ?? 0,
      take: params.take ?? 50,
      orderBy: { receivedAt: "desc" },
    });
  }

  async findOneOrThrow(id: string) {
    const receipt = await this.db.goodsReceipt.findFirst({
      where: { id, organizationId: this.organizationId },
      include: { warehouse: true, lines: { include: { purchaseOrderLine: true } } },
    });
    if (!receipt) {
      throw new NotFoundException("Goods receipt not found");
    }
    return receipt;
  }

  /** Resolves each line's productId from its PurchaseOrderLine — the DTO only carries purchaseOrderLineId + quantity. */
  async resolveLineProducts(purchaseOrderLineIds: string[]) {
    const lines = await this.db.purchaseOrderLine.findMany({
      where: { id: { in: purchaseOrderLineIds }, organizationId: this.organizationId },
    });
    const byId = new Map(lines.map((line) => [line.id, line]));
    const missing = purchaseOrderLineIds.filter((id) => !byId.has(id));
    if (missing.length > 0) {
      throw new NotFoundException(`Purchase order line(s) not found: ${missing.join(", ")}`);
    }
    return byId;
  }

  create(dto: CreateGoodsReceiptDto) {
    return this.db.goodsReceipt.create({
      data: {
        organizationId: this.organizationId,
        purchaseOrderId: dto.purchaseOrderId,
        warehouseId: dto.warehouseId,
        createdBy: this.userId,
        lines: {
          create: dto.lines.map((line) => ({
            organizationId: this.organizationId,
            purchaseOrderLineId: line.purchaseOrderLineId,
            quantity: line.quantity,
          })),
        },
      },
      include: { lines: true },
    });
  }
}
