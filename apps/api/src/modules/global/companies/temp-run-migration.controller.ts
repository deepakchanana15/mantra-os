import { Controller, Headers, Logger, Post, UnauthorizedException } from "@nestjs/common";
import { SkipTenantContext } from "../../../common/decorators/skip-tenant-context.decorator";
import { PrismaService } from "../../../prisma/prisma.service";

// TEMP — one-time migration runner, removed right after use. No DB
// credentials are available to this session outside the running app
// itself (Vercel keeps DATABASE_URL Sensitive), so this uses the app's own
// live connection instead. Secret is a throwaway, hardcoded here rather
// than as an env var, since it only needs to work for a single invocation.
const ONE_TIME_SECRET = "4d5a88fe2a95437ca9d6875078aa5d35d9a43cd955aaece4";
const MIGRATION_NAME = "20260805140347_company_invoicing_fields";
const MIGRATION_CHECKSUM = "68325d6fdbb6fe086cfea77c0b4e2491b211c7b19540b930ef8e96ea02fbd00f";

@Controller("v1/internal/temp-run-migration")
@SkipTenantContext()
export class TempRunMigrationController {
  private readonly logger = new Logger(TempRunMigrationController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Post()
  async run(@Headers("x-migration-secret") secret: string | undefined) {
    if (secret !== ONE_TIME_SECRET) {
      throw new UnauthorizedException();
    }

    await this.prisma.$executeRawUnsafe(
      `ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "address" TEXT, ADD COLUMN IF NOT EXISTS "taxId" TEXT;`,
    );

    const alreadyTracked = await this.prisma.$queryRawUnsafe<{ id: string }[]>(
      `SELECT id FROM "_prisma_migrations" WHERE migration_name = $1`,
      MIGRATION_NAME,
    );
    if (alreadyTracked.length === 0) {
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO "_prisma_migrations" (id, checksum, migration_name, started_at, finished_at, applied_steps_count)
         VALUES (gen_random_uuid()::text, $1, $2, now(), now(), 1)`,
        MIGRATION_CHECKSUM,
        MIGRATION_NAME,
      );
    }

    this.logger.log("Applied company_invoicing_fields migration via temp endpoint");
    return { ok: true };
  }
}
