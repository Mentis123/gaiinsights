import { useState } from "react";
import TemplateUploader from "./TemplateUploader";
import LayoutPreview from "./LayoutPreview";
import type { TemplateConfig } from "@/lib/types";

type StudioPhase = "upload" | "workshop" | "approve";

interface StudioScreenProps {
  existingConfig: TemplateConfig | null;
  onApprove: (config: TemplateConfig) => void;
  onSkip: () => void;
}

export default function StudioScreen({ existingConfig, onApprove, onSkip }: StudioScreenProps) {
  const [phase, setPhase] = useState<StudioPhase>(existingConfig ? "workshop" : "upload");
  const [config, setConfig] = useState<TemplateConfig | null>(existingConfig);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [brandVoice, setBrandVoice] = useState(existingConfig?.promptOverrides?.brandVoice || "");
  const [saving, setSaving] = useState(false);

  const handleUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pptx")) {
      setUploadError("Please upload a .pptx file (PowerPoint format).");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setUploadError("File too large. Maximum size is 50MB.");
      return;
    }

    setUploading(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/templates/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setConfig(data.config);
      setPhase("workshop");
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateLabel = (slug: string, label: string) => {
    if (!config) return;
    setConfig({
      ...config,
      layouts: {
        ...config.layouts,
        [slug]: { ...config.layouts[slug], userLabel: label },
      },
    });
  };

  const handleUpdateRules = (slug: string, rules: string) => {
    if (!config) return;
    setConfig({
      ...config,
      layouts: {
        ...config.layouts,
        [slug]: { ...config.layouts[slug], rules },
      },
    });
  };

  const handleApprove = async () => {
    if (!config) return;

    setSaving(true);
    try {
      // Save the refined config
      const updatedConfig: TemplateConfig = {
        ...config,
        promptOverrides: {
          ...config.promptOverrides,
          brandVoice: brandVoice.trim() || undefined,
        },
      };

      const res = await fetch("/api/templates/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedConfig),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Save failed");
      }

      const data = await res.json();
      onApprove(data.config);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveTemplate = async () => {
    try {
      await fetch("/api/templates", { method: "DELETE" });
      setConfig(null);
      setPhase("upload");
      setBrandVoice("");
    } catch {
      // Silently fail
    }
  };

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
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
                Template Studio
              </h1>
              <p className="text-xs text-muted">Upload &amp; customize your brand template</p>
            </div>
          </div>
          <button
            className="text-sm text-muted hover:text-white transition-colors"
            onClick={onSkip}
          >
            Skip &rarr; Use Default
          </button>
        </header>

        {/* Phase: Upload */}
        {phase === "upload" && (
          <div className="glass-strong rounded-2xl p-8 md:p-10 glow-purple fade-in">
            <h2 className="heading-display text-2xl md:text-3xl mb-2">
              Upload Your Template
            </h2>
            <p className="text-muted mb-8 text-sm">
              Upload your branded PowerPoint template (.pptx). We&apos;ll auto-discover
              your layouts, colors, and fonts.
            </p>
            <TemplateUploader
              onUpload={handleUpload}
              uploading={uploading}
              error={uploadError}
            />
          </div>
        )}

        {/* Phase: Workshop */}
        {phase === "workshop" && config && (
          <div className="fade-in">
            <div className="glass-strong rounded-2xl p-8 md:p-10 glow-cyan mb-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="heading-display text-2xl md:text-3xl mb-2">
                    Workshop Your Layouts
                  </h2>
                  <p className="text-muted text-sm">
                    We found {Object.keys(config.layouts).length} layouts in your template. Rename them, set rules, and customize.
                  </p>
                </div>
                <button
                  onClick={handleRemoveTemplate}
                  className="text-xs text-muted hover:text-white transition-colors"
                  title="Remove template and start over"
                >
                  Remove Template
                </button>
              </div>

              {/* Theme info */}
              <div className="studio-theme-bar mb-8">
                <div className="flex items-center gap-3">
                  <span className="label-uppercase text-muted">Theme Colors</span>
                  <div className="flex gap-1">
                    {Object.entries(config.theme.colors).slice(0, 8).map(([name, color]) => (
                      <div
                        key={name}
                        className="studio-color-swatch"
                        style={{ background: color }}
                        title={`${name}: ${color}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-6 mt-2">
                  <span className="text-xs text-subtle">
                    Heading: <strong className="text-white">{config.theme.majorFont}</strong>
                  </span>
                  <span className="text-xs text-subtle">
                    Body: <strong className="text-white">{config.theme.minorFont}</strong>
                  </span>
                  <span className="text-xs text-subtle">
                    {Math.round(config.slideWidth / 914400)}&quot; &times; {Math.round(config.slideHeight / 914400)}&quot;
                  </span>
                </div>
              </div>

              {/* Layout cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.entries(config.layouts).map(([slug, layout]) => (
                  <LayoutPreview
                    key={slug}
                    slug={slug}
                    layout={layout}
                    themeColors={config.theme.colors}
                    slideWidth={config.slideWidth}
                    slideHeight={config.slideHeight}
                    onUpdateLabel={handleUpdateLabel}
                    onUpdateRules={handleUpdateRules}
                  />
                ))}
              </div>
            </div>

            {/* Brand voice override */}
            <div className="glass-strong rounded-2xl p-8 md:p-10 glow-purple mb-8 fade-in">
              <h3 className="heading-section text-lg text-white mb-2">Brand Voice</h3>
              <p className="text-muted text-sm mb-4">
                Optional. Describe how your presentations should sound. This overrides the default consulting tone.
              </p>
              <textarea
                className="studio-input studio-textarea w-full"
                rows={3}
                placeholder="e.g. Warm and approachable. Use plain language, avoid jargon. Data-driven but empathetic."
                value={brandVoice}
                onChange={(e) => setBrandVoice(e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <button
                className="text-sm text-muted hover:text-white transition-colors"
                onClick={() => setPhase("upload")}
              >
                &larr; Upload Different Template
              </button>
              <button
                className="btn-primary"
                onClick={handleApprove}
                disabled={saving}
              >
                <span className="flex items-center gap-3">
                  {saving ? (
                    <>
                      <span className="spinner" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Approve &amp; Build
                    </>
                  )}
                </span>
              </button>
            </div>

            {uploadError && (
              <div className="error-bar fade-in mt-4" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D200F5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {uploadError}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <footer className="text-center mt-16 pb-8 text-xs text-subtle">
          Template Studio &middot; GAI Insights Deck Builder v2.0
        </footer>
      </div>
    </main>
  );
}
