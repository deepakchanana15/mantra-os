import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

/**
 * Thin wrapper, not the `resend` npm package — deliberately just `fetch`
 * against Resend's HTTP API so this module doesn't grow a dependency for
 * one endpoint. Revisit if V2 needs more of the SDK (templates, batching).
 */
@Injectable()
export class ResendService {
  private readonly logger = new Logger(ResendService.name);
  private readonly apiKey: string;
  private readonly fromAddress: string;

  constructor(config: ConfigService) {
    this.apiKey = config.getOrThrow<string>("RESEND_API_KEY");
    this.fromAddress = config.get<string>("RESEND_FROM_ADDRESS") ?? "MantraOS <notifications@mantraos.app>";
  }

  async sendEmail(params: { to: string; subject: string; html: string }): Promise<void> {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: this.fromAddress,
        to: params.to,
        subject: params.subject,
        html: params.html,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(`Resend send failed (${response.status}): ${body}`);
      // Deliberately not thrown: a failed notification email should not
      // fail the request that triggered it (e.g. a deletion). Logged for
      // now; a retry/outbox mechanism is a V2 concern if this proves
      // unreliable in practice, not built speculatively today.
    }
  }
}
