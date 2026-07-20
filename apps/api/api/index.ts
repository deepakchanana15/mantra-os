import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ExpressAdapter } from "@nestjs/platform-express";
import type { Request, Response } from "express";
import express from "express";
import serverlessHttp from "serverless-http";
import { AppModule } from "../src/app.module";

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
      res.status(500).json({ message: "Server failed to start", error: bootstrapFailure.message });
      return;
    }
  }
  await cachedHandler(req, res);
}
