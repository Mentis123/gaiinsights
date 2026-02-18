import { NextRequest, NextResponse } from "next/server";
import { SLIDE_ANALYSIS_PROMPT } from "@/lib/pdf2edit-types";
import type { SlideAnalysis } from "@/lib/pdf2edit-types";

export const maxDuration = 120;

const ALLOWED_MODELS = ["claude-sonnet-4-6", "claude-sonnet-4-5-20250929", "claude-opus-4-6"];

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "your-key-here") {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 500 }
    );
  }

  try {
    const { image, width, height, model } = await req.json();

    if (!image || typeof image !== "string") {
      return NextResponse.json(
        { error: "Missing base64 image data" },
        { status: 400 }
      );
    }

    const selectedModel = ALLOWED_MODELS.includes(model)
      ? model
      : "claude-sonnet-4-6";

    // Strip data URI prefix to get raw base64
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

    // Detect media type from data URI
    const mediaTypeMatch = image.match(/^data:(image\/\w+);base64,/);
    const mediaType = mediaTypeMatch?.[1] || "image/jpeg";

    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic({ apiKey });

    const userMessage = `Analyze this slide image (original pixel dimensions: ${width}x${height}). Return ONLY the JSON object describing all elements.`;

    console.log(
      `[pdf2edit/analyze] Model: ${selectedModel}, image: ${width}x${height}`
    );

    const message = await client.messages.create({
      model: selectedModel,
      max_tokens: 8192,
      system: SLIDE_ANALYSIS_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType as
                  | "image/jpeg"
                  | "image/png"
                  | "image/gif"
                  | "image/webp",
                data: base64Data,
              },
            },
            {
              type: "text",
              text: userMessage,
            },
          ],
        },
      ],
    });

    // Extract text response
    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from Claude");
    }

    let jsonStr = textBlock.text.trim();

    // Strip markdown code blocks if present
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    // Robust JSON extraction: find outermost { } boundaries
    const firstBrace = jsonStr.indexOf("{");
    const lastBrace = jsonStr.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
    }

    const analysis: SlideAnalysis = JSON.parse(jsonStr);

    // Basic validation
    if (!analysis.background || !Array.isArray(analysis.elements)) {
      throw new Error("Invalid analysis: missing background or elements array");
    }

    console.log(
      `[pdf2edit/analyze] Found ${analysis.elements.length} elements (bg: ${analysis.background.color})`
    );

    return NextResponse.json(analysis);
  } catch (err) {
    console.error("[pdf2edit/analyze] Error:", err);

    const message = err instanceof Error ? err.message : "Analysis failed";

    // If JSON parse failed, suggest retry
    if (message.includes("JSON") || message.includes("parse")) {
      return NextResponse.json(
        { error: "Failed to parse slide analysis. Will retry.", retryable: true },
        { status: 422 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
