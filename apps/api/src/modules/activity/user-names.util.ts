import { Prisma } from "@mantra-os/db";

/** Note.createdBy/AuditLog.performedById are plain user ids — this batches the name lookup for display. */
export async function resolveUserNames(db: Prisma.TransactionClient, userIds: string[]): Promise<Map<string, string>> {
  const distinctIds = [...new Set(userIds)];
  if (distinctIds.length === 0) return new Map();
  const users = await db.user.findMany({ where: { id: { in: distinctIds } }, select: { id: true, name: true } });
  return new Map(users.map((u) => [u.id, u.name]));
}
