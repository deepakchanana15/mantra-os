import { IsString, MinLength } from "class-validator";

/** Owner/Admin directly sets a new password for an existing teammate —
 * same "no invite email, share it out of band" reasoning as CreateMemberDto. */
export class ResetMemberPasswordDto {
  @IsString()
  @MinLength(8)
  password!: string;
}
