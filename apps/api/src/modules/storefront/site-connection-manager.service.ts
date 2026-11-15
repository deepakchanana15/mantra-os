import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient as StorefrontPrismaClient } from "@mantra-os/storefront-db";
import { StorefrontSitesRepository } from "./sites/storefront-sites.repository";

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

interface CachedConnection {
  databaseUrl: string;
  client: StorefrontPrismaClient;
}

/**
 * Resolves a registered site's own database/Cloudinary connection — the one
 * piece of machinery nothing in this codebase had before: every other
 * repository's `this.db` is MantraOS's own RLS-scoped transaction client
 * (see BaseRepository), which is useless here since each site lives in a
 * completely separate database this app doesn't own.
 *
 * Prisma clients are cached per site (keyed by siteId, invalidated if the
 * stored connection string ever changes) to avoid reconnecting on every call
 * within a warm serverless instance. Cloudinary is NOT cached as a "client"
 * the way the plan originally described — the `cloudinary` SDK's `.config()`
 * is global, mutable state, so configuring it per-site would race under
 * concurrent requests for different sites. Instead this returns the site's
 * three credentials, which callers pass explicitly in each Cloudinary call's
 * own options object (every Cloudinary SDK method accepts cloud_name/api_key/
 * api_secret as call-level overrides) rather than relying on global config.
 */
@Injectable()
export class SiteConnectionManager implements OnModuleDestroy {
  private readonly connections = new Map<string, CachedConnection>();

  constructor(private readonly sites: StorefrontSitesRepository) {}

  async getPrismaClient(siteId: string): Promise<StorefrontPrismaClient> {
    const site = await this.sites.findConnectionConfigOrThrow(siteId);
    const cached = this.connections.get(siteId);
    if (cached && cached.databaseUrl === site.databaseUrl) {
      return cached.client;
    }
    if (cached) {
      await cached.client.$disconnect();
    }
    // Connects via Neon's serverless driver adapter, same reason as
    // PrismaService for MantraOS's own database (see its doc comment): a raw
    // TCP connection can silently hang on Vercel's serverless runtime against
    // a Neon pooler hostname, which resolves to both IPv4 and IPv6. The
    // global `ws`/`dns` setup that adapter needs is already applied once by
    // PrismaService at app boot, in the same process.
    const adapter = new PrismaNeon({ connectionString: site.databaseUrl });
    const client = new StorefrontPrismaClient({ adapter });
    this.connections.set(siteId, { databaseUrl: site.databaseUrl, client });
    return client;
  }

  async getCloudinaryConfig(siteId: string): Promise<CloudinaryConfig> {
    const site = await this.sites.findConnectionConfigOrThrow(siteId);
    if (!site.cloudinaryCloudName || !site.cloudinaryApiKey || !site.cloudinaryApiSecret) {
      throw new Error("This site has no Cloudinary credentials configured");
    }
    return {
      cloudName: site.cloudinaryCloudName,
      apiKey: site.cloudinaryApiKey,
      apiSecret: site.cloudinaryApiSecret,
    };
  }

  async onModuleDestroy() {
    await Promise.all([...this.connections.values()].map((c) => c.client.$disconnect()));
    this.connections.clear();
  }
}
