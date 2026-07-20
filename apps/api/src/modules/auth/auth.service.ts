import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcryptjs";
import * as crypto from "node:crypto";
import * as jwt from "jsonwebtoken";
import { ResendService } from "../notifications/resend/resend.service";
import { AuthRepository } from "./auth.repository";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { LoginDto } from "./dto/login.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";

const BCRYPT_ROUNDS = 10;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Owns authentication end-to-end (login, password reset) — the
 * self-hosted replacement for Firebase Auth. See DECISIONS.md
 * "Self-hosted authentication replaces Firebase" for why: cost, and
 * avoiding a session-token format (Auth.js's encrypted JWTs) that's
 * awkward to verify from a separate NestJS service.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly auth: AuthRepository,
    private readonly resend: ResendService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto): Promise<{ accessToken: string }> {
    const user = await this.auth.findActiveByEmail(dto.email);
    // Same error for "no such user" and "wrong password" — don't reveal which, a standard practice against account enumeration.
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const secret = this.config.getOrThrow<string>("AUTH_JWT_SECRET");
    const accessToken = jwt.sign({ sub: user.id }, secret, { expiresIn: "7d" });
    return { accessToken };
  }

  /** Always responds the same way whether or not the email exists — avoids leaking which emails have accounts. */
  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const user = await this.auth.findActiveByEmail(dto.email);
    if (!user) return;

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    await this.auth.createResetToken({
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    });

    const frontendUrl = this.config.get<string>("FRONTEND_URL") ?? "http://localhost:3000";
    const resetLink = `${frontendUrl}/reset-password?token=${rawToken}`;

    await this.resend.sendEmail({
      to: user.email,
      subject: "Reset your MantraOS password",
      html: `<p>Someone requested a password reset for your MantraOS account.</p><p><a href="${resetLink}">Click here to reset your password</a>. This link expires in 1 hour.</p><p>If you didn't request this, you can ignore this email.</p>`,
    });
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const tokenHash = crypto.createHash("sha256").update(dto.token).digest("hex");
    const resetToken = await this.auth.findValidResetToken(tokenHash);
    if (!resetToken) {
      throw new BadRequestException("This reset link is invalid or has expired");
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    await this.auth.consumeResetTokenAndSetPassword(resetToken.id, resetToken.userId, passwordHash);
  }
}
