import { EventEmitter2 } from "@nestjs/event-emitter";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TenantContextService } from "../context/tenant-context.service";
import { DeletionGuardService } from "./deletion-guard.service";

const ORG_ID = "org-1";
const OWNER_ID = "user-owner";
const GRANTED_USER_ID = "user-granted";
const UNGRANTED_USER_ID = "user-ungranted";

/**
 * Mocks TenantContextService's public surface directly rather than going
 * through its real AsyncLocalStorage machinery — that propagation is
 * already exercised for real by packages/db/scripts/verify-frontend-e2e.js.
 * This test isolates DeletionGuardService's own authorization rules, which
 * is the actual point of risk (see DECISIONS.md "Deletion governance").
 */
function createMockDb() {
  return {
    membership: { findUnique: vi.fn() },
    userDeletionGrant: { findUnique: vi.fn() },
    auditLog: { count: vi.fn(), create: vi.fn() },
  };
}

function createTenantContext(db: ReturnType<typeof createMockDb>, userId: string) {
  const store = { tx: db, userId, organizationId: ORG_ID };
  return {
    store,
    get db() {
      return db;
    },
    get userId() {
      return userId;
    },
    get organizationId() {
      return ORG_ID;
    },
  } as unknown as TenantContextService;
}

describe("DeletionGuardService.authorize", () => {
  let db: ReturnType<typeof createMockDb>;
  let eventEmitter: EventEmitter2;

  beforeEach(() => {
    db = createMockDb();
    eventEmitter = { emitAsync: vi.fn() } as unknown as EventEmitter2;
  });

  function membershipRole(key: string) {
    return { role: { key } };
  }

  it("allows the Owner to delete a record they created themselves — the escalation floor", async () => {
    db.membership.findUnique.mockResolvedValue(membershipRole("owner"));
    db.auditLog.count.mockResolvedValue(0);
    const guard = new DeletionGuardService(createTenantContext(db, OWNER_ID), eventEmitter);

    await expect(guard.authorize({ entityCreatedBy: OWNER_ID })).resolves.toBeUndefined();
  });

  it("allows the Owner to delete anyone else's record without needing a grant", async () => {
    db.membership.findUnique.mockResolvedValue(membershipRole("owner"));
    db.auditLog.count.mockResolvedValue(0);
    const guard = new DeletionGuardService(createTenantContext(db, OWNER_ID), eventEmitter);

    await expect(guard.authorize({ entityCreatedBy: "someone-else" })).resolves.toBeUndefined();
  });

  it("rejects a non-owner with no deletion grant at all", async () => {
    db.membership.findUnique.mockResolvedValue(membershipRole("manager"));
    db.userDeletionGrant.findUnique.mockResolvedValue(null);
    const guard = new DeletionGuardService(createTenantContext(db, UNGRANTED_USER_ID), eventEmitter);

    await expect(guard.authorize({ entityCreatedBy: "someone-else" })).rejects.toThrow(/don't have permission/i);
  });

  it("rejects a non-owner whose grant has been revoked", async () => {
    db.membership.findUnique.mockResolvedValue(membershipRole("manager"));
    db.userDeletionGrant.findUnique.mockResolvedValue({ revokedAt: new Date() });
    const guard = new DeletionGuardService(createTenantContext(db, GRANTED_USER_ID), eventEmitter);

    await expect(guard.authorize({ entityCreatedBy: "someone-else" })).rejects.toThrow(/don't have permission/i);
  });

  it("allows a non-owner with an active grant to delete someone else's record", async () => {
    db.membership.findUnique.mockResolvedValue(membershipRole("manager"));
    db.userDeletionGrant.findUnique.mockResolvedValue({ revokedAt: null });
    db.auditLog.count.mockResolvedValue(0);
    const guard = new DeletionGuardService(createTenantContext(db, GRANTED_USER_ID), eventEmitter);

    await expect(guard.authorize({ entityCreatedBy: "someone-else" })).resolves.toBeUndefined();
  });

  it("blocks a non-owner with an active grant from deleting a record they created themselves", async () => {
    db.membership.findUnique.mockResolvedValue(membershipRole("manager"));
    db.userDeletionGrant.findUnique.mockResolvedValue({ revokedAt: null });
    const guard = new DeletionGuardService(createTenantContext(db, GRANTED_USER_ID), eventEmitter);

    await expect(guard.authorize({ entityCreatedBy: GRANTED_USER_ID })).rejects.toThrow(/can't delete a record you created/i);
  });

  it("blocks anyone, including a grant holder, once today's 1/day limit is already used", async () => {
    db.membership.findUnique.mockResolvedValue(membershipRole("manager"));
    db.userDeletionGrant.findUnique.mockResolvedValue({ revokedAt: null });
    db.auditLog.count.mockResolvedValue(1);
    const guard = new DeletionGuardService(createTenantContext(db, GRANTED_USER_ID), eventEmitter);

    await expect(guard.authorize({ entityCreatedBy: "someone-else" })).rejects.toThrow(/deletion limit for today/i);
  });

  it("blocks the Owner too once today's 1/day limit is used — the rate limit applies even at the escalation floor", async () => {
    db.membership.findUnique.mockResolvedValue(membershipRole("owner"));
    db.auditLog.count.mockResolvedValue(1);
    const guard = new DeletionGuardService(createTenantContext(db, OWNER_ID), eventEmitter);

    await expect(guard.authorize({ entityCreatedBy: "someone-else" })).rejects.toThrow(/deletion limit for today/i);
  });
});

describe("DeletionGuardService.recordAndNotify", () => {
  it("writes an audit log row and awaits emitAsync (not emit) so the listener runs inside the same transaction", async () => {
    const db = createMockDb();
    const emitAsync = vi.fn().mockResolvedValue(undefined);
    const eventEmitter = { emitAsync } as unknown as EventEmitter2;
    const guard = new DeletionGuardService(createTenantContext(db, OWNER_ID), eventEmitter);

    await guard.recordAndNotify({ entityType: "Customer", entityId: "cust-1", targetUserId: "creator-1" });

    expect(db.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizationId: ORG_ID,
          action: "delete",
          entityType: "Customer",
          entityId: "cust-1",
          performedById: OWNER_ID,
          targetUserId: "creator-1",
        }),
      }),
    );
    expect(emitAsync).toHaveBeenCalledWith(
      "record.deleted",
      expect.objectContaining({ organizationId: ORG_ID, entityType: "Customer", entityId: "cust-1", performedById: OWNER_ID }),
    );
  });
});

describe("DeletionGuardService.deleteWithGovernance", () => {
  it("only calls softDelete after authorize() passes, and calls recordAndNotify after", async () => {
    const db = createMockDb();
    db.membership.findUnique.mockResolvedValue({ role: { key: "owner" } });
    db.auditLog.count.mockResolvedValue(0);
    const emitAsync = vi.fn().mockResolvedValue(undefined);
    const guard = new DeletionGuardService(createTenantContext(db, OWNER_ID), { emitAsync } as unknown as EventEmitter2);

    const softDelete = vi.fn().mockResolvedValue({ id: "cust-1", deleted: true });
    const result = await guard.deleteWithGovernance({
      entityType: "Customer",
      entityId: "cust-1",
      entityCreatedBy: "someone-else",
      softDelete,
    });

    expect(softDelete).toHaveBeenCalledOnce();
    expect(db.auditLog.create).toHaveBeenCalledOnce();
    expect(result).toEqual({ id: "cust-1", deleted: true });
  });

  it("never calls softDelete when authorize() rejects", async () => {
    const db = createMockDb();
    db.membership.findUnique.mockResolvedValue({ role: { key: "manager" } });
    db.userDeletionGrant.findUnique.mockResolvedValue(null);
    const guard = new DeletionGuardService(createTenantContext(db, UNGRANTED_USER_ID), {} as EventEmitter2);

    const softDelete = vi.fn();
    await expect(
      guard.deleteWithGovernance({ entityType: "Customer", entityId: "cust-1", entityCreatedBy: "someone-else", softDelete }),
    ).rejects.toThrow();

    expect(softDelete).not.toHaveBeenCalled();
  });
});
