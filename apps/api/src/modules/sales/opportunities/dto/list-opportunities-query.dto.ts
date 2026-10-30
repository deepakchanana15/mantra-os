import { IsIn, IsOptional } from "class-validator";
import { PaginationQueryDto } from "../../../../common/dto/pagination-query.dto";

const SORTABLE_FIELDS = ["createdAt", "stageChangedAt", "stage", "estimatedValue", "name"] as const;

export class ListOpportunitiesQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(SORTABLE_FIELDS)
  sortBy?: (typeof SORTABLE_FIELDS)[number];

  @IsOptional()
  @IsIn(["asc", "desc"])
  sortDir?: "asc" | "desc";
}
