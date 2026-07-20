import { IsString, IsNotEmpty } from "class-validator";

export class UpdateMemberRoleDto {
  @IsString()
  @IsNotEmpty()
  roleKey!: string; // "owner" | "admin" | "manager" | "member" | "viewer"
}
