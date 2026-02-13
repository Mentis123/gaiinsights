import PptxGenJS from "pptxgenjs";
import { BRAND } from "./brand";

interface SlideData {
  layout: string;
  placeholders: {
    title?: string;
    subtitle?: string;
    body?: string;
    left?: string;
    right?: string;
  };
  notes?: string;
}

interface PresentationContent {
  metadata: {
    title: string;
    subtitle?: string;
    author?: string;
    date?: string;
  };
  slides: SlideData[];
}

function addBrandBar(slide: PptxGenJS.Slide) {
  // Bottom accent bar
  slide.addShape("rect", {
    x: 0,
    y: 7.1,
    w: 13.33,
    h: 0.08,
    fill: { color: BRAND.colors.cyan.replace("#", "") },
  });
}

function addSlideNumber(slide: PptxGenJS.Slide, num: number) {
  slide.addText(String(num), {
    x: 12.5,
    y: 7.0,
    w: 0.5,
    h: 0.4,
    fontSize: 10,
    color: "999999",
    align: "right",
  });
}

export function buildPresentation(content: PresentationContent): PptxGenJS {
  const pptx = new PptxGenJS();

  pptx.layout = "LAYOUT_WIDE";
  pptx.author = content.metadata.author || "GAI Insights";
  pptx.title = content.metadata.title;

  // Define master slides
  pptx.defineSlideMaster({
    title: "GAI_TITLE",
    background: { color: BRAND.colors.navy.replace("#", "") },
    objects: [
      {
        rect: {
          x: 0,
          y: 7.1,
          w: 13.33,
          h: 0.4,
          fill: { color: BRAND.colors.cyan.replace("#", "") },
        },
      },
    ],
  });

  pptx.defineSlideMaster({
    title: "GAI_CONTENT",
    background: { color: "FFFFFF" },
    objects: [
      {
        rect: {
          x: 0,
          y: 0,
          w: 13.33,
          h: 0.06,
          fill: { color: BRAND.colors.navy.replace("#", "") },
        },
      },
      {
        rect: {
          x: 0,
          y: 7.1,
          w: 13.33,
          h: 0.06,
          fill: { color: BRAND.colors.cyan.replace("#", "") },
        },
      },
    ],
  });

  pptx.defineSlideMaster({
    title: "GAI_DIVIDER",
    background: { color: BRAND.colors.deepPurple.replace("#", "") },
    objects: [
      {
        rect: {
          x: 0,
          y: 7.1,
          w: 13.33,
          h: 0.4,
          fill: { color: BRAND.colors.magenta.replace("#", "") },
        },
      },
    ],
  });

  pptx.defineSlideMaster({
    title: "GAI_STATEMENT",
    background: { color: BRAND.colors.navy.replace("#", "") },
    objects: [
      {
        rect: {
          x: 1,
          y: 3.2,
          w: 11.33,
          h: 0.02,
          fill: { color: BRAND.colors.cyan.replace("#", "") },
        },
      },
    ],
  });

  content.slides.forEach((slideData, index) => {
    let slide: PptxGenJS.Slide;

    switch (slideData.layout) {
      case "title": {
        slide = pptx.addSlide({ masterName: "GAI_TITLE" });
        slide.addText(slideData.placeholders.title || "", {
          x: 1,
          y: 2.0,
          w: 11.33,
          h: 1.5,
          fontSize: 40,
          fontFace: BRAND.fonts.heading,
          color: "FFFFFF",
          bold: true,
          align: "left",
          valign: "bottom",
        });
        if (slideData.placeholders.subtitle) {
          slide.addText(slideData.placeholders.subtitle, {
            x: 1,
            y: 3.8,
            w: 11.33,
            h: 0.8,
            fontSize: 20,
            fontFace: BRAND.fonts.body,
            color: BRAND.colors.cyan.replace("#", ""),
            align: "left",
          });
        }
        break;
      }

      case "divider": {
        slide = pptx.addSlide({ masterName: "GAI_DIVIDER" });
        slide.addText(slideData.placeholders.title || "", {
          x: 1,
          y: 2.5,
          w: 11.33,
          h: 2,
          fontSize: 36,
          fontFace: BRAND.fonts.heading,
          color: "FFFFFF",
          bold: true,
          align: "left",
          valign: "middle",
        });
        break;
      }

      case "content": {
        slide = pptx.addSlide({ masterName: "GAI_CONTENT" });
        slide.addText(slideData.placeholders.title || "", {
          x: 0.8,
          y: 0.3,
          w: 11.73,
          h: 0.8,
          fontSize: 28,
          fontFace: BRAND.fonts.heading,
          color: BRAND.colors.navy.replace("#", ""),
          bold: true,
        });
        if (slideData.placeholders.body) {
          const bullets = slideData.placeholders.body
            .split("\n")
            .filter((b) => b.trim())
            .map((text) => ({
              text,
              options: {
                fontSize: 18,
                fontFace: BRAND.fonts.body,
                color: "333333",
                bullet: { code: "2022" as const },
                paraSpaceAfter: 8,
              },
            }));
          slide.addText(bullets, {
            x: 0.8,
            y: 1.4,
            w: 11.73,
            h: 5.2,
            valign: "top",
          });
        }
        addSlideNumber(slide, index + 1);
        break;
      }

      case "comparison": {
        slide = pptx.addSlide({ masterName: "GAI_CONTENT" });
        slide.addText(slideData.placeholders.title || "", {
          x: 0.8,
          y: 0.3,
          w: 11.73,
          h: 0.8,
          fontSize: 28,
          fontFace: BRAND.fonts.heading,
          color: BRAND.colors.navy.replace("#", ""),
          bold: true,
        });
        // Divider line between columns
        slide.addShape("rect", {
          x: 6.6,
          y: 1.5,
          w: 0.02,
          h: 5.0,
          fill: { color: BRAND.colors.cyan.replace("#", "") },
        });
        // Left column
        if (slideData.placeholders.left) {
          const leftBullets = slideData.placeholders.left
            .split("\n")
            .filter((b) => b.trim())
            .map((text) => ({
              text,
              options: {
                fontSize: 16,
                fontFace: BRAND.fonts.body,
                color: "333333",
                bullet: { code: "2022" as const },
                paraSpaceAfter: 6,
              },
            }));
          slide.addText(leftBullets, {
            x: 0.8,
            y: 1.4,
            w: 5.5,
            h: 5.2,
            valign: "top",
          });
        }
        // Right column
        if (slideData.placeholders.right) {
          const rightBullets = slideData.placeholders.right
            .split("\n")
            .filter((b) => b.trim())
            .map((text) => ({
              text,
              options: {
                fontSize: 16,
                fontFace: BRAND.fonts.body,
                color: "333333",
                bullet: { code: "2022" as const },
                paraSpaceAfter: 6,
              },
            }));
          slide.addText(rightBullets, {
            x: 7.0,
            y: 1.4,
            w: 5.5,
            h: 5.2,
            valign: "top",
          });
        }
        addSlideNumber(slide, index + 1);
        break;
      }

      case "statement": {
        slide = pptx.addSlide({ masterName: "GAI_STATEMENT" });
        slide.addText(slideData.placeholders.title || "", {
          x: 1,
          y: 1.5,
          w: 11.33,
          h: 2.5,
          fontSize: 32,
          fontFace: BRAND.fonts.heading,
          color: "FFFFFF",
          bold: true,
          align: "center",
          valign: "bottom",
        });
        break;
      }

      default: {
        slide = pptx.addSlide({ masterName: "GAI_CONTENT" });
        slide.addText(slideData.placeholders.title || "", {
          x: 0.8,
          y: 0.3,
          w: 11.73,
          h: 0.8,
          fontSize: 28,
          fontFace: BRAND.fonts.heading,
          color: BRAND.colors.navy.replace("#", ""),
          bold: true,
        });
        addSlideNumber(slide, index + 1);
      }
    }

    // Speaker notes
    if (slideData.notes) {
      slide.addNotes(slideData.notes);
    }
  });

  return pptx;
}
