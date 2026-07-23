import { Injectable, NotFoundException } from "@nestjs/common";
import { BaseRepository } from "../../../common/repositories/base.repository";
import { CreateExpenseDto } from "./dto/create-expense.dto";
import { UpdateExpenseDto } from "./dto/update-expense.dto";

@Injectable()
export class ExpensesRepository extends BaseRepository {
  findAll(params: { skip?: number; take?: number; goodsReceiptId?: string }) {
    return this.db.expense.findMany({
      where: {
        organizationId: this.organizationId,
        deletedAt: null,
        ...(params.goodsReceiptId ? { goodsReceiptId: params.goodsReceiptId } : {}),
      },
      include: { supplier: true, goodsReceipt: true, purchaseOrder: true },
      skip: params.skip ?? 0,
      take: params.take ?? 50,
      orderBy: { expenseDate: "desc" },
    });
  }

  async findOneOrThrow(id: string) {
    const expense = await this.db.expense.findFirst({
      where: { id, organizationId: this.organizationId, deletedAt: null },
      include: { supplier: true, goodsReceipt: true, purchaseOrder: true },
    });
    if (!expense) {
      throw new NotFoundException("Expense not found");
    }
    return expense;
  }

  create(dto: CreateExpenseDto) {
    return this.db.expense.create({
      data: {
        vendorName: dto.vendorName,
        category: dto.category,
        amount: dto.amount,
        expenseDate: dto.expenseDate ? new Date(dto.expenseDate) : undefined,
        notes: dto.notes,
        supplierId: dto.supplierId,
        goodsReceiptId: dto.goodsReceiptId,
        purchaseOrderId: dto.purchaseOrderId,
        companyId: dto.companyId,
        countryId: dto.countryId,
        organizationId: this.organizationId,
        createdBy: this.userId,
        updatedBy: this.userId,
      },
    });
  }

  async update(id: string, dto: UpdateExpenseDto) {
    await this.findOneOrThrow(id);
    return this.db.expense.update({
      where: { id },
      data: {
        vendorName: dto.vendorName,
        category: dto.category,
        amount: dto.amount,
        expenseDate: dto.expenseDate ? new Date(dto.expenseDate) : undefined,
        notes: dto.notes,
        supplierId: dto.supplierId,
        companyId: dto.companyId,
        countryId: dto.countryId,
        updatedBy: this.userId,
      },
    });
  }

  softDelete(id: string) {
    return this.db.expense.update({ where: { id }, data: { deletedAt: new Date(), updatedBy: this.userId } });
  }
}
