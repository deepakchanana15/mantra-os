import { Body, Controller, Headers, HttpCode, Post, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SkipTenantContext } from "../../../common/decorators/skip-tenant-context.decorator";
import { PrismaService } from "../../../prisma/prisma.service";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const STAT_KEY_BY_EVENT: Record<string, "delivered" | "opened" | "clicked" | "bounced"> = {
  delivered: "delivered",
  uniqueOpened: "opened",
  click: "clicked",
  hardBounce: "bounced",
  softBounce: "bounced",
  blocked: "bounced",
  invalid: "bounced",
};

interface BrevoWebhookEvent {
  event: string;
  tags?: string[];
}

/**
 * Receives Brevo's transactional email events (delivered/opened/clicked/
 * bounced) and folds them into the originating Campaign's `stats`. Public —
 * Brevo isn't a logged-in MantraOS user, so this route carries no JWT/org
 * header and is excluded from the global tenant-context transaction
 * (@SkipTenantContext) — see DECISIONS.md "Switched email provider to
 * Brevo" for why that's safe here specifically.
 *
 * Authenticity is a shared secret in a custom header (configured on the
 * Brevo side when the webhook is registered — see
 * scripts/register-brevo-webhook.js), not a full HMAC signature — Brevo's
 * webhook config only offers a static header/token, not per-request signing.
 *
 * Which org's RLS context to run under comes from the event's own `tags`
 * (`campaign:<id>`, `org:<id>`) — set by CampaignsService.send() on the way
 * out, and simply echoed back by Brevo. This is trustworthy specifically
 * because it's our own data being reflected back to us over an
 * authenticated channel, not user-supplied input; still defensively
 * UUID-validated before being interpolated into `SET LOCAL`, matching
 * TenantMembershipGuard's convention.
 */
@Controller("v1/webhooks/brevo")
@SkipTenantContext()
export class BrevoWebhookController {
  private readonly webhookSecret: string;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.webhookSecret = config.getOrThrow<string>("BREVO_WEBHOOK_SECRET");
  }

  @Post()
  @HttpCode(200)
  async handle(@Headers("x-webhook-secret") secret: string | undefined, @Body() body: BrevoWebhookEvent) {
    if (secret !== this.webhookSecret) {
      throw new UnauthorizedException();
    }

    const statKey = STAT_KEY_BY_EVENT[body.event];
    const campaignTag = body.tags?.find((t) => t.startsWith("campaign:"));
    const orgTag = body.tags?.find((t) => t.startsWith("org:"));
    if (!statKey || !campaignTag || !orgTag) {
      return { ok: true };
    }

    const campaignId = campaignTag.slice("campaign:".length);
    const organizationId = orgTag.slice("org:".length);
    if (!UUID_RE.test(campaignId) || !UUID_RE.test(organizationId)) {
      return { ok: true };
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL app.current_org_id = '${organizationId}'`);
      await tx.$executeRaw`
        UPDATE campaigns
        SET stats = jsonb_set(
          COALESCE(stats, '{}'::jsonb),
          ARRAY[${statKey}],
          (COALESCE((stats->>${statKey})::int, 0) + 1)::text::jsonb
        )
        WHERE id = ${campaignId} AND "organizationId" = ${organizationId}
      `;
    });

    return { ok: true };
  }
}
