import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

/**
 * Thin wrapper, not the `@getbrevo/brevo` npm package — deliberately just
 * `fetch` against Brevo's HTTP API, same reasoning as the Resend wrapper it
 * replaces (see DECISIONS.md "Switched email provider to Brevo"). Revisit
 * if V2 needs more of the SDK (templates, batching).
 */
@Injectable()
export class BrevoService {
  private readonly logger = new Logger(BrevoService.name);
  private readonly apiKey: string;
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor(config: ConfigService) {
    this.apiKey = config.getOrThrow<string>("BREVO_API_KEY");
    this.fromEmail = config.get<string>("BREVO_FROM_EMAIL") ?? "notifications@mantraos.app";
    this.fromName = config.get<string>("BREVO_FROM_NAME") ?? "MantraOS";
  }

  /**
   * Returns a result rather than throwing — a failed notification email
   * (password reset, deletion alert) should never fail the request that
   * triggered it. Callers that DO care whether the send succeeded (Campaign
   * sends) can inspect `success` instead; everyone else can ignore it, same
   * as the old fire-and-forget behavior.
   */
  async sendEmail(params: {
    to: string;
    subject: string;
    html: string;
    tags?: string[];
  }): Promise<{ success: boolean; messageId?: string }> {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": this.apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: { email: this.fromEmail, name: this.fromName },
        to: [{ email: params.to }],
        subject: params.subject,
        htmlContent: params.html,
        tags: params.tags,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(`Brevo send failed (${response.status}): ${body}`);
      return { success: false };
    }

    const body = (await response.json()) as { messageId?: string };
    return { success: true, messageId: body.messageId };
  }
}
