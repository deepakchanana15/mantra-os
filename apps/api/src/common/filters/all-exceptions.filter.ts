import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { Response } from "express";

/**
 * One error shape for the whole API — see ARCHITECTURE.md "API conventions".
 * { error: { code, message, details } } instead of Nest's default varying
 * shapes between HttpException subclasses and uncaught errors.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const message = typeof body === "string" ? body : (body as { message?: unknown }).message;

      res.status(status).json({
        error: {
          code: HttpStatus[status] ?? "ERROR",
          message: Array.isArray(message) ? message.join("; ") : (message ?? exception.message),
          details: typeof body === "object" ? body : undefined,
        },
      });
      return;
    }

    this.logger.error(exception instanceof Error ? exception.stack : exception);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Something went wrong. Please try again.",
      },
    });
  }
}
