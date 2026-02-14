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

function textToParagraphs(text: string, isBody: boolean = false): string {
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length === 0) return "<a:p><a:endParaRPr/></a:p>";
  return lines
    .map((line, i) => {
      // Add space before first body paragraph to push text down from title
      const spcBef = (isBody && i === 0) ? '<a:pPr><a:spcBef><a:spcPts val="800"/></a:spcBef></a:pPr>' : '';
      return `<a:p>${spcBef}<a:r><a:t>${escapeXml(line)}</a:t></a:r></a:p>`;
    })
    .join("");
}

/**
 * Extract placeholder position from layout XML shape.
 * Returns position {x, y, cx, cy} or null if not found.
 */
function extractShapePosition(shapeXml: string): { x: string; y: string; cx: string; cy: string } | null {
  const offMatch = shapeXml.match(/<a:off\s+x="(\d+)"\s+y="(\d+)"/);
  const extMatch = shapeXml.match(/<a:ext\s+cx="(\d+)"\s+cy="(\d+)"/);
  if (offMatch && extMatch) {
    return { x: offMatch[1], y: offMatch[2], cx: extMatch[1], cy: extMatch[2] };
  }
  return null;
}

/**
 * Extract placeholder shapes from layout XML.
 * Returns a map of "phType:phIdx" -> full <p:sp>...</p:sp> XML string.
 */
function extractPlaceholderShapes(layoutXml: string): Map<string, string> {
  const shapes = new Map<string, string>();
  const spRegex = /<p:sp\b[^>]*>[\s\S]*?<\/p:sp>/g;
  let match;
  while ((match = spRegex.exec(layoutXml)) !== null) {
    const spXml = match[0];
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
 * Build a clean placeholder shape using position from the layout shape.
 * Avoids cloning potentially broken relationship references (r:embed, r:link etc.)
 * from the layout shape. PowerPoint will inherit formatting from the layout via
 * the placeholder type/idx reference.
 */
function buildCleanShape(
  shapeId: number,
  ph: { phType: string; phIdx?: number; name: string },
  text: string,
  layoutShape: string | undefined
): string {
  const idxAttr = ph.phIdx !== undefined ? ` idx="${ph.phIdx}"` : "";
  const isBody = ph.phType === "body" || ph.phType === "subTitle";
  const paragraphs = text
    ? textToParagraphs(text, isBody)
    : "<a:p><a:endParaRPr/></a:p>";

  // Extract position from layout shape if available
  let spPr = "<p:spPr/>";
  if (layoutShape) {
    const pos = extractShapePosition(layoutShape);
    if (pos) {
      spPr = `<p:spPr><a:xfrm><a:off x="${pos.x}" y="${pos.y}"/><a:ext cx="${pos.cx}" cy="${pos.cy}"/></a:xfrm></p:spPr>`;
    }
  }

  return `<p:sp><p:nvSpPr><p:cNvPr id="${shapeId}" name="${ph.name}"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="${ph.phType}"${idxAttr}/></p:nvPr></p:nvSpPr>${spPr}<p:txBody><a:bodyPr/><a:lstStyle/>${paragraphs}</p:txBody></p:sp>`;
}

/**
 * Build slide XML using clean shapes with positions from the layout.
 */
function buildSlideXml(
  layout: BuilderLayoutConfig,
  placeholders: Record<string, string>,
  layoutXml: string | null
): string {
  let shapes = "";
  let shapeId = 2;

  const layoutShapes = layoutXml ? extractPlaceholderShapes(layoutXml) : new Map<string, string>();

  for (const ph of layout.placeholders) {
    const text = placeholders[ph.idx] || "";
    const phIdx = ph.phIdx !== undefined ? String(ph.phIdx) : "0";
    const lookupKey = `${ph.phType}:${phIdx}`;

    const layoutShape = layoutShapes.get(lookupKey);
    shapes += buildCleanShape(shapeId, ph, text, layoutShape);
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

/**
 * Remove any existing slides, notes slides, and their rels/content-type entries
 * from a template zip. This ensures a clean slate before injecting new slides,
 * which is critical when the uploaded template has sample slides in it.
 */
function cleanExistingSlides(zip: JSZip, presRels: string, contentTypes: string): { presRels: string; contentTypes: string } {
  // Remove existing slide files and their rels
  const slideFiles = Object.keys(zip.files).filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f));
  for (const f of slideFiles) {
    zip.remove(f);
    const relsPath = f.replace("slides/", "slides/_rels/") + ".rels";
    if (zip.files[relsPath]) zip.remove(relsPath);
  }

  // Remove existing notes slide files and their rels
  const notesFiles = Object.keys(zip.files).filter((f) => /^ppt\/notesSlides\/notesSlide\d+\.xml$/.test(f));
  for (const f of notesFiles) {
    zip.remove(f);
    const relsPath = f.replace("notesSlides/", "notesSlides/_rels/") + ".rels";
    if (zip.files[relsPath]) zip.remove(relsPath);
  }

  // Strip existing slide relationship entries from presentation.xml.rels
  const cleanedRels = presRels.replace(
    /<Relationship[^>]*Type="http:\/\/schemas\.openxmlformats\.org\/officeDocument\/2006\/relationships\/slide"[^>]*\/>/g,
    ""
  );

  // Strip existing slide and notes content type overrides
  let cleanedCT = contentTypes.replace(
    /<Override\s+PartName="\/ppt\/slides\/slide\d+\.xml"[^/]*\/>/g,
    ""
  );
  cleanedCT = cleanedCT.replace(
    /<Override\s+PartName="\/ppt\/notesSlides\/notesSlide\d+\.xml"[^/]*\/>/g,
    ""
  );

  return { presRels: cleanedRels, contentTypes: cleanedCT };
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

  // Read current presentation.xml.rels and [Content_Types].xml
  let presRels = await zip.file("ppt/_rels/presentation.xml.rels")!.async("text");
  let contentTypes = await zip.file("[Content_Types].xml")!.async("text");

  // Clean up existing slides from template (critical for uploaded templates with sample slides)
  const cleaned = cleanExistingSlides(zip, presRels, contentTypes);
  presRels = cleaned.presRels;
  contentTypes = cleaned.contentTypes;

  // Pre-read layout XMLs for position extraction (cache to avoid reading same layout twice)
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

  // Find the highest existing rId in (cleaned) presentation.xml.rels
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
  let nextSldId = 256;
  let notesCount = 0;

  for (let i = 0; i < content.slides.length; i++) {
    const slideData = content.slides[i];
    const layoutName = slideData.layout || "content";
    const layout = activeLayouts[layoutName] || activeLayouts.content;
    const slideNum = i + 1;
    const rId = `rId${nextRId}`;
    const hasNotes = !!(slideData.notes && slideData.notes.trim());

    const layoutXml = layoutXmlCache.get(layout.layoutFile) || null;

    const slideXml = buildSlideXml(layout, slideData.placeholders, layoutXml);
    zip.file(`ppt/slides/slide${slideNum}.xml`, slideXml);

    const slideRels = buildSlideRelsXml(
      layout.layoutFile,
      hasNotes ? slideNum : undefined
    );
    zip.file(`ppt/slides/_rels/slide${slideNum}.xml.rels`, slideRels);

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

  // Update presentation.xml - replace sldIdLst with our slides only
  const sldIdEntries = slideEntries
    .map((e) => `<p:sldId id="${e.sldId}" r:id="${e.rId}"/>`)
    .join("");

  let newPresXml: string;
  if (presXml.includes("<p:sldIdLst/>")) {
    newPresXml = presXml.replace(
      "<p:sldIdLst/>",
      `<p:sldIdLst>${sldIdEntries}</p:sldIdLst>`
    );
  } else if (presXml.includes("<p:sldIdLst>")) {
    newPresXml = presXml.replace(
      /<p:sldIdLst>[\s\S]*?<\/p:sldIdLst>/,
      `<p:sldIdLst>${sldIdEntries}</p:sldIdLst>`
    );
  } else {
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
