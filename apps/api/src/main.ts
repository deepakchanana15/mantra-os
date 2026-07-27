import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

/** Local development entry point. Production uses api/index.ts (Vercel serverless). */
async function bootstrap() {
  // rawBody: true — needed by the WhatsApp webhook to verify Meta's
  // X-Hub-Signature-256 HMAC, which must be computed over the exact raw
  // request bytes, not the JSON-parsed body. See DECISIONS.md "WhatsApp
  // lead capture".
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.enableCors();
  await app.listen(process.env.PORT ?? 3001);
}

bootstrap();
