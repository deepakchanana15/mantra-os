import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";
import * as jwt from "jsonwebtoken";
import { PrismaService } from "../../prisma/prisma.service";

/**
 * Verifies the self-issued JWT from AuthService.login() and resolves it to
 * an internal User row. Replaces the old Firebase-based guard — see DECISIONS.md
 * "Self-hosted authentication replaces Firebase". Authentication only,
 * same as before: this establishes WHO is calling, not which organization
 * (that's TenantMembershipGuard, which runs after this).
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing bearer token");
    }
    const token = authHeader.slice("Bearer ".length);

    let payload: { sub: string };
    try {
      const secret = this.config.getOrThrow<string>("AUTH_JWT_SECRET");
      payload = jwt.verify(token, secret) as { sub: string };
    } catch {
      throw new UnauthorizedException("Invalid or expired token");
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.deletedAt) {
      throw new UnauthorizedException("No active MantraOS account for this identity");
    }

    req.user = user;
    return true;
  }
}
