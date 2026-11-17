import { BadRequestException, Body, Controller, Headers, HttpCode, Post, UnauthorizedException } from "@nestjs/common";
import { OpportunitySource } from "@mantra-os/db";
import { BusinessCodeService } from "../../../common/business-code/business-code.service";
import { SkipTenantContext } from "../../../common/decorators/skip-tenant-context.decorator";
import { TenantContextService } from "../../../common/context/tenant-context.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { BrevoService } from "../../notifications/brevo/brevo.service";
import {
  SUPPORT_EMAIL,
  ctaButton,
  renderEmailShell,
  resolveLanguage,
  type SupportedLanguage,
  whatsappButtons,
} from "../../notifications/brevo/email-template";
import { BrochureRequestDto } from "./dto/brochure-request.dto";

const DOWNLOAD_LABEL: Record<SupportedLanguage, string> = {
  en: "📄 Download Brochure",
  de: "📄 Broschüre herunterladen",
  nl: "📄 Brochure downloaden",
};

function brochureBody(
  language: SupportedLanguage,
  name: string,
  downloadUrls: string[],
): { subject: string; html: string } {
  const buttons = downloadUrls
    .map((url, i) => ctaButton(url, i === 0 ? DOWNLOAD_LABEL[language] : "📄 Download Brochure (English)"))
    .join("");
  const whatsapp = whatsappButtons(`Hi Mantra Sports, I just requested the wholesale brochure!`);

  if (language === "de") {
    return {
      subject: `Hey ${name}, danke für dein Interesse! — Mantra Sports`,
      html: `
        <h1 style="font-size:23px;margin:0 0 16px;">Hey ${name}, danke für dein Interesse! 🙌</h1>
        <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">Deine Regale sind nur noch einen Schritt von richtig gutem Sportgear entfernt. Hier ist die Broschüre, um die du gebeten hast:</p>
        ${buttons}
        <p style="font-size:15px;line-height:1.6;margin:24px 0 8px;">Lieber in echt sprechen? Verständlich — ein PDF schreibt halt nicht zurück. Schlag uns einen kurzen <strong>Zoom</strong>- oder <strong>Teams</strong>-Call vor, ganz wie du magst. Schreib einfach an <a href="mailto:${SUPPORT_EMAIL}" style="color:#f05f22;font-weight:600;">${SUPPORT_EMAIL}</a> mit:</p>
        <ul style="font-size:15px;line-height:1.7;margin:0 0 16px;padding-left:20px;">
          <li>Zoom oder Teams?</li>
          <li>Ein Termin, der dir passt — inklusive Zeitzone</li>
        </ul>
        <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">Kein Call nötig? Kein Problem — ein echter Mensch aus unserem Team meldet sich trotzdem garantiert innerhalb von <strong>24 Stunden</strong>. Wir lassen dich nicht hängen.</p>
        <p style="font-size:15px;line-height:1.6;margin:0 0 8px;">Keine Geduld? Verstehen wir total. Dann schreib uns direkt auf WhatsApp:</p>
        ${whatsapp}
        <p style="font-size:15px;line-height:1.6;margin:28px 0 0;">Wir freuen uns auf die Zusammenarbeit,<br><strong>Dein Mantra Sports Team</strong></p>`,
    };
  }

  if (language === "nl") {
    return {
      subject: `Hey ${name}, bedankt voor je interesse! — Mantra Sports`,
      html: `
        <h1 style="font-size:23px;margin:0 0 16px;">Hey ${name}, bedankt voor je interesse! 🙌</h1>
        <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">Je schappen zijn nog maar één stap verwijderd van heel wat stoerder sportgear. Hier is de brochure waar je om vroeg:</p>
        ${buttons}
        <p style="font-size:15px;line-height:1.6;margin:24px 0 8px;">Liever gewoon even sparren? Snappen we — een PDF praat nu eenmaal niet terug. Plan een korte <strong>Zoom</strong>- of <strong>Teams</strong>-call, net wat jou het beste uitkomt. Mail gewoon naar <a href="mailto:${SUPPORT_EMAIL}" style="color:#f05f22;font-weight:600;">${SUPPORT_EMAIL}</a> met:</p>
        <ul style="font-size:15px;line-height:1.7;margin:0 0 16px;padding-left:20px;">
          <li>Zoom of Teams?</li>
          <li>Een tijdstip dat jou uitkomt — inclusief tijdzone</li>
        </ul>
        <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">Geen zin in een call? Geen probleem — een echt mens van ons team neemt sowieso binnen <strong>24 uur</strong> contact op. We laten je niet links liggen.</p>
        <p style="font-size:15px;line-height:1.6;margin:0 0 8px;">Kan het niet wachten? Helemaal terecht. Stuur ons dan meteen een appje via WhatsApp:</p>
        ${whatsapp}
        <p style="font-size:15px;line-height:1.6;margin:28px 0 0;">We kijken ernaar uit om samen te werken,<br><strong>Het Mantra Sports Team</strong></p>`,
    };
  }

  return {
    subject: `Hey ${name}, thanks for reaching out! — Mantra Sports`,
    html: `
      <h1 style="font-size:23px;margin:0 0 16px;">Hey ${name}, thanks for reaching out! 🙌</h1>
      <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">Your shelves are one step closer to looking a lot cooler. Here's the brochure you asked for:</p>
      ${buttons}
      <p style="font-size:15px;line-height:1.6;margin:24px 0 8px;">Prefer to talk it through? Fair enough — PDFs don't have a pulse. Hop on a quick <strong>Zoom</strong> or <strong>Teams</strong> call, whichever you fancy. Just reply to <a href="mailto:${SUPPORT_EMAIL}" style="color:#f05f22;font-weight:600;">${SUPPORT_EMAIL}</a> and let us know:</p>
      <ul style="font-size:15px;line-height:1.7;margin:0 0 16px;padding-left:20px;">
        <li>Zoom or Teams?</li>
        <li>A day/time that suits you — plus your timezone</li>
      </ul>
      <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">No call? No worries — a real human from our team will still reach out within <strong>24 hours</strong> regardless. We don't ghost.</p>
      <p style="font-size:15px;line-height:1.6;margin:0 0 8px;">Impatient? We love that for you. Tap below for WhatsApp:</p>
      ${whatsapp}
      <p style="font-size:15px;line-height:1.6;margin:28px 0 0;">Looking forward to working with you,<br><strong>The Mantra Sports Team</strong></p>`,
  };
}

const SYSTEM_ACTOR = "lead-intake";
const RATE_LIMIT_PER_HOUR = 30;
const RECENT_OPPORTUNITY_WINDOW_MS = 15 * 60 * 1000;

/**
 * Brochures live on the Company the LeadIntakeKey resolves to (set via
 * Settings → Brochures, uploaded to Vercel Blob) rather than as static
 * files in this codebase — replacing one is just a re-upload, never a code
 * change. `brochureUrl` is that company's own local-language/currency file;
 * `brochureUrlEn` is an optional English add-on (only meaningful where the
 * company's own language isn't English — e.g. DE/NL). `dto.locale` is kept
 * for backward compatibility with sites built before brochures became
 * per-company, but is no longer used: the company itself now determines
 * which files apply.
 */
function resolveBrochureUrls(
  company: { brochureUrl: string | null; brochureUrlEn: string | null } | null,
): string[] {
  if (!company) return [];
  return [company.brochureUrl, company.brochureUrlEn].filter((url): url is string => Boolean(url));
}

/**
 * Public, same per-Company `LeadIntakeKey` auth as POST /v1/leads/intake
 * (see that controller's own comment for why no session/RLS exists yet).
 * Deliberately a separate endpoint rather than a flag on /intake: every
 * site keeps its own existing contact-form integration completely
 * untouched (several predate this feature and aren't visible to us to
 * safely modify — see the brochure feature's plan). This just records
 * that a brochure was also requested for whichever lead that existing
 * integration just created, and emails it.
 */
@Controller("v1/leads")
@SkipTenantContext()
export class BrochureRequestController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly businessCode: BusinessCodeService,
    private readonly brevo: BrevoService,
  ) {}

  @Post("brochure")
  @HttpCode(200)
  async requestBrochure(@Headers("x-intake-key") intakeKey: string | undefined, @Body() dto: BrochureRequestDto) {
    if (!intakeKey) {
      throw new UnauthorizedException();
    }
    const keyRecord = await this.prisma.leadIntakeKey.findUnique({ where: { key: intakeKey } });
    if (!keyRecord || !keyRecord.enabled) {
      throw new UnauthorizedException();
    }

    const { organizationId, companyId } = keyRecord;

    const { downloadUrls, language, ...result } = await this.prisma.$transaction(
      async (tx) => {
        await tx.$executeRawUnsafe(`SET LOCAL app.current_org_id = '${organizationId}'`);
        return this.tenantContext.run({ tx, organizationId, userId: SYSTEM_ACTOR }, async () => {
          const company = await tx.company.findUnique({
            where: { id: companyId },
            include: { countries: { where: { deletedAt: null } } },
          });
          const downloadUrls = resolveBrochureUrls(company);
          const language = resolveLanguage(company);

          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
          const recentCount = await tx.opportunity.count({
            where: { organizationId, companyId, brochureSent: true, createdAt: { gte: oneHourAgo } },
          });
          if (recentCount >= RATE_LIMIT_PER_HOUR) {
            throw new BadRequestException("Too many submissions from this site right now — try again later");
          }

          // Almost always the Opportunity that site's own contact form just
          // created moments earlier — flag it rather than creating a
          // duplicate. Matches either a linked Customer's email or a still
          // -unlinked lead's own leadEmail (see Opportunity's model comment).
          const recentWindow = new Date(Date.now() - RECENT_OPPORTUNITY_WINDOW_MS);
          const existing = await tx.opportunity.findFirst({
            where: {
              organizationId,
              companyId,
              createdAt: { gte: recentWindow },
              OR: [{ leadEmail: dto.email }, { customer: { email: dto.email } }],
            },
            orderBy: { createdAt: "desc" },
          });

          if (existing) {
            await tx.opportunity.update({
              where: { id: existing.id },
              data: { brochureSent: true, brochureSentAt: new Date() },
            });
          } else {
            // No matching recent Opportunity — e.g. called standalone from a
            // dedicated brochure form. Create one so there's always an
            // auditable record, same shape /v1/leads/intake creates.
            const existingCustomer = await tx.customer.findFirst({
              where: { organizationId, email: dto.email, deletedAt: null },
            });
            const code = await this.businessCode.next("opportunity", { companyId });
            await tx.opportunity.create({
              data: {
                organizationId,
                companyId,
                code,
                customerId: existingCustomer?.id,
                leadName: existingCustomer ? undefined : dto.name,
                leadEmail: existingCustomer ? undefined : dto.email,
                leadPhone: existingCustomer ? undefined : dto.phone,
                name: `Brochure request — ${dto.name}`,
                source: OpportunitySource.WEBSITE,
                brochureSent: true,
                brochureSentAt: new Date(),
                createdBy: SYSTEM_ACTOR,
                updatedBy: SYSTEM_ACTOR,
              },
            });
          }

          return { ok: true as const, downloadUrls, language };
        });
      },
      { timeout: 15000 },
    );

    if (downloadUrls.length > 0) {
      const { subject, html } = brochureBody(language, dto.name, downloadUrls);
      await this.brevo.sendEmail({
        to: dto.email,
        subject,
        html: renderEmailShell(html),
        tags: ["brochure-download"],
      });
    }

    return { ...result, downloadUrls };
  }
}
