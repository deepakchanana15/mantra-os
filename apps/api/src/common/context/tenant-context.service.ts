import { Injectable } from "@nestjs/common";
import { AsyncLocalStorage } from "node:async_hooks";
import { Prisma } from "@mantra-os/db";

export interface TenantStore {
  tx: Prisma.TransactionClient;
  organizationId: string;
  userId: string;
}

/**
 * Carries the per-request transaction client + tenant identity through the
 * call stack without threading them through every function signature.
 * Populated once, at the top, by TenantContextInterceptor — everything
 * downstream (repositories, services) reads from here.
 *
 * This exists because RLS enforcement requires every query in a request to
 * run inside the SAME Postgres transaction that issued `SET LOCAL
 * app.current_org_id` (see ARCHITECTURE.md "Tenant context & RLS
 * enforcement"). AsyncLocalStorage is what makes that transaction client
 * reachable from deep inside a repository without passing it explicitly.
 */
@Injectable()
export class TenantContextService {
  private readonly als = new AsyncLocalStorage<TenantStore>();

  run<T>(store: TenantStore, fn: () => Promise<T>): Promise<T> {
    return this.als.run(store, fn);
  }

  get store(): TenantStore {
    const store = this.als.getStore();
    if (!store) {
      throw new Error(
        "TenantContextService.store accessed outside of a request scoped by TenantContextInterceptor. " +
          "Internal/cron routes must not use tenant-scoped repositories.",
      );
    }
    return store;
  }

  get db(): Prisma.TransactionClient {
    return this.store.tx;
  }

  get organizationId(): string {
    return this.store.organizationId;
  }

  get userId(): string {
    return this.store.userId;
  }
}
