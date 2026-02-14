import JSZip from "jszip";
import * as fs from "fs";
import * as path from "path";

// Layout config: name -> { layoutFile, placeholders }
// layoutFile maps to slideLayout(N+1).xml where N is the 0-based layout index
const LAYOUTS: Record<
  string,
  {
    layoutFile: string;
    placeholders: Array<{
      idx: string; // placeholder index from JSON ("0", "1", "2")
      phType: string; // OOXML placeholder type
      phIdx?: number; // OOXML idx attribute (omit for idx=0)
      name: string; // shape name
    }>;
  }
> = {
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
};

// Aliases
LAYOUTS.divider_a = LAYOUTS.divider;
LAYOUTS.comparison_2 = LAYOUTS.comparison;
LAYOUTS.main_point = LAYOUTS.statement;

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

function textToParagraphs(text: string): string {
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length === 0) return "<a:p><a:endParaRPr/></a:p>";
  return lines
    .map((line) => `<a:p><a:r><a:t>${escapeXml(line)}</a:t></a:r></a:p>`)
    .join("");
}

function buildSlideXml(
  layout: (typeof LAYOUTS)[string],
  placeholders: Record<string, string>
): string {
  let shapes = "";
  let shapeId = 2;

  for (const ph of layout.placeholders) {
    const text = placeholders[ph.idx] || "";
    const idxAttr = ph.phIdx !== undefined ? ` idx="${ph.phIdx}"` : "";
    const paragraphs = text
      ? textToParagraphs(text)
      : "<a:p><a:endParaRPr/></a:p>";

    shapes += `<p:sp><p:nvSpPr><p:cNvPr id="${shapeId}" name="${ph.name}"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="${ph.phType}"${idxAttr}/></p:nvPr></p:nvSpPr><p:spPr/><p:txBody><a:bodyPr/><a:lstStyle/>${paragraphs}</p:txBody></p:sp>`;
    shapeId++;
  }

  return `<?xml version='1.0' encoding='UTF-8' standalone='yes'?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/>${shapes}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`;
}

function buildSlideRelsXml(layoutFile: string): string {
  return `<?xml version='1.0' encoding='UTF-8' standalone='yes'?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/${layoutFile}"/></Relationships>`;
}

export async function buildPresentation(
  content: PresentationContent
): Promise<Buffer> {
  // Load blank template (0 slides, all layouts/masters intact)
  const templatePath = path.join(process.cwd(), "public", "gai-blank.pptx");
  const templateBuffer = fs.readFileSync(templatePath);
  const zip = await JSZip.loadAsync(templateBuffer);

  // Read current presentation.xml
  const presXml = await zip.file("ppt/presentation.xml")!.async("text");

  // Read current presentation.xml.rels
  const presRels = await zip.file("ppt/_rels/presentation.xml.rels")!.async("text");

  // Read [Content_Types].xml
  const contentTypes = await zip.file("[Content_Types].xml")!.async("text");

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
  }> = [];

  let nextRId = maxRId + 1;
  let nextSldId = 256; // Standard starting slide ID

  for (let i = 0; i < content.slides.length; i++) {
    const slideData = content.slides[i];
    const layoutName = slideData.layout || "content";
    const layout = LAYOUTS[layoutName] || LAYOUTS.content;
    const slideNum = i + 1;
    const rId = `rId${nextRId}`;

    // Create slide XML
    const slideXml = buildSlideXml(layout, slideData.placeholders);
    zip.file(`ppt/slides/slide${slideNum}.xml`, slideXml);

    // Create slide rels
    const slideRels = buildSlideRelsXml(layout.layoutFile);
    zip.file(`ppt/slides/_rels/slide${slideNum}.xml.rels`, slideRels);

    slideEntries.push({ slideNum, rId, sldId: nextSldId });
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

  // Update [Content_Types].xml - add slide content types
  const slideOverrides = slideEntries
    .map(
      (e) =>
        `<Override PartName="/ppt/slides/slide${e.slideNum}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`
    )
    .join("");

  const newContentTypes = contentTypes.replace(
    "</Types>",
    `${slideOverrides}</Types>`
  );
  zip.file("[Content_Types].xml", newContentTypes);

  console.log(`[PPTX] Built ${content.slides.length} slides from template layouts`);

  const buffer = await zip.generateAsync({ type: "nodebuffer" });
  return buffer as Buffer;
}
