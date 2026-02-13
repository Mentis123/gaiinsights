import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  // Check auth
  const authCookie = req.cookies.get("gai_auth");
  if (authCookie?.value !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { brief, slideCount } = await req.json();

  if (!brief || typeof brief !== "string") {
    return NextResponse.json({ error: "Brief is required" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "your-key-here") {
    return NextResponse.json(
      { error: "Anthropic API key not configured. Set ANTHROPIC_API_KEY in environment variables." },
      { status: 500 }
    );
  }

  try {
    // Dynamic imports to avoid module-level loading issues on Vercel
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const { buildPresentation } = await import("@/lib/pptx-builder");
    const { SLIDE_SYSTEM_PROMPT } = await import("@/lib/brand");

    const client = new Anthropic({ apiKey });

    const userPrompt = `Create a ${slideCount || "10-15"} slide presentation based on this brief:\n\n${brief}\n\nReturn ONLY the JSON object. No markdown formatting, no code blocks, just raw JSON.`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 8192,
      system: SLIDE_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    // Extract text from response
    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from Claude");
    }

    let jsonStr = textBlock.text.trim();
    // Strip markdown code blocks if present
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const content = JSON.parse(jsonStr);

    // Build the PowerPoint using template-based approach
    const buffer = await buildPresentation(content);

    // Return the file
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${slugify(content.metadata?.title || "presentation")}.pptx"`,
      },
    });
  } catch (error) {
    console.error("Generation error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Generation failed: ${message}` }, { status: 500 });
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 60);
}
