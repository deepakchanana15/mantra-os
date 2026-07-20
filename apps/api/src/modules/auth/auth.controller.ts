import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { User } from "@mantra-os/db";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { SkipTenantContext } from "../../common/decorators/skip-tenant-context.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { AuthService } from "./auth.service";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { LoginDto } from "./dto/login.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";

/**
 * Class-level @SkipTenantContext() — every route here is either reachable
 * before a session exists, or ("me") deliberately org-independent. None of
 * them touch org-scoped data, so none of them need the RLS transaction
 * TenantContextInterceptor opens (registered globally as APP_INTERCEPTOR —
 * see app.module.ts). Missing this on a controller crashes on
 * `req.user!.id` for routes with no JwtAuthGuard — caught by
 * packages/db/scripts/verify-frontend-e2e.js, see DECISIONS.md.
 */
@Controller("v1/auth")
@SkipTenantContext()
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** No guard — this is one of the routes reachable before a session exists. */
  @Post("login")
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.auth.forgotPassword(dto);
    return { message: "If an account exists for that email, a reset link has been sent." };
  }

  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.auth.resetPassword(dto);
    return { message: "Password updated. You can now log in." };
  }

  /** "Who am I" — only JwtAuthGuard, not the full tenant pipeline (used by the frontend topbar/avatar regardless of which org is selected). */
  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: User) {
    return { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl };
  }
}
