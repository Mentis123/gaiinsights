import { MODEL_OPTIONS } from "./types";
import type { ModelChoice } from "./types";

interface HeaderProps {
  model: ModelChoice;
  templateName?: string | null;
  onChangeTemplate?: () => void;
}

export default function Header({ model, templateName, onChangeTemplate }: HeaderProps) {
  return (
    <header className="flex items-center justify-between mb-12 pt-4 fade-in">
      <div className="flex items-center gap-4">
        <div className="logo-mark logo-sm">
          <div className="logo-mark-inner">
            <span
              className="text-sm font-bold"
              style={{ color: "#0AACDC", fontFamily: "Syne, sans-serif" }}
            >
              G
            </span>
          </div>
          <div className="logo-dot" />
        </div>
        <div>
          <h1
            className="text-lg font-semibold text-white leading-tight"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            Deck Builder
          </h1>
          <p className="text-xs text-muted">
            {templateName || "GAI Insights"}
            {onChangeTemplate && (
              <>
                {" · "}
                <button
                  onClick={onChangeTemplate}
                  className="text-xs hover:underline"
                  style={{ color: "#0AACDC" }}
                >
                  Manage Templates
                </button>
              </>
            )}
          </p>
        </div>
      </div>
      <div className="badge badge-cyan">
        <span className="badge-dot" />
        {MODEL_OPTIONS.find((m) => m.value === model)?.label}
      </div>
    </header>
  );
}
