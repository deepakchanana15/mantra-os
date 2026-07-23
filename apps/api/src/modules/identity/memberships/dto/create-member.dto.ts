import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";

/**
 * Owner/Admin directly creates a teammate's login — no email-verification
 * flow (Resend is still a placeholder key, see TODO.md). The Owner/Admin
 * tells the person their temporary password out of band. See DECISIONS.md
 * "Member creation (no self-service invite)".
 */
export class CreateMemberDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @IsNotEmpty()
  roleKey!: string; // "owner" | "admin" | "manager" | "member" | "viewer"
}
