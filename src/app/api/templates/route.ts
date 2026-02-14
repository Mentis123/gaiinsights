import { NextRequest, NextResponse } from "next/server";
import { del, list } from "@vercel/blob";

export async function DELETE(req: NextRequest) {
  // Check auth
  const authCookie = req.cookies.get("gai_auth");
  if (authCookie?.value !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // List and delete all template blobs
    const { blobs } = await list({ prefix: "templates/" });

    if (blobs.length === 0) {
      return NextResponse.json({ success: true, message: "No template to remove" });
    }

    await del(blobs.map((b) => b.url));

    return NextResponse.json({ success: true, message: "Template removed" });
  } catch (error) {
    console.error("[Templates] DELETE error:", error);
    const message = error instanceof Error ? error.message : "Delete failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
