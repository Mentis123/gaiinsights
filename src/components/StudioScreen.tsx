import { useState } from "react";
import TemplateUploader from "./TemplateUploader";
import LayoutPreview from "./LayoutPreview";
import type { TemplateConfig, TemplateLibrary } from "@/lib/types";

type StudioPhase = "select" | "upload" | "workshop";

interface StudioScreenProps {
  library: TemplateLibrary;
  onSelect: (library: TemplateLibrary) => void;
  onApprove: (config: TemplateConfig, library?: TemplateLibrary) => void;
  onBack: () => void;
}

export default function StudioScreen({ library, onSelect, onApprove, onBack }: StudioScreenProps) {
  // Always start at selection — that's where tiles live
  const [phase, setPhase] = useState<StudioPhase>("select");
  const [editingConfig, setEditingConfig] = useState<TemplateConfig | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [brandVoice, setBrandVoice] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [templates, setTemplates] = useState(library.templates);

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
      const { upload } = await import("@vercel/blob/client");
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/templates/upload",
      });

      const res = await fetch("/api/templates/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blobUrl: blob.url }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Extraction failed");
      }

      // Update local templates list
      if (data.library) {
        setTemplates(data.library.templates);
      }

      // Pre-fill name from filename
      const fileName = file.name.replace(/\.pptx$/i, "").replace(/[-_]/g, " ");
      setEditingConfig(data.config);
      setTemplateName(data.config.name || fileName);
      setBrandVoice(data.config.promptOverrides?.brandVoice || "");
      setPhase("workshop");
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (config: TemplateConfig) => {
    setEditingConfig(config);
    setTemplateName(config.name || "");
    setBrandVoice(config.promptOverrides?.brandVoice || "");
    setUploadError("");
    setPhase("workshop");
  };

  const handleSelectDefault = async () => {
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activeId: null }),
      });
      if (res.ok) {
        const data = await res.json();
        onSelect(data.library);
      }
    } catch {
      onSelect({ ...library, activeId: null });
    }
  };

  const handleSelectTemplate = async (id: string) => {
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activeId: id }),
      });
      if (res.ok) {
        const data = await res.json();
        onSelect(data.library);
      }
    } catch {
      onSelect({ ...library, activeId: id });
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleting(id);
    try {
      const res = await fetch(`/api/templates?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.library.templates);
      } else {
        setTemplates((prev) => prev.filter((t) => t.id !== id));
      }
    } catch {
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } finally {
      setDeleting(null);
    }
  };

  const handleEditClick = (config: TemplateConfig, e: React.MouseEvent) => {
    e.stopPropagation();
    handleEdit(config);
  };

  const handleUpdateLabel = (slug: string, label: string) => {
    if (!editingConfig) return;
    setEditingConfig({
      ...editingConfig,
      layouts: {
        ...editingConfig.layouts,
        [slug]: { ...editingConfig.layouts[slug], userLabel: label },
      },
    });
  };

  const handleUpdateRules = (slug: string, rules: string) => {
    if (!editingConfig) return;
    setEditingConfig({
      ...editingConfig,
      layouts: {
        ...editingConfig.layouts,
        [slug]: { ...editingConfig.layouts[slug], rules },
      },
    });
  };

  const handleApprove = async () => {
    if (!editingConfig) return;

    setSaving(true);
    try {
      const updatedConfig: TemplateConfig = {
        ...editingConfig,
        name: templateName.trim() || undefined,
        promptOverrides: {
          ...editingConfig.promptOverrides,
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

      // Also set this as active
      const selectRes = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activeId: data.config.id }),
      });

      if (selectRes.ok) {
        const selectData = await selectRes.json();
        onApprove(data.config, selectData.library);
      } else {
        onApprove(data.config);
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const getDisplayName = (config: TemplateConfig): string => {
    if (config.name) return config.name;
    const match = config.blobUrl.match(/\/([^/]+)\.pptx/);
    if (match) return match[1].replace(/-/g, " ");
    return "Custom Template";
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
              <p className="text-xs text-muted">Manage &amp; customize your brand templates</p>
            </div>
          </div>
          <button
            className="text-sm text-muted hover:text-white transition-colors"
            onClick={onBack}
          >
            &larr; Back to Builder
          </button>
        </header>

        {/* Phase: Select Template */}
        {phase === "select" && (
          <div className="fade-in">
            <div className="glass-strong rounded-2xl p-8 md:p-10 glow-cyan mb-8">
              <h2 className="heading-display text-2xl md:text-3xl mb-2">
                Choose Your Template
              </h2>
              <p className="text-muted text-sm mb-8">
                Select a template for your presentations, or upload a new one.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* GAI Insights Default */}
                <button
                  className={`studio-template-card${library.activeId === null ? " studio-template-card-active" : ""}`}
                  onClick={handleSelectDefault}
                >
                  <div className="studio-template-card-icon" style={{ background: "linear-gradient(135deg, #001D58, #0AACDC)" }}>
                    <span style={{ fontSize: "24px", fontFamily: "Syne, sans-serif", fontWeight: 700, color: "#0AACDC" }}>G</span>
                  </div>
                  <div className="studio-template-card-name">GAI Insights</div>
                  <div className="studio-template-card-desc">
                    Default branded template with navy, cyan, and purple theme
                    {library.activeId === null && (
                      <span className="studio-template-card-badge">Active</span>
                    )}
                  </div>
                </button>

                {/* User's uploaded templates */}
                {templates.map((tpl) => (
                  <div key={tpl.id} className="studio-template-card-wrapper">
                    <button
                      className={`studio-template-card${library.activeId === tpl.id ? " studio-template-card-active" : ""}`}
                      onClick={() => handleSelectTemplate(tpl.id)}
                    >
                      <div className="studio-template-card-icon" style={{ background: "linear-gradient(135deg, #43157D, #D200F5)" }}>
                        <div className="flex gap-0.5">
                          {Object.values(tpl.theme.colors).slice(0, 4).map((color, i) => (
                            <div key={i} style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
                          ))}
                        </div>
                      </div>
                      <div className="studio-template-card-name">{getDisplayName(tpl)}</div>
                      <div className="studio-template-card-desc">
                        {Object.keys(tpl.layouts).length} layouts &middot; {tpl.theme.majorFont}
                        {library.activeId === tpl.id && (
                          <span className="studio-template-card-badge">Active</span>
                        )}
                      </div>
                    </button>
                    <div className="studio-template-card-actions">
                      <button
                        className="studio-card-action-btn"
                        onClick={(e) => handleEditClick(tpl, e)}
                        title="Edit template settings"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        Edit
                      </button>
                      <button
                        className="studio-card-action-btn studio-card-action-btn-danger"
                        onClick={(e) => handleDelete(tpl.id, e)}
                        disabled={deleting === tpl.id}
                        title="Delete template"
                      >
                        {deleting === tpl.id ? (
                          <span className="spinner" style={{ width: 14, height: 14 }} />
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        )}
                        Delete
                      </button>
                    </div>
                  </div>
                ))}

                {/* Upload New */}
                <button
                  className="studio-template-card studio-template-card-upload"
                  onClick={() => {
                    setEditingConfig(null);
                    setTemplateName("");
                    setBrandVoice("");
                    setUploadError("");
                    setPhase("upload");
                  }}
                >
                  <div className="studio-template-card-icon" style={{ background: "rgba(255,255,255,0.05)", border: "2px dashed rgba(255,255,255,0.15)" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                  <div className="studio-template-card-name">Upload New</div>
                  <div className="studio-template-card-desc">Upload a .pptx file to auto-discover layouts and branding</div>
                </button>
              </div>
            </div>
          </div>
        )}

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
            <button
              className="text-sm text-muted hover:text-white transition-colors mt-6"
              onClick={() => setPhase("select")}
            >
              &larr; Back to Templates
            </button>
          </div>
        )}

        {/* Phase: Workshop */}
        {phase === "workshop" && editingConfig && (
          <div className="fade-in">
            <div className="glass-strong rounded-2xl p-8 md:p-10 glow-cyan mb-8">
              <h2 className="heading-display text-2xl md:text-3xl mb-2">
                Workshop Your Layouts
              </h2>
              <p className="text-muted text-sm mb-6">
                We found {Object.keys(editingConfig.layouts).length} layouts in your template. Rename them, set rules, and customize.
              </p>

              {/* Template name */}
              <div className="mb-6">
                <label className="label-uppercase text-muted block mb-2">Template Name</label>
                <input
                  type="text"
                  className="studio-input w-full"
                  placeholder="e.g. Acme Corp Brand Deck"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  style={{ maxWidth: 400 }}
                />
              </div>

              {/* Theme info */}
              <div className="studio-theme-bar mb-8">
                <div className="flex items-center gap-3">
                  <span className="label-uppercase text-muted">Theme Colors</span>
                  <div className="flex gap-1">
                    {Object.entries(editingConfig.theme.colors).slice(0, 8).map(([name, color]) => (
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
                    Heading: <strong className="text-white">{editingConfig.theme.majorFont}</strong>
                  </span>
                  <span className="text-xs text-subtle">
                    Body: <strong className="text-white">{editingConfig.theme.minorFont}</strong>
                  </span>
                  <span className="text-xs text-subtle">
                    {Math.round(editingConfig.slideWidth / 914400)}&quot; &times; {Math.round(editingConfig.slideHeight / 914400)}&quot;
                  </span>
                </div>
              </div>

              {/* Layout cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.entries(editingConfig.layouts).map(([slug, layout]) => (
                  <LayoutPreview
                    key={slug}
                    slug={slug}
                    layout={layout}
                    themeColors={editingConfig.theme.colors}
                    slideWidth={editingConfig.slideWidth}
                    slideHeight={editingConfig.slideHeight}
                    onUpdateLabel={handleUpdateLabel}
                    onUpdateRules={handleUpdateRules}
                  />
                ))}
              </div>

              {/* Preservation note */}
              <div className="studio-preservation-note mt-6">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0AACDC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <p className="text-xs text-subtle">
                  These wireframes show placeholder positions only. Background images, master slide graphics,
                  embedded media, and all visual styling from your template are fully preserved in the generated .pptx output.
                </p>
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
                onClick={() => setPhase("select")}
              >
                &larr; Back to Templates
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
                      Save &amp; Use Template
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
