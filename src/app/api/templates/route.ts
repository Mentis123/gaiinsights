import { NextRequest, NextResponse } from "next/server";
import { getLibrary, deleteTemplate, setActiveTemplate } from "@/lib/template-storage";

/**
 * GET /api/templates — Return the full template library.
 */
export async function GET(req: NextRequest) {
  const authCookie = req.cookies.get("gai_auth");
  if (authCookie?.value !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const library = await getLibrary();
    return NextResponse.json({ success: true, library });
  } catch (error) {
    console.error("[Templates] GET error:", error);
    return NextResponse.json({ error: "Failed to load templates" }, { status: 500 });
  }
}

/**
 * DELETE /api/templates?id=xxx — Delete a specific template.
 * DELETE /api/templates (no id) — Reset active to default (keep templates).
 */
export async function DELETE(req: NextRequest) {
  const authCookie = req.cookies.get("gai_auth");
  if (authCookie?.value !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const id = req.nextUrl.searchParams.get("id");

    if (id) {
      // Delete specific template
      const library = await deleteTemplate(id);
      return NextResponse.json({ success: true, library });
    } else {
      // Just reset active to default
      const library = await setActiveTemplate(null);
      return NextResponse.json({ success: true, library });
    }
  } catch (error) {
    console.error("[Templates] DELETE error:", error);
    const message = error instanceof Error ? error.message : "Delete failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/templates — Set active template by ID.
 * Body: { activeId: string | null }
 */
export async function POST(req: NextRequest) {
  const authCookie = req.cookies.get("gai_auth");
  if (authCookie?.value !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { activeId } = await req.json();
    const library = await setActiveTemplate(activeId ?? null);
    return NextResponse.json({ success: true, library });
  } catch (error) {
    console.error("[Templates] POST error:", error);
    const message = error instanceof Error ? error.message : "Selection failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
