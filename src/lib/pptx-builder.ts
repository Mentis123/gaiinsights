import Automizer from "pptx-automizer";
import * as fs from "fs";
import * as path from "path";

// Source slide mapping: layout name -> slide number (1-based) in gai-source.pptx
const LAYOUT_MAP: Record<string, number> = {
  title: 1,
  content: 2,
  divider: 3,
  divider_a: 3,
  comparison: 4,
  comparison_2: 4,
  statement: 5,
  main_point: 5,
  title_body: 6,
};

// Tag names per source slide: { placeholder index -> tag to replace }
const TAG_MAP: Record<number, Record<string, string>> = {
  1: { "0": "TITLE", "1": "SUBTITLE" },
  2: { "0": "TITLE", "1": "BODY" },
  3: { "0": "TITLE" },
  4: { "0": "TITLE", "1": "LEFT", "2": "RIGHT" },
  5: { "0": "TITLE" },
  6: { "0": "TITLE", "1": "BODY" },
};

interface SlideData {
  layout: string;
  placeholders: Record<string, string>;
  notes?: string;
}

interface PresentationContent {
  metadata: {
    title: string;
    author?: string;
    date?: string;
  };
  slides: SlideData[];
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function buildPresentation(
  content: PresentationContent
): Promise<Buffer> {
  const templatePath = path.join(process.cwd(), "public", "gai-source.pptx");
  const templateBuffer = fs.readFileSync(templatePath);

  const automizer = new Automizer({
    removeExistingSlides: true,
    compression: 0,
    verbosity: 0,
  });

  const pres = automizer
    .loadRoot(templateBuffer)
    .load(templateBuffer, "source");

  // Step 1: Copy slides from source (no text modification via automizer)
  const slideReplacements: Array<Record<string, string>> = [];

  for (const slideData of content.slides) {
    const slideNum = LAYOUT_MAP[slideData.layout] || LAYOUT_MAP.content;
    pres.addSlide("source", slideNum);

    // Build the tag->text replacement map for this slide
    const tagMap = TAG_MAP[slideNum];
    const replacements: Record<string, string> = {};
    for (const [idx, text] of Object.entries(slideData.placeholders)) {
      const tag = tagMap?.[idx];
      if (tag && text) {
        replacements[`{{${tag}}}`] = text;
      }
    }
    slideReplacements.push(replacements);
  }

  // Step 2: Get JSZip instance (slides are copied but text unchanged)
  const jszip = await pres.getJSZip();

  // Step 3: Find all slide XML files and apply text replacements
  const slideFiles: string[] = [];
  jszip.folder("ppt/slides")?.forEach((relativePath) => {
    if (relativePath.match(/^slide\d+\.xml$/)) {
      slideFiles.push(`ppt/slides/${relativePath}`);
    }
  });

  // Sort by slide number
  slideFiles.sort((a, b) => {
    const numA = parseInt(a.match(/slide(\d+)/)?.[1] || "0");
    const numB = parseInt(b.match(/slide(\d+)/)?.[1] || "0");
    return numA - numB;
  });

  console.log(
    `[PPTX] Found ${slideFiles.length} slides, applying ${slideReplacements.length} replacement sets`
  );

  // Apply replacements to each slide
  for (let i = 0; i < Math.min(slideFiles.length, slideReplacements.length); i++) {
    const slidePath = slideFiles[i];
    const replacements = slideReplacements[i];

    const file = jszip.file(slidePath);
    if (!file) continue;

    let xml = await file.async("text");

    // Replace each tag in the XML
    for (const [tag, text] of Object.entries(replacements)) {
      const escapedText = escapeXml(text);
      // Handle newlines: replace \n with XML line breaks
      // In OOXML, we need </a:t></a:r></a:p><a:p><a:r><a:t> for new paragraphs
      // But simpler: just replace within the <a:t> element
      xml = xml.replace(tag, escapedText);
    }

    jszip.file(slidePath, xml);
  }

  const buffer = await jszip.generateAsync({ type: "nodebuffer" });
  return buffer as Buffer;
}
