/**
 * One-off: registers (or re-registers) MantraOS's Brevo webhook against a
 * given API base URL. Run this once per environment after that
 * environment's BREVO_API_KEY and BREVO_WEBHOOK_SECRET are set — Brevo
 * needs a publicly reachable URL, so this can't target localhost; use it
 * against the deployed apps/api URL (e.g. https://mantra-os-api.vercel.app).
 *
 * Usage:
 *   BREVO_API_KEY=... BREVO_WEBHOOK_SECRET=... node scripts/register-brevo-webhook.js https://mantra-os-api.vercel.app
 *
 * Idempotent-ish: lists existing webhooks first and updates one already
 * pointed at the same URL instead of creating a duplicate.
 */
const apiKey = process.env.BREVO_API_KEY;
const webhookSecret = process.env.BREVO_WEBHOOK_SECRET;
const baseUrl = process.argv[2];

if (!apiKey || !webhookSecret) {
  console.error("Set BREVO_API_KEY and BREVO_WEBHOOK_SECRET in the environment before running this.");
  process.exit(1);
}
if (!baseUrl) {
  console.error("Usage: node scripts/register-brevo-webhook.js <api-base-url>");
  process.exit(1);
}

const webhookUrl = `${baseUrl.replace(/\/$/, "")}/v1/webhooks/brevo`;
const payload = {
  url: webhookUrl,
  description: "MantraOS campaign tracking",
  type: "transactional",
  events: ["delivered", "uniqueOpened", "click", "hardBounce", "softBounce", "blocked", "invalid"],
  headers: [{ key: "x-webhook-secret", value: webhookSecret }],
};

async function main() {
  const headers = { "api-key": apiKey, "Content-Type": "application/json", Accept: "application/json" };

  const existingRes = await fetch("https://api.brevo.com/v3/webhooks", { headers });
  if (!existingRes.ok) throw new Error(`Couldn't list webhooks: ${existingRes.status} ${await existingRes.text()}`);
  const existing = (await existingRes.json()).webhooks ?? [];
  const match = existing.find((w) => w.url === webhookUrl);

  if (match) {
    const res = await fetch(`https://api.brevo.com/v3/webhooks/${match.id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Update failed: ${res.status} ${await res.text()}`);
    console.log(`Updated existing webhook (id ${match.id}) -> ${webhookUrl}`);
  } else {
    const res = await fetch("https://api.brevo.com/v3/webhooks", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Create failed: ${res.status} ${await res.text()}`);
    const body = await res.json();
    console.log(`Created new webhook (id ${body.id}) -> ${webhookUrl}`);
  }
}

main().catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});
