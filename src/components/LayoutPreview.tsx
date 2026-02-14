import type { LayoutConfig } from "@/lib/types";

interface LayoutPreviewProps {
  slug: string;
  layout: LayoutConfig;
  themeColors: Record<string, string>;
  slideWidth: number;
  slideHeight: number;
  onUpdateLabel: (slug: string, label: string) => void;
  onUpdateRules: (slug: string, rules: string) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  title: "T",
  content: "C",
  divider: "D",
};

const CATEGORY_COLORS: Record<string, string> = {
  title: "#0AACDC",
  content: "#9B69FF",
  divider: "#D200F5",
};

export default function LayoutPreview({
  slug,
  layout,
  themeColors,
  slideWidth,
  slideHeight,
  onUpdateLabel,
  onUpdateRules,
}: LayoutPreviewProps) {
  const accentColor = CATEGORY_COLORS[layout.category] || "#0AACDC";

  // SVG dimensions — scale EMUs to a preview viewport
  const svgWidth = 280;
  const svgHeight = Math.round((slideHeight / slideWidth) * svgWidth);
  const scaleX = svgWidth / slideWidth;
  const scaleY = svgHeight / slideHeight;

  // Get a background color from theme (dk1 or fallback)
  const bgColor = themeColors.dk1 || themeColors.dk2 || "#1a1a2e";
  const fgColor = themeColors.lt1 || themeColors.lt2 || "#e0e0e0";
  const accent1 = themeColors.accent1 || accentColor;

  return (
    <div className="layout-preview-card" style={{ "--preview-accent": accentColor } as React.CSSProperties}>
      {/* Category badge */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span
            className="layout-category-badge"
            style={{ background: `${accentColor}20`, color: accentColor }}
          >
            {CATEGORY_ICONS[layout.category] || "?"} {layout.category}
          </span>
          <span className="text-xs text-subtle">{layout.matchingName}</span>
        </div>
        <span className="text-xs text-subtle">{layout.layoutFile}</span>
      </div>

      {/* SVG Wireframe */}
      <div className="layout-preview-svg-wrap">
        <svg
          width={svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="layout-preview-svg"
        >
          {/* Slide background */}
          <rect width={svgWidth} height={svgHeight} fill={bgColor} rx="4" />

          {/* Placeholder shapes */}
          {layout.placeholders.map((ph, i) => {
            if (!ph.position) {
              // No position data — render stacked blocks
              const yOffset = 20 + i * (svgHeight * 0.25);
              const h = svgHeight * 0.2;
              return (
                <g key={i}>
                  <rect
                    x={20}
                    y={yOffset}
                    width={svgWidth - 40}
                    height={h}
                    rx="3"
                    fill={`${accent1}30`}
                    stroke={`${accent1}60`}
                    strokeWidth="1"
                  />
                  <text
                    x={svgWidth / 2}
                    y={yOffset + h / 2 + 4}
                    textAnchor="middle"
                    fill={fgColor}
                    fontSize="10"
                    opacity="0.6"
                  >
                    {ph.phType} [{ph.idx}]
                  </text>
                </g>
              );
            }

            const x = ph.position.x * scaleX;
            const y = ph.position.y * scaleY;
            const w = ph.position.cx * scaleX;
            const h = ph.position.cy * scaleY;

            const isTitle = ph.phType === "ctrTitle" || ph.phType === "title";

            return (
              <g key={i}>
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  rx="2"
                  fill={isTitle ? `${accent1}25` : `${fgColor}10`}
                  stroke={isTitle ? `${accent1}50` : `${fgColor}20`}
                  strokeWidth="1"
                  strokeDasharray={isTitle ? "none" : "4 2"}
                />
                <text
                  x={x + w / 2}
                  y={y + h / 2 + 3}
                  textAnchor="middle"
                  fill={isTitle ? accent1 : fgColor}
                  fontSize="9"
                  opacity="0.7"
                >
                  {ph.phType} [{ph.idx}]
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Editable fields */}
      <div className="mt-4 space-y-3">
        <div>
          <label className="label-uppercase text-muted block mb-1">
            Display Name
          </label>
          <input
            type="text"
            className="studio-input"
            value={layout.userLabel}
            onChange={(e) => onUpdateLabel(slug, e.target.value)}
          />
        </div>
        <div>
          <label className="label-uppercase text-muted block mb-1">
            Rules / Constraints
          </label>
          <textarea
            className="studio-input studio-textarea"
            rows={2}
            placeholder="e.g. Max 6 bullets, use metrics..."
            value={layout.rules || ""}
            onChange={(e) => onUpdateRules(slug, e.target.value)}
          />
        </div>
      </div>

      {/* Placeholder summary */}
      <div className="mt-3">
        <p className="text-xs text-subtle">
          {layout.placeholders.length} placeholder{layout.placeholders.length !== 1 ? "s" : ""}:
          {" "}{layout.placeholders.map((p) => p.phType).join(", ")}
        </p>
      </div>
    </div>
  );
}
