import dns from "node:dns";
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ExpressAdapter } from "@nestjs/platform-express";
import type { Request, Response } from "express";
import express from "express";
import serverlessHttp from "serverless-http";
import { AppModule } from "../src/app.module";

/**
 * Neon's pooler hostname resolves to both AAAA (IPv6) and A (IPv4) records.
 * Vercel's Node.js serverless runtime doesn't reliably support outbound
 * IPv6 — connecting over it doesn't fail cleanly, it hangs until Vercel's
 * own function timeout kills the invocation (FUNCTION_INVOCATION_TIMEOUT),
 * which looks identical to a slow cold start. Forcing IPv4 first avoids
 * this; the same connection string works instantly from a normal
 * (non-serverless) network. See DECISIONS.md "Phase 7 deploy debugging".
 */
dns.setDefaultResultOrder("ipv4first");

/**
 * Vercel serverless entry point — see ARCHITECTURE.md "Deployment: two
 * Vercel projects, one domain". The Nest app is bootstrapped once and
 * cached at module scope, so only the first invocation on a cold instance
 * pays for the full application bootstrap; every request on a warm
 * instance reuses it. All routes go through this single function — Nest's
 * own router handles dispatch to individual controllers, not Vercel.
 */
let cachedHandler: ReturnType<typeof serverlessHttp> | undefined;
let bootstrapFailure: Error | undefined;

async function bootstrap(): Promise<ReturnType<typeof serverlessHttp>> {
  const expressApp = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));
  app.enableCors();
  await app.init();
  return serverlessHttp(expressApp);
}

export default async function handler(req: Request, res: Response): Promise<void> {
  // A bootstrap failure (e.g. a required env var missing) must reject fast
  // with a clear error on every request, not silently hang until Vercel's
  // own function timeout kills it — that turned a config typo into what
  // looked like a stuck cold start. Cache the failure itself, the same way
  // a successful handler is cached, so a bad instance doesn't retry
  // bootstrap (and its slow DB connection attempt) on every request.
  if (bootstrapFailure) {
    res.status(500).json({ message: "Server failed to start", error: bootstrapFailure.message });
    return;
  }
  if (!cachedHandler) {
    try {
      cachedHandler = await bootstrap();
    } catch (err) {
      bootstrapFailure = err instanceof Error ? err : new Error(String(err));
      console.error("Bootstrap failed:", bootstrapFailure);
      res.status(500).json({ message: "Server failed to start", error: bootstrapFailure.message });
      return;
    }
  }
  await cachedHandler(req, res);
}
