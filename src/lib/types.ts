// Shared type definitions for GAI Insights Deck Builder

// ─── Template Config ─────────────────────────────────

export interface PlaceholderDef {
  idx: string;
  phType: string;
  phIdx?: number;
  name: string;
  position?: { x: number; y: number; cx: number; cy: number }; // EMUs for wireframe
}

export interface LayoutConfig {
  layoutFile: string;
  matchingName: string;
  userLabel: string;
  category: "title" | "content" | "divider";
  placeholders: PlaceholderDef[];
  rules?: string;
}

export interface TemplateConfig {
  version: 1;
  name?: string;
  uploadedAt: string;
  blobUrl: string;
  theme: {
    colors: Record<string, string>;
    majorFont: string;
    minorFont: string;
  };
  layouts: Record<string, LayoutConfig>;
  promptOverrides?: {
    brandVoice?: string;
    additionalRules?: string;
  };
  slideWidth: number;
  slideHeight: number;
}

// ─── PPTX Builder Types ──────────────────────────────

export interface SlideData {
  layout: string;
  placeholders: Record<string, string>;
  notes?: string;
}

export interface PresentationContent {
  metadata: {
    title: string;
    author?: string;
    date?: string;
  };
  slides: SlideData[];
}

// ─── API Types ───────────────────────────────────────

export interface UploadResponse {
  success: boolean;
  config?: TemplateConfig;
  error?: string;
}

export interface ConfigResponse {
  success: boolean;
  config?: TemplateConfig;
  error?: string;
}
