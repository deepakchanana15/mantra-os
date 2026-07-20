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

async function bootstrap(): Promise<ReturnType<typeof serverlessHttp>> {
  const expressApp = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));
  app.enableCors();
  await app.init();
  return serverlessHttp(expressApp);
}

export default async function handler(req: Request, res: Response): Promise<void> {
  if (!cachedHandler) {
    cachedHandler = await bootstrap();
  }
  await cachedHandler(req, res);
}
