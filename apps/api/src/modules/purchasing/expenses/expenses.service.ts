import { Injectable } from "@nestjs/common";
import { AttachmentEntityType } from "@mantra-os/db";
import { AttachmentsRepository } from "../../../common/attachments/attachments.repository";
import { DeletionGuardService } from "../../../common/deletion/deletion-guard.service";
import { CreateExpenseDto } from "./dto/create-expense.dto";
import { UpdateExpenseDto } from "./dto/update-expense.dto";
import { ExpensesRepository } from "./expenses.repository";

@Injectable()
export class ExpensesService {
  constructor(
    private readonly expenses: ExpensesRepository,
    private readonly deletionGuard: DeletionGuardService,
    private readonly attachments: AttachmentsRepository,
  ) {}

  async findAll(params: { skip?: number; take?: number; goodsReceiptId?: string }) {
    const expenses = await this.expenses.findAll(params);
    const byExpenseId = await this.attachments.findByEntities(
      AttachmentEntityType.EXPENSE,
      expenses.map((expense) => expense.id),
    );
    return expenses.map((expense) => ({ ...expense, attachments: byExpenseId.get(expense.id) ?? [] }));
  }

  async findOne(id: string) {
    const expense = await this.expenses.findOneOrThrow(id);
    const attachments = await this.attachments.findByEntity(AttachmentEntityType.EXPENSE, id);
    return { ...expense, attachments };
  }

  async create(dto: CreateExpenseDto) {
    const expense = await this.expenses.create(dto);
    await this.attachments.createMany(AttachmentEntityType.EXPENSE, expense.id, dto.attachments ?? []);
    return expense;
  }

  async update(id: string, dto: UpdateExpenseDto) {
    const expense = await this.expenses.update(id, dto);
    if (dto.attachments?.length) {
      await this.attachments.createMany(AttachmentEntityType.EXPENSE, id, dto.attachments);
    }
    return expense;
  }

  async remove(id: string) {
    const expense = await this.expenses.findOneOrThrow(id);
    return this.deletionGuard.deleteWithGovernance({
      entityType: "Expense",
      entityId: id,
      entityCreatedBy: expense.createdBy,
      softDelete: () => this.expenses.softDelete(id),
    });
  }
}
