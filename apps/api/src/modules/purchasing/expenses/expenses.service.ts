import { Injectable } from "@nestjs/common";
import { DeletionGuardService } from "../../../common/deletion/deletion-guard.service";
import { CreateExpenseDto } from "./dto/create-expense.dto";
import { UpdateExpenseDto } from "./dto/update-expense.dto";
import { ExpensesRepository } from "./expenses.repository";

@Injectable()
export class ExpensesService {
  constructor(
    private readonly expenses: ExpensesRepository,
    private readonly deletionGuard: DeletionGuardService,
  ) {}

  findAll(params: { skip?: number; take?: number; goodsReceiptId?: string }) {
    return this.expenses.findAll(params);
  }

  findOne(id: string) {
    return this.expenses.findOneOrThrow(id);
  }

  create(dto: CreateExpenseDto) {
    return this.expenses.create(dto);
  }

  update(id: string, dto: UpdateExpenseDto) {
    return this.expenses.update(id, dto);
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
