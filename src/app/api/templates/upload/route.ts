import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

export async function POST(request: Request): Promise<NextResponse> {
  // Auth check via cookie
  const cookieHeader = request.headers.get("cookie") || "";
  if (!cookieHeader.includes("gai_auth=authenticated")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        return {
          allowedContentTypes: [
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          ],
          maximumSizeInBytes: 50 * 1024 * 1024, // 50MB
        };
      },
      onUploadCompleted: async () => {
        // No-op: extraction happens in the separate /api/templates/extract call
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("[Templates/Upload] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 400 }
    );
  }
}
