import { Module } from "@nestjs/common";
import { SupportTicketsController } from "./support-tickets/support-tickets.controller";
import { SupportTicketsRepository } from "./support-tickets/support-tickets.repository";
import { SupportTicketsService } from "./support-tickets/support-tickets.service";

@Module({
  controllers: [SupportTicketsController],
  providers: [SupportTicketsRepository, SupportTicketsService],
})
export class SupportModule {}
