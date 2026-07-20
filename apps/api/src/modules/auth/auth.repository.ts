import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

/**
 * Not tenant-scoped — auth happens before any organization is selected, so
 * this injects PrismaService directly (same pattern JwtAuthGuard uses)
 * rather than extending BaseRepository.
 */
@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findActiveByEmail(email: string) {
    return this.prisma.user.findFirst({ where: { email, deletedAt: null } });
  }

  createResetToken(params: { userId: string; tokenHash: string; expiresAt: Date }) {
    return this.prisma.passwordResetToken.create({ data: params });
  }

  findValidResetToken(tokenHash: string) {
    return this.prisma.passwordResetToken.findFirst({
      where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
    });
  }

  async consumeResetTokenAndSetPassword(tokenId: string, userId: string, passwordHash: string) {
    await this.prisma.$transaction([
      this.prisma.passwordResetToken.update({ where: { id: tokenId }, data: { usedAt: new Date() } }),
      this.prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
    ]);
  }
}
