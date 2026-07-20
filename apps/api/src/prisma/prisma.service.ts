import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@mantra-os/db";

/**
 * Thin wrapper around the generated Prisma client. Instantiated once per
 * warm serverless instance (Nest's module scope is cached across
 * invocations — see ARCHITECTURE.md "Deployment: two Vercel projects").
 *
 * The connection string this uses MUST point at the `mantraos_app` role,
 * never the schema-owning `mantraos_migrator` role — otherwise every RLS
 * policy in packages/db/prisma/rls-policies.sql is silently bypassed.
 * See DECISIONS.md "RLS requires two Postgres roles".
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
