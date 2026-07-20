import { Injectable, NotFoundException } from "@nestjs/common";
import { PurchaseOrderStatus } from "@mantra-os/db";
import { BaseRepository } from "../../../common/repositories/base.repository";
import { CreatePurchaseOrderDto } from "./dto/create-purchase-order.dto";

@Injectable()
export class PurchaseOrdersRepository extends BaseRepository {
  findAll(params: { skip?: number; take?: number; supplierId?: string }) {
    return this.db.purchaseOrder.findMany({
      where: {
        organizationId: this.organizationId,
        deletedAt: null,
        ...(params.supplierId ? { supplierId: params.supplierId } : {}),
      },
      include: { supplier: true, lines: { include: { product: true } } },
      skip: params.skip ?? 0,
      take: params.take ?? 50,
      orderBy: { createdAt: "desc" },
    });
  }

  async findOneOrThrow(id: string) {
    const order = await this.db.purchaseOrder.findFirst({
      where: { id, organizationId: this.organizationId, deletedAt: null },
      include: { supplier: true, lines: { include: { product: true } }, goodsReceipts: true },
    });
    if (!order) {
      throw new NotFoundException("Purchase order not found");
    }
    return order;
  }

  create(dto: CreatePurchaseOrderDto) {
    return this.db.purchaseOrder.create({
      data: {
        organizationId: this.organizationId,
        supplierId: dto.supplierId,
        createdBy: this.userId,
        updatedBy: this.userId,
        lines: {
          create: dto.lines.map((line) => ({
            organizationId: this.organizationId,
            productId: line.productId,
            quantity: line.quantity,
            unitCost: line.unitCost,
          })),
        },
      },
      include: { lines: true },
    });
  }

  async updateStatus(id: string, status: PurchaseOrderStatus) {
    await this.findOneOrThrow(id);
    return this.db.purchaseOrder.update({ where: { id }, data: { status, updatedBy: this.userId } });
  }

  softDelete(id: string) {
    return this.db.purchaseOrder.update({ where: { id }, data: { deletedAt: new Date(), updatedBy: this.userId } });
  }
}
