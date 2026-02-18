// ─── PDF2Edit AI Vision Types ────────────────────────

export interface TextElement {
  type: "text";
  text: string;
  x: number; // inches from left
  y: number; // inches from top
  w: number; // width in inches
  h: number; // height in inches
  fontSize: number; // points
  fontFace?: string;
  color: string; // hex without #
  bold?: boolean;
  italic?: boolean;
  align?: "left" | "center" | "right";
  valign?: "top" | "middle" | "bottom";
}

export interface ShapeElement {
  type: "shape";
  shape: "rect" | "roundedRect" | "ellipse";
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string; // hex without #
  borderColor?: string;
  borderWidth?: number;
}

export interface ImageRegion {
  type: "image";
  x: number;
  y: number;
  w: number;
  h: number;
  // Source coordinates in the original image (pixels) for cropping
  srcX: number;
  srcY: number;
  srcW: number;
  srcH: number;
}

export interface LineElement {
  type: "line";
  x: number; // start x in inches
  y: number; // start y in inches
  w: number; // width (dx) in inches
  h: number; // height (dy) in inches
  color: string; // hex without #
  lineWidth?: number; // points
}

export interface SlideAnalysis {
  background: {
    type: "solid" | "gradient" | "image";
    color: string; // dominant/solid color hex without #
  };
  elements: (TextElement | ShapeElement | ImageRegion | LineElement)[];
}

// ─── Claude Vision Prompt ────────────────────────────

export const SLIDE_ANALYSIS_PROMPT = `You are analyzing a presentation slide image. Your job is to describe every visual element on the slide so it can be rebuilt as a native, editable PowerPoint slide.

IMPORTANT RULES:
- The slide dimensions are 13.33 inches wide by 7.5 inches tall (standard widescreen).
- All positions (x, y, w, h) must be in INCHES relative to these dimensions.
- Colors must be 6-digit hex WITHOUT the # prefix (e.g. "FFFFFF" not "#FFFFFF").
- Font sizes in points (pt).
- Be precise with positions - elements should appear where they are in the original.
- Return ONLY valid JSON, no markdown, no code blocks.

For the IMAGE you see, return a JSON object with this structure:

{
  "background": {
    "type": "solid",
    "color": "001D58"
  },
  "elements": [
    {
      "type": "text",
      "text": "The actual text content here",
      "x": 0.5,
      "y": 0.3,
      "w": 12.0,
      "h": 1.2,
      "fontSize": 36,
      "fontFace": "Arial",
      "color": "FFFFFF",
      "bold": true,
      "italic": false,
      "align": "center",
      "valign": "middle"
    },
    {
      "type": "shape",
      "shape": "rect",
      "x": 0,
      "y": 6.5,
      "w": 13.33,
      "h": 1.0,
      "fill": "0AACDC"
    },
    {
      "type": "image",
      "x": 1.0,
      "y": 2.0,
      "w": 4.0,
      "h": 3.0,
      "srcX": 150,
      "srcY": 400,
      "srcW": 600,
      "srcH": 450
    },
    {
      "type": "line",
      "x": 0.5,
      "y": 2.0,
      "w": 12.0,
      "h": 0,
      "color": "CCCCCC",
      "lineWidth": 1
    }
  ]
}

ELEMENT GUIDELINES:

TEXT: Extract ALL text. Group text that belongs together (e.g. a title, a bullet list, a paragraph). For bullet lists, include the bullet characters. Estimate font size from visual size. Use common fonts (Arial, Calibri, etc).

SHAPES: Detect colored rectangles, rounded rectangles, circles/ellipses used as decorative elements, banners, or backgrounds for text. Do NOT create shapes for the slide background itself.

IMAGES: For photos, illustrations, icons, logos, or any non-text non-shape visual content, specify the bounding box on the slide AND the source pixel coordinates (srcX, srcY, srcW, srcH) in the original image for cropping. The original image dimensions will be provided.

LINES: Detect horizontal/vertical separator lines, borders, underlines.

BACKGROUND: Determine the dominant background color. If it's a photo background covering the full slide, set type to "solid" with the dominant edge color, and include an "image" element covering the full slide area.

ORDER: Return elements in z-order (back to front). Shapes first, then images, then text on top.

Be thorough - capture every visible element. Accuracy of positioning matters more than perfection.`;
