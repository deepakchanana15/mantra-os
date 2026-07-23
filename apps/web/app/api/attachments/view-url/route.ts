import { issueSignedToken, presignUrl } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getOrgId, getSessionToken } from "@/lib/session";

const SIGNED_URL_TTL_MS = 5 * 60 * 1000;

/**
 * Attachments live in a private-access Blob store — the stored URL alone
 * isn't fetchable by anyone who has it, unlike the earlier public-access
 * design (see DECISIONS.md "Attachments switched to private access"). This
 * route issues a short-lived signed URL on demand instead, matching every
 * other route's baseline "logged in with an org selected" gate — the real
 * authorization already happened when the attachment's parent record
 * (GoodsReceipt/Expense) was created and returned to this same org.
 */
export async function POST(request: Request): Promise<NextResponse> {
  if (!getSessionToken() || !getOrgId()) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { url } = (await request.json()) as { url?: string };
  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  try {
    const pathname = new URL(url).pathname.slice(1);
    const signedToken = await issueSignedToken({
      pathname,
      operations: ["get"],
      validUntil: Date.now() + SIGNED_URL_TTL_MS,
    });
    const { presignedUrl } = await presignUrl(signedToken, {
      operation: "get",
      pathname,
      access: "private",
    });
    return NextResponse.json({ url: presignedUrl });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Couldn't generate a viewing link" },
      { status: 400 },
    );
  }
}
