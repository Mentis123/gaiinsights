import { NextRequest, NextResponse } from "next/server";
import { getActiveTemplate, updateTemplate } from "@/lib/template-storage";
import type { TemplateConfig } from "@/lib/types";

/**
 * GET /api/templates/config — Get the currently active template config.
 */
export async function GET(req: NextRequest) {
  const authCookie = req.cookies.get("gai_auth");
  if (authCookie?.value !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const config = await getActiveTemplate();
    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error("[Templates/Config] GET error:", error);
    return NextResponse.json({ error: "Failed to load config" }, { status: 500 });
  }
}

/**
 * PUT /api/templates/config — Update a template config by ID.
 * The full config (with id) is sent in the body.
 */
export async function PUT(req: NextRequest) {
  const authCookie = req.cookies.get("gai_auth");
  if (authCookie?.value !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const updates: TemplateConfig = await req.json();

    if (!updates.id) {
      return NextResponse.json({ error: "Template id is required" }, { status: 400 });
    }

    const library = await updateTemplate(updates);
    const config = library.templates.find((t) => t.id === updates.id);

    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error("[Templates/Config] PUT error:", error);
    const message = error instanceof Error ? error.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
