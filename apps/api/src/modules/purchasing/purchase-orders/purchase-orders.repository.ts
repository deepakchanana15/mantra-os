import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PurchaseOrderStatus } from "@mantra-os/db";
import { BaseRepository } from "../../../common/repositories/base.repository";
import { CreatePurchaseOrderDto } from "./dto/create-purchase-order.dto";
import { UpdatePurchaseOrderDto } from "./dto/update-purchase-order.dto";

@Injectable()
export class PurchaseOrdersRepository extends BaseRepository {
  findAll(params: { skip?: number; take?: number; supplierId?: string }) {
    return this.db.purchaseOrder.findMany({
      where: {
        organizationId: this.organizationId,
        deletedAt: null,
        ...(params.supplierId ? { supplierId: params.supplierId } : {}),
      },
      include: {
        supplier: true,
        lines: { include: { product: true } },
        company: { include: { baseCurrency: true } },
        country: { include: { currency: true } },
        currency: true,
      },
      skip: params.skip ?? 0,
      take: params.take ?? 50,
      orderBy: { createdAt: "desc" },
    });
  }

  async findOneOrThrow(id: string) {
    const order = await this.db.purchaseOrder.findFirst({
      where: { id, organizationId: this.organizationId, deletedAt: null },
      include: {
        supplier: true,
        lines: { include: { product: true } },
        goodsReceipts: true,
        company: { include: { baseCurrency: true } },
        country: { include: { currency: true } },
        currency: true,
      },
    });
    if (!order) {
      throw new NotFoundException("Purchase order not found");
    }
    return order;
  }

  async create(dto: CreatePurchaseOrderDto) {
    if (dto.poNumber) {
      const existing = await this.db.purchaseOrder.findUnique({
        where: { organizationId_poNumber: { organizationId: this.organizationId, poNumber: dto.poNumber } },
      });
      if (existing) {
        throw new ConflictException(`PO number "${dto.poNumber}" already exists`);
      }
    }
    return this.db.purchaseOrder.create({
      data: {
        organizationId: this.organizationId,
        supplierId: dto.supplierId,
        poNumber: dto.poNumber,
        deliveryDueDate: dto.deliveryDueDate ? new Date(dto.deliveryDueDate) : undefined,
        companyId: dto.companyId,
        countryId: dto.countryId,
        currencyId: dto.currencyId,
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

  /** Caller (PurchaseOrdersService) has already confirmed the order is still DRAFT. */
  async update(id: string, dto: UpdatePurchaseOrderDto) {
    if (dto.poNumber) {
      const existing = await this.db.purchaseOrder.findUnique({
        where: { organizationId_poNumber: { organizationId: this.organizationId, poNumber: dto.poNumber } },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(`PO number "${dto.poNumber}" already exists`);
      }
    }
    if (dto.lines) {
      await this.db.purchaseOrderLine.deleteMany({ where: { purchaseOrderId: id } });
    }
    return this.db.purchaseOrder.update({
      where: { id },
      data: {
        supplierId: dto.supplierId,
        poNumber: dto.poNumber,
        deliveryDueDate: dto.deliveryDueDate ? new Date(dto.deliveryDueDate) : undefined,
        companyId: dto.companyId,
        countryId: dto.countryId,
        currencyId: dto.currencyId,
        updatedBy: this.userId,
        ...(dto.lines
          ? {
              lines: {
                create: dto.lines.map((line) => ({
                  organizationId: this.organizationId,
                  productId: line.productId,
                  quantity: line.quantity,
                  unitCost: line.unitCost,
                })),
              },
            }
          : {}),
      },
      include: { lines: true },
    });
  }

  softDelete(id: string) {
    return this.db.purchaseOrder.update({ where: { id }, data: { deletedAt: new Date(), updatedBy: this.userId } });
  }
}
