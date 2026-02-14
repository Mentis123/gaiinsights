import JSZip from "jszip";
import type { TemplateConfig, LayoutConfig, PlaceholderDef } from "./types";

/**
 * Extract a TemplateConfig from a .pptx buffer.
 * Parses layouts, theme colors/fonts, slide dimensions, and auto-classifies
 * layouts into title/content/divider categories.
 */
export async function extractTemplateConfig(
  buffer: Buffer,
  blobUrl: string
): Promise<Omit<TemplateConfig, "id">> {
  const zip = await JSZip.loadAsync(buffer);

  // 1. Parse slide dimensions from presentation.xml
  const { slideWidth, slideHeight } = await extractSlideDimensions(zip);

  // 2. Parse theme colors and fonts
  const theme = await extractTheme(zip);

  // 3. Extract all layout definitions
  const allLayouts = await extractAllLayouts(zip);

  // 4. Auto-classify into MVP categories and pick best per category
  const layouts = classifyLayouts(allLayouts);

  return {
    version: 1,
    uploadedAt: new Date().toISOString(),
    blobUrl,
    theme,
    layouts,
    slideWidth,
    slideHeight,
  };
}

// ─── Slide Dimensions ────────────────────────────────

async function extractSlideDimensions(zip: JSZip): Promise<{ slideWidth: number; slideHeight: number }> {
  const presXml = await zip.file("ppt/presentation.xml")?.async("text");
  if (!presXml) throw new Error("Missing ppt/presentation.xml — not a valid .pptx");

  // <p:sldSz cx="12192000" cy="6858000"/>  (EMUs)
  const sldSzMatch = presXml.match(/<p:sldSz\s+([^>]*)\/?>/);
  if (!sldSzMatch) {
    return { slideWidth: 12192000, slideHeight: 6858000 }; // Default widescreen
  }

  const attrs = sldSzMatch[1];
  const cxMatch = attrs.match(/cx="(\d+)"/);
  const cyMatch = attrs.match(/cy="(\d+)"/);

  return {
    slideWidth: cxMatch ? parseInt(cxMatch[1]) : 12192000,
    slideHeight: cyMatch ? parseInt(cyMatch[1]) : 6858000,
  };
}

// ─── Theme Extraction ────────────────────────────────

async function extractTheme(zip: JSZip): Promise<TemplateConfig["theme"]> {
  // Find theme file (usually ppt/theme/theme1.xml)
  const themeFiles = Object.keys(zip.files).filter((f) => f.match(/^ppt\/theme\/theme\d+\.xml$/));
  const themeFile = themeFiles[0];

  const defaultTheme: TemplateConfig["theme"] = {
    colors: {},
    majorFont: "Arial",
    minorFont: "Arial",
  };

  if (!themeFile) return defaultTheme;

  const themeXml = await zip.file(themeFile)!.async("text");

  // Extract color scheme
  const clrSchemeMatch = themeXml.match(/<a:clrScheme[^>]*>([\s\S]*?)<\/a:clrScheme>/);
  const colors: Record<string, string> = {};

  if (clrSchemeMatch) {
    const colorNames = ["dk1", "lt1", "dk2", "lt2", "accent1", "accent2", "accent3", "accent4", "accent5", "accent6", "hlink", "folHlink"];
    for (const name of colorNames) {
      // Match <a:dk1><a:srgbClr val="001D58"/></a:dk1>  or  <a:dk1><a:sysClr val="..." lastClr="000000"/></a:dk1>
      const regex = new RegExp(`<a:${name}>([\\s\\S]*?)<\\/a:${name}>`);
      const match = clrSchemeMatch[1].match(regex);
      if (match) {
        const srgbMatch = match[1].match(/val="([0-9A-Fa-f]{6})"/);
        const lastClrMatch = match[1].match(/lastClr="([0-9A-Fa-f]{6})"/);
        const color = srgbMatch?.[1] || lastClrMatch?.[1];
        if (color) colors[name] = `#${color}`;
      }
    }
  }

  // Extract fonts
  const majorFontMatch = themeXml.match(/<a:majorFont>[\s\S]*?<a:latin\s+typeface="([^"]+)"/);
  const minorFontMatch = themeXml.match(/<a:minorFont>[\s\S]*?<a:latin\s+typeface="([^"]+)"/);

  return {
    colors,
    majorFont: majorFontMatch?.[1] || "Arial",
    minorFont: minorFontMatch?.[1] || "Arial",
  };
}

// ─── Layout Extraction ───────────────────────────────

interface RawLayout {
  fileName: string;
  matchingName: string;
  placeholders: PlaceholderDef[];
}

async function extractAllLayouts(zip: JSZip): Promise<RawLayout[]> {
  const layoutFiles = Object.keys(zip.files)
    .filter((f) => f.match(/^ppt\/slideLayouts\/slideLayout\d+\.xml$/))
    .sort((a, b) => {
      const numA = parseInt(a.match(/slideLayout(\d+)/)?.[1] || "0");
      const numB = parseInt(b.match(/slideLayout(\d+)/)?.[1] || "0");
      return numA - numB;
    });

  const layouts: RawLayout[] = [];

  for (const filePath of layoutFiles) {
    const xml = await zip.file(filePath)!.async("text");
    const fileName = filePath.split("/").pop()!;

    // Extract layout name from <p:cSld name="...">
    const nameMatch = xml.match(/<p:cSld\s+name="([^"]+)"/);
    const matchingName = nameMatch?.[1] || fileName.replace(".xml", "");

    // Extract placeholders
    const placeholders = extractPlaceholders(xml);

    layouts.push({ fileName, matchingName, placeholders });
  }

  return layouts;
}

function extractPlaceholders(layoutXml: string): PlaceholderDef[] {
  const placeholders: PlaceholderDef[] = [];
  const spRegex = /<p:sp\b[^>]*>[\s\S]*?<\/p:sp>/g;
  let match;

  while ((match = spRegex.exec(layoutXml)) !== null) {
    const spXml = match[0];

    // Check for placeholder element
    const phMatch = spXml.match(/<p:ph\s+([^/]*?)\/>/);
    if (!phMatch) continue;

    const phAttrs = phMatch[1];
    const typeMatch = phAttrs.match(/type="([^"]+)"/);
    const idxMatch = phAttrs.match(/idx="([^"]+)"/);

    const phType = typeMatch ? typeMatch[1] : "body";
    const phIdx = idxMatch ? parseInt(idxMatch[1]) : undefined;

    // Extract shape name
    const nameMatch = spXml.match(/<p:cNvPr\s+[^>]*name="([^"]+)"/);
    const name = nameMatch?.[1] || `Placeholder ${placeholders.length + 1}`;

    // Extract position (EMUs) from <a:off x="..." y="..."/> and <a:ext cx="..." cy="..."/>
    const offMatch = spXml.match(/<a:off\s+x="(\d+)"\s+y="(\d+)"/);
    const extMatch = spXml.match(/<a:ext\s+cx="(\d+)"\s+cy="(\d+)"/);

    const position = offMatch && extMatch
      ? {
          x: parseInt(offMatch[1]),
          y: parseInt(offMatch[2]),
          cx: parseInt(extMatch[1]),
          cy: parseInt(extMatch[2]),
        }
      : undefined;

    placeholders.push({
      idx: String(placeholders.length),
      phType,
      phIdx,
      name,
      position,
    });
  }

  return placeholders;
}

// ─── Layout Classification ───────────────────────────

function classifyLayouts(rawLayouts: RawLayout[]): Record<string, LayoutConfig> {
  const candidates: Record<string, Array<{ layout: RawLayout; score: number }>> = {
    title: [],
    content: [],
    divider: [],
  };

  for (const layout of rawLayouts) {
    const phs = layout.placeholders;
    const phTypes = phs.map((p) => p.phType);

    // Title candidate: has ctrTitle or (ctrTitle + subTitle)
    if (phTypes.includes("ctrTitle")) {
      const hasSubtitle = phTypes.includes("subTitle");
      const score = hasSubtitle ? 10 : 5; // Prefer title+subtitle combo
      candidates.title.push({ layout, score });
    }

    // Content candidate: has title + body (not ctrTitle)
    if (phTypes.includes("title") && phTypes.includes("body")) {
      // Prefer layouts with exactly title + one body (standard content)
      const bodyCount = phTypes.filter((t) => t === "body").length;
      const score = bodyCount === 1 ? 10 : 7;
      candidates.content.push({ layout, score });
    }

    // Divider candidate: has ctrTitle but NO body/subTitle (section break)
    if (phTypes.includes("ctrTitle") && !phTypes.includes("body") && !phTypes.includes("subTitle")) {
      candidates.divider.push({ layout, score: 5 });
    }
  }

  const result: Record<string, LayoutConfig> = {};

  // Pick best candidate per category
  for (const [category, items] of Object.entries(candidates)) {
    if (items.length === 0) continue;

    // Sort by score descending, take the best
    items.sort((a, b) => b.score - a.score);
    const best = items[0].layout;

    // Re-index placeholders to sequential "0", "1", "2"...
    const reindexed = best.placeholders.map((ph, i) => ({
      ...ph,
      idx: String(i),
    }));

    result[category] = {
      layoutFile: best.fileName,
      matchingName: best.matchingName,
      userLabel: categoryLabel(category),
      category: category as "title" | "content" | "divider",
      placeholders: reindexed,
    };
  }

  // Ensure we have at least a content layout (fallback to first layout with any placeholder)
  if (!result.content && rawLayouts.length > 0) {
    const fallback = rawLayouts.find((l) => l.placeholders.length > 0) || rawLayouts[0];
    result.content = {
      layoutFile: fallback.fileName,
      matchingName: fallback.matchingName,
      userLabel: "Content",
      category: "content",
      placeholders: fallback.placeholders.map((ph, i) => ({ ...ph, idx: String(i) })),
    };
  }

  return result;
}

function categoryLabel(category: string): string {
  switch (category) {
    case "title": return "Title Slide";
    case "content": return "Content";
    case "divider": return "Section Divider";
    default: return category;
  }
}
