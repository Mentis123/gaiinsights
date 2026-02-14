import { NextRequest, NextResponse } from "next/server";
import { put, list } from "@vercel/blob";
import type { TemplateConfig } from "@/lib/types";

export async function GET(req: NextRequest) {
  // Check auth
  const authCookie = req.cookies.get("gai_auth");
  if (authCookie?.value !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check if config exists in Blob
    const { blobs } = await list({ prefix: "templates/active-config.json" });
    if (blobs.length === 0) {
      return NextResponse.json({ success: true, config: null });
    }

    // Fetch the config
    const configBlob = blobs[0];
    const res = await fetch(configBlob.url);
    if (!res.ok) {
      return NextResponse.json({ success: true, config: null });
    }

    const config: TemplateConfig = await res.json();
    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error("[Templates/Config] GET error:", error);
    return NextResponse.json({ error: "Failed to load config" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  // Check auth
  const authCookie = req.cookies.get("gai_auth");
  if (authCookie?.value !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const updates = await req.json();

    // Load existing config
    const { blobs } = await list({ prefix: "templates/active-config.json" });
    if (blobs.length === 0) {
      return NextResponse.json({ error: "No template config found" }, { status: 404 });
    }

    const configBlob = blobs[0];
    const res = await fetch(configBlob.url);
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to load existing config" }, { status: 500 });
    }

    const existing: TemplateConfig = await res.json();

    // Merge updates (shallow merge of top-level fields)
    const updated: TemplateConfig = {
      ...existing,
      ...updates,
      // Deep-merge specific nested fields
      theme: { ...existing.theme, ...updates.theme },
      promptOverrides: { ...existing.promptOverrides, ...updates.promptOverrides },
    };

    // If layouts were updated, merge per-layout
    if (updates.layouts) {
      updated.layouts = { ...existing.layouts };
      for (const [key, value] of Object.entries(updates.layouts)) {
        if (existing.layouts[key]) {
          updated.layouts[key] = { ...existing.layouts[key], ...(value as object) };
        } else {
          updated.layouts[key] = value as TemplateConfig["layouts"][string];
        }
      }
    }

    // Save updated config
    await put("templates/active-config.json", JSON.stringify(updated, null, 2), {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
    });

    return NextResponse.json({ success: true, config: updated });
  } catch (error) {
    console.error("[Templates/Config] PUT error:", error);
    const message = error instanceof Error ? error.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
