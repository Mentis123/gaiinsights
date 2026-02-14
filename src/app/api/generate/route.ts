import { NextRequest, NextResponse } from "next/server";
import type { TemplateConfig } from "@/lib/types";
import type { BuilderLayoutConfig } from "@/lib/pptx-builder";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  // Check auth
  const authCookie = req.cookies.get("gai_auth");
  if (authCookie?.value !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { brief, slideCount, model } = await req.json();

  if (!brief || typeof brief !== "string") {
    return NextResponse.json({ error: "Brief is required" }, { status: 400 });
  }

  const ALLOWED_MODELS = ["claude-sonnet-4-5-20250929", "claude-opus-4-6"];
  const selectedModel = ALLOWED_MODELS.includes(model) ? model : "claude-sonnet-4-5-20250929";

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
    const { buildSystemPrompt } = await import("@/lib/prompt-builder");

    // Check for custom template
    const templateConfig = await loadCustomTemplate();
    const systemPrompt = templateConfig
      ? buildSystemPrompt(templateConfig)
      : SLIDE_SYSTEM_PROMPT;

    const client = new Anthropic({ apiKey });

    const userPrompt = `Create a ${slideCount || "10-15"} slide presentation based on this brief:\n\n${brief}\n\nReturn ONLY the JSON object. No markdown formatting, no code blocks, just raw JSON.`;

    console.log(`[Generate] Using model: ${selectedModel}, requested slides: ${slideCount || "10-15"}, custom template: ${!!templateConfig}`);
    const message = await client.messages.create({
      model: selectedModel,
      max_tokens: 16384,
      system: systemPrompt,
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

    // Robust JSON extraction: find outermost { } boundaries (handles Claude preamble/postamble)
    const firstBrace = jsonStr.indexOf("{");
    const lastBrace = jsonStr.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
    }

    const content = JSON.parse(jsonStr);

    // Validate JSON structure
    if (!content.slides || !Array.isArray(content.slides) || content.slides.length === 0) {
      throw new Error("Invalid response: missing or empty slides array");
    }
    for (let i = 0; i < content.slides.length; i++) {
      const slide = content.slides[i];
      if (!slide.layout || typeof slide.layout !== "string") {
        throw new Error(`Invalid slide ${i + 1}: missing layout`);
      }
      if (!slide.placeholders || typeof slide.placeholders !== "object") {
        throw new Error(`Invalid slide ${i + 1}: missing placeholders`);
      }
    }

    console.log(`[Generate] Model: ${selectedModel}, slides generated: ${content.slides.length}`);

    // Build the PowerPoint — use custom template if available
    let builderOptions: Parameters<typeof buildPresentation>[1] | undefined;

    if (templateConfig) {
      // Fetch the template binary from Blob
      const templateRes = await fetch(templateConfig.blobUrl);
      if (templateRes.ok) {
        const templateArrayBuffer = await templateRes.arrayBuffer();
        const templateBuffer = Buffer.from(templateArrayBuffer);

        // Convert TemplateConfig layouts to BuilderLayoutConfig format
        const builderLayouts: Record<string, BuilderLayoutConfig> = {};
        for (const [slug, layout] of Object.entries(templateConfig.layouts)) {
          builderLayouts[slug] = {
            layoutFile: layout.layoutFile,
            placeholders: layout.placeholders.map((ph) => ({
              idx: ph.idx,
              phType: ph.phType,
              phIdx: ph.phIdx,
              name: ph.name,
            })),
          };
        }

        builderOptions = { templateBuffer, layouts: builderLayouts };
      } else {
        console.warn("[Generate] Could not fetch custom template, falling back to default");
      }
    }

    const buffer = await buildPresentation(content, builderOptions);

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

/**
 * Load custom template config from the template library if one is active.
 */
async function loadCustomTemplate(): Promise<TemplateConfig | null> {
  try {
    const { getActiveTemplate } = await import("@/lib/template-storage");
    return await getActiveTemplate();
  } catch {
    // Blob not configured or not available — use default
    return null;
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 60);
}
