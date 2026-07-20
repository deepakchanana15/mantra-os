import { IsUUID } from "class-validator";

export class CreateDeletionGrantDto {
  @IsUUID()
  userId!: string;
}
