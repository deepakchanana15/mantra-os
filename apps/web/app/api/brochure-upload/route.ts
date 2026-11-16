import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getOrgId, getSessionToken } from "@/lib/session";

const MAX_SIZE_BYTES = 10 * 1024 * 1024;

/**
 * Server-proxied upload for brochure PDFs. Unlike /api/uploads (a client
 * token so the browser PUTs large phone photos straight to blob storage,
 * dodging the function body-size limit), brochures are small, so the file
 * comes through our own server instead. The direct-to-blob-storage PUT was
 * hanging indefinitely for some uploads with no server-side error — this
 * avoids that path entirely rather than chasing a browser/network cause we
 * can't observe.
 */
export async function POST(request: Request): Promise<NextResponse> {
  if (!getSessionToken() || !getOrgId()) {
    return NextResponse.json({ error: { message: "Not authenticated" } }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: { message: "No file provided" } }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: { message: "Only PDF files are allowed" } }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: { message: "File is too large (max 10MB)" } }, { status: 400 });
  }

  try {
    const blob = await put(file.name, file, { access: "public", addRandomSuffix: true });
    return NextResponse.json({ url: blob.url });
  } catch (error) {
    return NextResponse.json(
      { error: { message: error instanceof Error ? error.message : "Upload failed" } },
      { status: 500 },
    );
  }
}
