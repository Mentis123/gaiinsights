import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { extractTemplateConfig } from "@/lib/template-extractor";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  // Check auth
  const authCookie = req.cookies.get("gai_auth");
  if (authCookie?.value !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { blobUrl } = await req.json();

    if (!blobUrl || typeof blobUrl !== "string") {
      return NextResponse.json({ error: "blobUrl is required" }, { status: 400 });
    }

    // Fetch the uploaded template from Blob
    const blobRes = await fetch(blobUrl);
    if (!blobRes.ok) {
      return NextResponse.json({ error: "Failed to fetch uploaded template" }, { status: 500 });
    }

    const arrayBuffer = await blobRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract template config
    const config = await extractTemplateConfig(buffer, blobUrl);

    // Store config in Blob
    await put("templates/active-config.json", JSON.stringify(config, null, 2), {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
    });

    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error("[Templates/Extract] Error:", error);
    const message = error instanceof Error ? error.message : "Extraction failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
