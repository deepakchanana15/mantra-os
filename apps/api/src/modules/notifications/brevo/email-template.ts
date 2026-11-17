/**
 * Shared branded HTML shell + copy for every lead-facing transactional
 * email (POST /v1/leads/welcome and /v1/leads/brochure). Table-based markup
 * throughout — deliberately not flexbox/grid — since this has to render
 * acceptably in Outlook's Word engine as well as Gmail/Apple Mail.
 *
 * LOGO_URL is a placeholder until the logo is uploaded to the existing
 * Vercel Blob store (the same one brochurePDFs live in) and the real URL is
 * swapped in here.
 */
export const LOGO_URL = "https://cggafbpi0ae4c9hp.public.blob.vercel-storage.com/2color%20png.png";

const ORANGE = "#f05f22";
const STONE_BG = "#f4efe8";
const TEXT = "#2b2420";
const MUTED = "#6b6059";

export const SUPPORT_EMAIL = "support@mantrasports.com.au";

const CONTACT = {
  au: {
    label: "Australia",
    flag: "🇦🇺",
    phone: "+61 46 624 2222",
    whatsapp: "61466242222",
    address: "Unit 2, 5 Ford Court, Newnham, Launceston, Tasmania 7248, Australia",
    instagram: "https://www.instagram.com/mantrasportsau/",
    facebook: "https://www.facebook.com/mantrasportsau/",
  },
  usa: {
    label: "USA",
    flag: "🇺🇸",
    phone: "+1 (385) 601-3759",
    whatsapp: "13856013759",
    address: "5759 8055 S Apt. J, West Jordan, UT 84081, USA",
    instagram: "https://www.instagram.com/mantrasportsau/",
    facebook: "https://www.facebook.com/profile.php?id=61587392593078",
  },
} as const;

export type SupportedLanguage = "en" | "de" | "nl";

export function resolveLanguage(
  company: { countries: { defaultLanguage: string | null }[] } | null,
): SupportedLanguage {
  const lang = company?.countries[0]?.defaultLanguage;
  return lang === "de" || lang === "nl" ? lang : "en";
}

function waLink(whatsapp: string, text: string): string {
  return `https://wa.me/${whatsapp}?text=${encodeURIComponent(text)}`;
}

/** Two side-by-side WhatsApp CTA buttons (AU + USA) — same pair used on both the welcome and brochure emails. */
export function whatsappButtons(prefilledText: string): string {
  const button = (c: typeof CONTACT.au | typeof CONTACT.usa) => `
    <td style="padding:0 6px;">
      <a href="${waLink(c.whatsapp, prefilledText)}"
         style="display:inline-block;background:#25D366;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;text-decoration:none;padding:12px 18px;border-radius:8px;white-space:nowrap;">
        ${c.flag}&nbsp; Chat&nbsp;on&nbsp;WhatsApp
      </a>
    </td>`;
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px auto 0;">
    <tr>${button(CONTACT.au)}${button(CONTACT.usa)}</tr>
  </table>`;
}

/** Solid brand-orange CTA button — used for brochure downloads and any other primary action. */
export function ctaButton(href: string, label: string): string {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px auto;">
    <tr>
      <td style="background:${ORANGE};border-radius:8px;">
        <a href="${href}"
           style="display:inline-block;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;text-decoration:none;padding:13px 26px;">
          ${label}
        </a>
      </td>
    </tr>
  </table>`;
}

function footerColumn(c: typeof CONTACT.au | typeof CONTACT.usa): string {
  return `
  <td valign="top" style="padding:0 16px;width:50%;font-family:Arial,Helvetica,sans-serif;font-size:12.5px;line-height:1.7;color:#f4efe8;">
    <p style="margin:0 0 6px;font-weight:bold;color:#ffffff;font-size:13.5px;">${c.flag} ${c.label}</p>
    <p style="margin:0 0 6px;">${c.address}</p>
    <p style="margin:0 0 6px;">${c.phone} (call or WhatsApp)</p>
    <p style="margin:0;">
      <a href="${c.instagram}" style="color:#f4efe8;text-decoration:underline;">Instagram</a>
      &nbsp;·&nbsp;
      <a href="${c.facebook}" style="color:#f4efe8;text-decoration:underline;">Facebook</a>
    </p>
  </td>`;
}

/** Wraps a pre-built body section in the shared header/footer shell. */
export function renderEmailShell(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Mantra Sports</title>
</head>
<body style="margin:0;padding:24px 0;background:${STONE_BG};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;">
          <tr>
            <td align="center" style="padding:32px 24px 16px;">
              <img src="${LOGO_URL}" width="120" alt="Mantra Sports" style="display:block;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 32px;font-family:Arial,Helvetica,sans-serif;color:${TEXT};">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="background:#1f1b18;padding:28px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  ${footerColumn(CONTACT.au)}
                  ${footerColumn(CONTACT.usa)}
                </tr>
              </table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;border-top:1px solid #3a332e;">
                <tr>
                  <td style="padding-top:16px;font-family:Arial,Helvetica,sans-serif;font-size:11.5px;line-height:1.6;color:${MUTED};">
                    Questions or replies? Write to
                    <a href="mailto:${SUPPORT_EMAIL}" style="color:#f0b89a;">${SUPPORT_EMAIL}</a>
                    — this email came from an unmonitored address, so a reply here won't reach anyone.
                    <br />© ${new Date().getFullYear()} Mantra Sports. All rights reserved.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
