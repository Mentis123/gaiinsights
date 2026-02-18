import { NextRequest, NextResponse } from "next/server";

interface Vertex {
  x: number;
  y: number;
}

interface OcrBlock {
  text: string;
  vertices: Vertex[];
}

interface VisionParagraph {
  boundingBox?: { vertices?: Vertex[] };
  words?: Array<{
    symbols?: Array<{ text?: string }>;
    boundingBox?: { vertices?: Vertex[] };
  }>;
}

interface VisionBlock {
  paragraphs?: VisionParagraph[];
}

interface VisionPage {
  blocks?: VisionBlock[];
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GOOGLE_CLOUD_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GOOGLE_CLOUD_API_KEY not configured" },
      { status: 500 }
    );
  }

  try {
    const { image } = await req.json();
    if (!image || typeof image !== "string") {
      return NextResponse.json(
        { error: "Missing base64 image data" },
        { status: 400 }
      );
    }

    // Strip data URI prefix if present
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

    const visionRes = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [
            {
              image: { content: base64Data },
              features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
            },
          ],
        }),
      }
    );

    if (!visionRes.ok) {
      const errText = await visionRes.text();
      console.error("[pdf2edit/ocr] Vision API error:", errText);
      return NextResponse.json(
        { error: `Vision API error (${visionRes.status})` },
        { status: 502 }
      );
    }

    const visionData = await visionRes.json();
    const annotation = visionData.responses?.[0];

    if (annotation?.error) {
      return NextResponse.json(
        { error: annotation.error.message || "Vision API returned an error" },
        { status: 502 }
      );
    }

    const fullText =
      annotation?.fullTextAnnotation?.text || "";

    // Extract paragraph-level blocks with bounding boxes
    const blocks: OcrBlock[] = [];
    const pages: VisionPage[] =
      annotation?.fullTextAnnotation?.pages || [];

    for (const page of pages) {
      for (const block of page.blocks || []) {
        for (const paragraph of block.paragraphs || []) {
          // Build paragraph text from words/symbols
          let paraText = "";
          for (const word of paragraph.words || []) {
            const wordText = (word.symbols || [])
              .map((s) => s.text || "")
              .join("");
            if (paraText && wordText) paraText += " ";
            paraText += wordText;
          }

          const vertices = paragraph.boundingBox?.vertices || [];
          if (paraText.trim() && vertices.length >= 4) {
            blocks.push({
              text: paraText.trim(),
              vertices: vertices.map((v: Vertex) => ({
                x: v.x || 0,
                y: v.y || 0,
              })),
            });
          }
        }
      }
    }

    return NextResponse.json({ blocks, fullText });
  } catch (err) {
    console.error("[pdf2edit/ocr] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
