import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getOrgId, getSessionToken } from "@/lib/session";

/**
 * Issues client tokens for direct-to-Vercel-Blob uploads (goods receipt
 * scans/photos) so file bytes never pass through the NestJS API — avoids
 * Vercel's function body-size limit for a phone photo. Real authorization
 * for what the uploaded file becomes (a GoodsReceipt/Expense) still happens
 * on the NestJS side when that record is created; this route only gates on
 * "logged in with an org selected," matching every other route's baseline.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        if (!getSessionToken() || !getOrgId()) {
          throw new Error("Not authenticated");
        }
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
          maximumSizeInBytes: 10 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed" }, { status: 400 });
  }
}
