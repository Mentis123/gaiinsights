import JSZip from "jszip";
import * as fs from "fs";
import * as path from "path";
import type { PresentationContent } from "./types";

// Layout config: name -> { layoutFile, placeholders }
// layoutFile maps to slideLayout(N+1).xml where N is the 0-based layout index
export type BuilderLayoutConfig = {
  layoutFile: string;
  placeholders: Array<{
    idx: string;
    phType: string;
    phIdx?: number;
    name: string;
  }>;
};

const LAYOUTS: Record<string, BuilderLayoutConfig> = {
  title: {
    layoutFile: "slideLayout1.xml", // TITLE (layout 0)
    placeholders: [
      { idx: "0", phType: "ctrTitle", name: "Title 1" },
      { idx: "1", phType: "subTitle", phIdx: 1, name: "Subtitle 2" },
    ],
  },
  content: {
    layoutFile: "slideLayout3.xml", // OBJECT (layout 2)
    placeholders: [
      { idx: "0", phType: "title", name: "Title 1" },
      { idx: "1", phType: "body", phIdx: 1, name: "Text Placeholder 2" },
    ],
  },
  divider: {
    layoutFile: "slideLayout6.xml", // Divider Slide A (layout 5)
    placeholders: [
      { idx: "0", phType: "ctrTitle", name: "Title 1" },
    ],
  },
  divider_b: {
    layoutFile: "slideLayout7.xml", // Divider Slide B (layout 6)
    placeholders: [
      { idx: "0", phType: "ctrTitle", name: "Title 1" },
    ],
  },
  divider_c: {
    layoutFile: "slideLayout8.xml", // Divider Slide C (layout 7)
    placeholders: [
      { idx: "0", phType: "ctrTitle", name: "Title 1" },
    ],
  },
  comparison: {
    layoutFile: "slideLayout9.xml", // 1_Comparison (layout 8)
    placeholders: [
      { idx: "0", phType: "title", name: "Title 1" },
      { idx: "1", phType: "body", phIdx: 1, name: "Text Placeholder 2" },
      { idx: "2", phType: "body", phIdx: 2, name: "Text Placeholder 3" },
    ],
  },
  statement: {
    layoutFile: "slideLayout22.xml", // MAIN_POINT (layout 21)
    placeholders: [
      { idx: "0", phType: "title", name: "Title 1" },
    ],
  },
  title_body: {
    layoutFile: "slideLayout21.xml", // TITLE_AND_BODY (layout 20)
    placeholders: [
      { idx: "0", phType: "title", name: "Title 1" },
      { idx: "1", phType: "body", phIdx: 1, name: "Text Placeholder 2" },
    ],
  },
  title_only: {
    layoutFile: "slideLayout2.xml", // TITLE_ONLY (layout 1)
    placeholders: [
      { idx: "0", phType: "title", name: "Title 1" },
    ],
  },
  one_column: {
    layoutFile: "slideLayout23.xml", // ONE_COLUMN (layout 22)
    placeholders: [
      { idx: "0", phType: "title", name: "Title 1" },
      { idx: "1", phType: "body", phIdx: 1, name: "Text Placeholder 2" },
    ],
  },
};

// Aliases
LAYOUTS.divider_a = LAYOUTS.divider;
LAYOUTS.comparison_2 = LAYOUTS.comparison;
LAYOUTS.main_point = LAYOUTS.statement;

// SlideData and PresentationContent imported from ./types

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function textToParagraphs(text: string): string {
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length === 0) return "<a:p><a:endParaRPr/></a:p>";
  return lines
    .map((line) => `<a:p><a:r><a:t>${escapeXml(line)}</a:t></a:r></a:p>`)
    .join("");
}

/**
 * Extract placeholder shapes from layout XML.
 * Returns a map of "phType:phIdx" -> full <p:sp>...</p:sp> XML string.
 */
function extractPlaceholderShapes(layoutXml: string): Map<string, string> {
  const shapes = new Map<string, string>();
  // Match each <p:sp>...</p:sp> block
  const spRegex = /<p:sp\b[^>]*>[\s\S]*?<\/p:sp>/g;
  let match;
  while ((match = spRegex.exec(layoutXml)) !== null) {
    const spXml = match[0];
    // Check if this shape has a placeholder
    const phMatch = spXml.match(/<p:ph\s+([^/]*?)\/>/);
    if (!phMatch) continue;

    const phAttrs = phMatch[1];
    const typeMatch = phAttrs.match(/type="([^"]+)"/);
    const idxMatch = phAttrs.match(/idx="([^"]+)"/);

    const phType = typeMatch ? typeMatch[1] : "body";
    const phIdx = idxMatch ? idxMatch[1] : "0";
    const key = `${phType}:${phIdx}`;
    shapes.set(key, spXml);
  }
  return shapes;
}

/**
 * Replace the <p:txBody> content inside a cloned shape XML with our generated text.
 * Preserves the shape's position, size, and formatting properties.
 */
function replaceTextBody(shapeXml: string, text: string): string {
  const paragraphs = text
    ? textToParagraphs(text)
    : "<a:p><a:endParaRPr/></a:p>";

  // Replace the entire <p:txBody>...</p:txBody> content
  // Keep <a:bodyPr> and <a:lstStyle> from the original, replace paragraphs
  const txBodyMatch = shapeXml.match(/<p:txBody>([\s\S]*?)<\/p:txBody>/);
  if (!txBodyMatch) {
    // No txBody found, append one
    return shapeXml.replace(
      /<\/p:sp>/,
      `<p:txBody><a:bodyPr/><a:lstStyle/>${paragraphs}</p:txBody></p:sp>`
    );
  }

  const txBodyContent = txBodyMatch[1];

  // Extract <a:bodyPr.../> (may be self-closing or have content)
  const bodyPrMatch = txBodyContent.match(/<a:bodyPr[^>]*(?:\/>|>[\s\S]*?<\/a:bodyPr>)/);
  const bodyPr = bodyPrMatch ? bodyPrMatch[0] : "<a:bodyPr/>";

  // Extract <a:lstStyle.../> (may be self-closing or have content)
  const lstStyleMatch = txBodyContent.match(/<a:lstStyle[^>]*(?:\/>|>[\s\S]*?<\/a:lstStyle>)/);
  const lstStyle = lstStyleMatch ? lstStyleMatch[0] : "<a:lstStyle/>";

  const newTxBody = `<p:txBody>${bodyPr}${lstStyle}${paragraphs}</p:txBody>`;
  return shapeXml.replace(/<p:txBody>[\s\S]*?<\/p:txBody>/, newTxBody);
}

/**
 * Build slide XML by cloning placeholder shapes from the layout XML.
 * Falls back to minimal XML if layout shapes can't be extracted.
 */
function buildSlideXml(
  layout: BuilderLayoutConfig,
  placeholders: Record<string, string>,
  layoutXml: string | null
): string {
  let shapes = "";
  let shapeId = 2;

  // Try to extract placeholder shapes from the layout
  const layoutShapes = layoutXml ? extractPlaceholderShapes(layoutXml) : new Map<string, string>();

  for (const ph of layout.placeholders) {
    const text = placeholders[ph.idx] || "";
    const phIdx = ph.phIdx !== undefined ? String(ph.phIdx) : "0";
    const lookupKey = `${ph.phType}:${phIdx}`;

    const layoutShape = layoutShapes.get(lookupKey);

    if (layoutShape) {
      // Clone the layout shape and replace text content
      let clonedShape = replaceTextBody(layoutShape, text);

      // Update shape ID to avoid conflicts
      clonedShape = clonedShape.replace(
        /(<p:cNvPr\s+id=")(\d+)(")/,
        `$1${shapeId}$3`
      );

      shapes += clonedShape;
    } else {
      // Fallback: minimal placeholder XML (original approach)
      const idxAttr = ph.phIdx !== undefined ? ` idx="${ph.phIdx}"` : "";
      const paragraphs = text
        ? textToParagraphs(text)
        : "<a:p><a:endParaRPr/></a:p>";

      shapes += `<p:sp><p:nvSpPr><p:cNvPr id="${shapeId}" name="${ph.name}"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="${ph.phType}"${idxAttr}/></p:nvPr></p:nvSpPr><p:spPr/><p:txBody><a:bodyPr/><a:lstStyle/>${paragraphs}</p:txBody></p:sp>`;
    }
    shapeId++;
  }

  return `<?xml version='1.0' encoding='UTF-8' standalone='yes'?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/>${shapes}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`;
}

function buildSlideRelsXml(layoutFile: string, notesSlideNum?: number): string {
  let rels = `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/${layoutFile}"/>`;

  if (notesSlideNum !== undefined) {
    rels += `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesSlide" Target="../notesSlides/notesSlide${notesSlideNum}.xml"/>`;
  }

  return `<?xml version='1.0' encoding='UTF-8' standalone='yes'?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rels}</Relationships>`;
}

function buildNotesSlideXml(slideNum: number, notesText: string): string {
  const paragraphs = notesText
    ? textToParagraphs(notesText)
    : "<a:p><a:endParaRPr/></a:p>";

  return `<?xml version='1.0' encoding='UTF-8' standalone='yes'?>
<p:notes xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/><p:sp><p:nvSpPr><p:cNvPr id="2" name="Slide Image Placeholder 1"/><p:cNvSpPr><a:spLocks noGrp="1" noRot="1" noChangeAspect="1"/></p:cNvSpPr><p:nvPr><p:ph type="sldImg"/></p:nvPr></p:nvSpPr><p:spPr/></p:sp><p:sp><p:nvSpPr><p:cNvPr id="3" name="Notes Placeholder 2"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="body" idx="1"/></p:nvPr></p:nvSpPr><p:spPr/><p:txBody><a:bodyPr/><a:lstStyle/>${paragraphs}</p:txBody></p:sp></p:spTree></p:cSld></p:notes>`;
}

function buildNotesSlideRelsXml(slideNum: number): string {
  return `<?xml version='1.0' encoding='UTF-8' standalone='yes'?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="../slides/slide${slideNum}.xml"/></Relationships>`;
}

export async function buildPresentation(
  content: PresentationContent,
  options?: {
    templateBuffer?: Buffer;
    layouts?: Record<string, BuilderLayoutConfig>;
  }
): Promise<Buffer> {
  // Load template: use provided buffer or fall back to default GAI template
  let rawBuffer: Buffer;
  if (options?.templateBuffer) {
    rawBuffer = options.templateBuffer;
  } else {
    const templatePath = path.join(process.cwd(), "public", "gai-blank.pptx");
    rawBuffer = fs.readFileSync(templatePath);
  }
  const zip = await JSZip.loadAsync(rawBuffer);

  // Use provided layouts or fall back to hardcoded defaults
  const activeLayouts = options?.layouts || LAYOUTS;

  // Read current presentation.xml
  const presXml = await zip.file("ppt/presentation.xml")!.async("text");

  // Read current presentation.xml.rels
  const presRels = await zip.file("ppt/_rels/presentation.xml.rels")!.async("text");

  // Read [Content_Types].xml
  const contentTypes = await zip.file("[Content_Types].xml")!.async("text");

  // Pre-read layout XMLs for cloning (cache to avoid reading same layout twice)
  const layoutXmlCache = new Map<string, string>();
  for (const slideData of content.slides) {
    const layoutName = slideData.layout || "content";
    const layout = activeLayouts[layoutName] || activeLayouts.content;
    if (!layoutXmlCache.has(layout.layoutFile)) {
      const layoutPath = `ppt/slideLayouts/${layout.layoutFile}`;
      const layoutFile = zip.file(layoutPath);
      if (layoutFile) {
        try {
          const xml = await layoutFile.async("text");
          layoutXmlCache.set(layout.layoutFile, xml);
        } catch {
          console.warn(`[PPTX] Could not read layout: ${layoutPath}`);
        }
      }
    }
  }

  // Find the highest existing rId in presentation.xml.rels
  const rIdMatches = presRels.match(/Id="rId(\d+)"/g) || [];
  let maxRId = 0;
  for (const match of rIdMatches) {
    const num = parseInt(match.match(/rId(\d+)/)![1]);
    if (num > maxRId) maxRId = num;
  }

  // Build slide entries
  const slideEntries: Array<{
    slideNum: number;
    rId: string;
    sldId: number;
    hasNotes: boolean;
  }> = [];

  let nextRId = maxRId + 1;
  let nextSldId = 256; // Standard starting slide ID
  let notesCount = 0;

  for (let i = 0; i < content.slides.length; i++) {
    const slideData = content.slides[i];
    const layoutName = slideData.layout || "content";
    const layout = activeLayouts[layoutName] || activeLayouts.content;
    const slideNum = i + 1;
    const rId = `rId${nextRId}`;
    const hasNotes = !!(slideData.notes && slideData.notes.trim());

    // Get cached layout XML for cloning
    const layoutXml = layoutXmlCache.get(layout.layoutFile) || null;

    // Create slide XML (with layout cloning)
    const slideXml = buildSlideXml(layout, slideData.placeholders, layoutXml);
    zip.file(`ppt/slides/slide${slideNum}.xml`, slideXml);

    // Create slide rels (with notes reference if applicable)
    const slideRels = buildSlideRelsXml(
      layout.layoutFile,
      hasNotes ? slideNum : undefined
    );
    zip.file(`ppt/slides/_rels/slide${slideNum}.xml.rels`, slideRels);

    // Create notes slide if notes exist
    if (hasNotes) {
      notesCount++;
      const notesXml = buildNotesSlideXml(slideNum, slideData.notes!);
      zip.file(`ppt/notesSlides/notesSlide${slideNum}.xml`, notesXml);

      const notesRels = buildNotesSlideRelsXml(slideNum);
      zip.file(`ppt/notesSlides/_rels/notesSlide${slideNum}.xml.rels`, notesRels);
    }

    slideEntries.push({ slideNum, rId, sldId: nextSldId, hasNotes });
    nextRId++;
    nextSldId++;
  }

  // Update presentation.xml - add slide references to sldIdLst
  const sldIdEntries = slideEntries
    .map((e) => `<p:sldId id="${e.sldId}" r:id="${e.rId}"/>`)
    .join("");

  let newPresXml: string;
  if (presXml.includes("<p:sldIdLst/>")) {
    // Empty sldIdLst (self-closing)
    newPresXml = presXml.replace(
      "<p:sldIdLst/>",
      `<p:sldIdLst>${sldIdEntries}</p:sldIdLst>`
    );
  } else if (presXml.includes("<p:sldIdLst>")) {
    // Existing sldIdLst with content - replace it
    newPresXml = presXml.replace(
      /<p:sldIdLst>[\s\S]*?<\/p:sldIdLst>/,
      `<p:sldIdLst>${sldIdEntries}</p:sldIdLst>`
    );
  } else {
    // No sldIdLst at all - add after sldMasterIdLst
    newPresXml = presXml.replace(
      /<\/p:sldMasterIdLst>/,
      `</p:sldMasterIdLst><p:sldIdLst>${sldIdEntries}</p:sldIdLst>`
    );
  }
  zip.file("ppt/presentation.xml", newPresXml);

  // Update presentation.xml.rels - add slide relationships
  const newRels = slideEntries
    .map(
      (e) =>
        `<Relationship Id="${e.rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${e.slideNum}.xml"/>`
    )
    .join("");

  const newPresRels = presRels.replace(
    "</Relationships>",
    `${newRels}</Relationships>`
  );
  zip.file("ppt/_rels/presentation.xml.rels", newPresRels);

  // Update [Content_Types].xml - add slide and notes content types
  let overrides = slideEntries
    .map(
      (e) =>
        `<Override PartName="/ppt/slides/slide${e.slideNum}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`
    )
    .join("");

  // Add notes slide content types
  const notesOverrides = slideEntries
    .filter((e) => e.hasNotes)
    .map(
      (e) =>
        `<Override PartName="/ppt/notesSlides/notesSlide${e.slideNum}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.notesSlide+xml"/>`
    )
    .join("");

  overrides += notesOverrides;

  const newContentTypes = contentTypes.replace(
    "</Types>",
    `${overrides}</Types>`
  );
  zip.file("[Content_Types].xml", newContentTypes);

  console.log(`[PPTX] Built ${content.slides.length} slides (${notesCount} with notes) from template layouts`);

  const buffer = await zip.generateAsync({ type: "nodebuffer" });
  return buffer as Buffer;
}
