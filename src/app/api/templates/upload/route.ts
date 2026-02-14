import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { extractTemplateConfig } from "@/lib/template-extractor";

export const maxDuration = 30;

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(req: NextRequest) {
  // Check auth
  const authCookie = req.cookies.get("gai_auth");
  if (authCookie?.value !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const name = file.name.toLowerCase();
    if (!name.endsWith(".pptx")) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload a .pptx file." },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.` },
        { status: 400 }
      );
    }

    // Read file into buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Vercel Blob
    const blob = await put("templates/active-template.pptx", buffer, {
      access: "public",
      addRandomSuffix: false,
    });

    // Extract template config
    const config = await extractTemplateConfig(buffer, blob.url);

    // Store config in Blob
    await put("templates/active-config.json", JSON.stringify(config, null, 2), {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
    });

    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error("[Templates/Upload] Error:", error);
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
