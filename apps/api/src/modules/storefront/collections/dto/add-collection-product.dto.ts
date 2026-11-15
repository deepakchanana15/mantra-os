import { IsInt, IsOptional, IsUUID } from "class-validator";

export class AddCollectionProductDto {
  @IsUUID()
  productId!: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
