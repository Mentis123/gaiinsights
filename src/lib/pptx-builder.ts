import Automizer, { modify } from "pptx-automizer";
import * as fs from "fs";
import * as path from "path";

// Source slide mapping: layout name -> slide number (1-based) in gai-source.pptx
// Slide 1: TITLE (layout 0) - opening/closing
// Slide 2: OBJECT (layout 2) - standard content with bullets
// Slide 3: Divider Slide A (layout 5) - section breaks
// Slide 4: 1_Comparison (layout 8) - two-column
// Slide 5: MAIN_POINT (layout 21) - big statement
// Slide 6: TITLE_AND_BODY (layout 20) - title + body variant
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

// Shape name mapping: source slide number -> { placeholder index -> shape name }
const SHAPE_MAP: Record<number, Record<string, string>> = {
  1: { "0": "Title 1", "1": "Subtitle 2" },
  2: { "0": "Title 1", "1": "Text Placeholder 2" },
  3: { "0": "Title 1" },
  4: { "0": "Title 1", "1": "Text Placeholder 2", "2": "Text Placeholder 3" },
  5: { "0": "Title 1" },
  6: { "0": "Title 1", "1": "Text Placeholder 2" },
};

// Tag names used in the source template placeholders
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

export async function buildPresentation(
  content: PresentationContent
): Promise<Buffer> {
  // Read the source template
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

  // Add slides from source template
  for (const slideData of content.slides) {
    const slideNum = LAYOUT_MAP[slideData.layout] || LAYOUT_MAP.content;
    const shapeMap = SHAPE_MAP[slideNum];
    const tagMap = TAG_MAP[slideNum];

    pres.addSlide("source", slideNum, (slide) => {
      for (const [idx, text] of Object.entries(slideData.placeholders)) {
        const shapeName = shapeMap?.[idx];
        const tag = tagMap?.[idx];
        if (shapeName && tag && text) {
          slide.modifyElement(shapeName, [
            modify.replaceText([
              { replace: `{{${tag}}}`, by: { text } },
            ]),
          ]);
        }
      }
    });
  }

  // Output as buffer
  const jszip = await pres.getJSZip();
  const buffer = await jszip.generateAsync({ type: "nodebuffer" });
  return buffer as Buffer;
}
