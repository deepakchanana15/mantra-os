import dns from "node:dns";
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { PrismaClient } from "@mantra-os/db";

// The `ws` package opens its WebSocket connection through Node's own
// `net`/`tls` modules (unlike Prisma's Rust query engine, which has its own
// networking stack and never goes through Node's `dns` module at all —
// see DECISIONS.md "Phase 7 deploy debugging"). Neon's pooler hostname
// resolves to both IPv6 and IPv4, and Vercel's serverless runtime doesn't
// reliably support outbound IPv6, so this DOES matter at this layer even
// though the identical call had no effect before this adapter was added.
dns.setDefaultResultOrder("ipv4first");

// Node's `ws` package as the WebSocket implementation — Neon's serverless
// driver needs one explicitly outside of edge/browser runtimes that have a
// native WebSocket global.
neonConfig.webSocketConstructor = ws;

/**
 * Thin wrapper around the generated Prisma client. Instantiated once per
 * warm serverless instance (Nest's module scope is cached across
 * invocations — see ARCHITECTURE.md "Deployment: two Vercel projects").
 *
 * Connects via Neon's serverless driver adapter (WebSocket-based) rather
 * than a raw Postgres TCP connection. Vercel's Node.js serverless runtime
 * doesn't reliably support outbound IPv6, and Neon's pooler hostname
 * resolves to both IPv6 and IPv4 — a plain TCP connection would silently
 * hang instead of failing over, until Vercel's own function timeout killed
 * it. See DECISIONS.md "Phase 7 deploy debugging" for the full story.
 *
 * The connection string this uses MUST point at the `mantraos_app` role,
 * never the schema-owning `mantraos_migrator` role — otherwise every RLS
 * policy in packages/db/prisma/rls-policies.sql is silently bypassed.
 * See DECISIONS.md "RLS requires two Postgres roles".
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
