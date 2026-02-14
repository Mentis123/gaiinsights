# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**GAI Insights Deck Builder** — an AI-powered branded presentation generator evolving into an MVP retail product. Users can either use the default GAI Insights template or upload their own branded .pptx template, auto-discover layouts, workshop them, and generate decks on demand.

## Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run start    # Start production server
```

No test runner or linter is configured.

## Environment Variables

Set in `.env.local` (gitignored):

- `ANTHROPIC_API_KEY` — Required. Claude API key for slide generation.
- `ACCESS_PASSWORD` — Optional. Password for the login gate (defaults to `goteamgaiinsights`).
- `BLOB_READ_WRITE_TOKEN` — Required for custom template uploads. Vercel Blob storage token.

## Architecture

Single-page Next.js 16 app (App Router) with component-based UI and 5 API routes. Vercel Blob for template storage. No database (NeonDB reserved for post-MVP).

### AppState Machine

```
loading → login → studio (optional) → builder
                    ↑                    |
                    └────────────────────┘
                      "Change Template"
```

States: `loading` | `login` | `studio` | `builder`

### Request Flow

1. **Login** — Cookie-based auth via `POST /api/auth`. Sets `gai_auth` httpOnly cookie (7-day expiry).
2. **Template Upload** — `POST /api/templates/upload` receives .pptx, extracts config, stores in Vercel Blob.
3. **Template Config** — `GET/PUT /api/templates/config` reads/updates template config from Blob.
4. **Template Delete** — `DELETE /api/templates` removes custom template from Blob.
5. **Generation** — `POST /api/generate` checks for custom template (Blob), uses dynamic or default system prompt, builds .pptx with appropriate template.

### Key Files

| File | Role |
|------|------|
| `src/app/page.tsx` | Slim orchestrator — AppState machine, lazy-loads StudioScreen, passes template config between screens. |
| `src/components/LoginScreen.tsx` | Login form with password auth. |
| `src/components/StudioScreen.tsx` | Template Studio — upload, workshop layouts, approve. Three sub-phases: upload → workshop → approve. |
| `src/components/BuilderScreen.tsx` | Deck builder — brief textarea, model/slide-count selectors, generation, download. |
| `src/components/TemplateUploader.tsx` | Drag-drop upload zone for .pptx files. |
| `src/components/LayoutPreview.tsx` | SVG wireframe preview of a layout with editable name/rules. |
| `src/components/GeneratingToast.tsx` | Fixed-position progress toast during generation. |
| `src/components/Header.tsx` | App header with logo, model badge, template name. |
| `src/components/types.ts` | Shared UI types (AppState, ModelChoice, MODEL_OPTIONS, PROGRESS_STAGES). |
| `src/lib/types.ts` | Shared data types (TemplateConfig, LayoutConfig, PlaceholderDef, PresentationContent). |
| `src/lib/template-extractor.ts` | PPTX parsing engine — extracts layouts, theme, dimensions from .pptx buffer. Auto-classifies layouts into title/content/divider. |
| `src/lib/prompt-builder.ts` | Dynamic system prompt generation from TemplateConfig. |
| `src/lib/pptx-builder.ts` | Pure JSZip-based PPTX builder. Accepts optional template buffer + layouts param. Falls back to hardcoded GAI defaults. |
| `src/lib/brand.ts` | Brand color constants and default `SLIDE_SYSTEM_PROMPT` (used when no custom template). |
| `src/app/api/generate/route.ts` | Generation endpoint. Checks Blob for custom template, uses dynamic prompt if found. |
| `src/app/api/auth/route.ts` | Password check, sets auth cookie. |
| `src/app/api/templates/upload/route.ts` | Upload endpoint — validates, stores in Blob, extracts config. |
| `src/app/api/templates/config/route.ts` | GET/PUT template config from Blob. |
| `src/app/api/templates/route.ts` | DELETE — removes template from Blob. |
| `public/gai-blank.pptx` | Default branded template (23 layouts, zero slides). |
| `src/app/globals.css` | Full design system including Template Studio styles. |

### PPTX Builder Internals

The builder (`src/lib/pptx-builder.ts`) works by:
1. Loading a template (custom from Blob or default from `public/gai-blank.pptx`) via JSZip
2. For each slide in Claude's JSON, looking up the layout in provided or hardcoded `LAYOUTS` config
3. Extracting placeholder `<p:sp>` shapes from the layout XML and cloning them with new text content
4. Writing slide XML, slide rels, notes slides, and updating `presentation.xml` relationships and `[Content_Types].xml`

Default layouts: `title`, `content`, `divider` (a/b/c variants), `comparison`, `statement`, `title_body`, `title_only`, `one_column`. Aliases: `main_point` → `statement`, `comparison_2` → `comparison`.

### Template Extraction (`template-extractor.ts`)

1. Parses `ppt/presentation.xml` → slide dimensions (EMUs)
2. Parses `ppt/theme/theme1.xml` → color scheme + fonts
3. Lists all `ppt/slideLayouts/*.xml` files
4. Extracts placeholders (type, idx, position) from each layout
5. Auto-classifies into 3 MVP categories: title, content, divider
6. Returns `TemplateConfig` with best match per category

### Vercel Deployment

- `next.config.ts` uses `outputFileTracingIncludes` to bundle `public/gai-blank.pptx` with `/api/generate`
- Dynamic imports in generate route prevent module-level loading issues
- Custom templates stored in Vercel Blob (not filesystem)
- `@vercel/blob` dependency for template storage

## Brand System

Colors: Navy `#001D58`, Cyan `#0AACDC`, Bright Cyan `#00FFFE`, Deep Purple `#43157D`, Magenta `#D200F5`, Lavender `#9B69FF`.

Fonts: **Syne** (headings/display), **Outfit** (body/UI). Both loaded via Google Fonts in `layout.tsx`.

Slides use Arial (PowerPoint compatibility) or custom template fonts.

## The `old/` Directory

Contains the original Python/Streamlit AI news aggregation app (Replit-based). Uses OpenAI, BeautifulSoup, and ReportLab. Excluded from TypeScript compilation via `tsconfig.json`. Not part of the active application — kept for reference only.

## Dashboard Sync

After any significant change to this project:
1. Update `C:\Users\user\Documents\dashboard.html` with current commit hash and status badge
2. Update `C:\Users\user\Documents\GAIInsights\CLAUDE.md` if status/phase changes
