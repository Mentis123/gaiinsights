export type AppState = "loading" | "login" | "studio" | "builder";
export type ModelChoice = "claude-sonnet-4-5-20250929" | "claude-opus-4-6";

export const MODEL_OPTIONS: { value: ModelChoice; label: string }[] = [
  { value: "claude-sonnet-4-5-20250929", label: "Sonnet 4.5" },
  { value: "claude-opus-4-6", label: "Opus 4.6" },
];

export const PROGRESS_STAGES = [
  "Sending brief to Claude...",
  "Claude is architecting your slides...",
  "Structuring content and speaker notes...",
  "Building branded slide layouts...",
  "Rendering your presentation...",
];
