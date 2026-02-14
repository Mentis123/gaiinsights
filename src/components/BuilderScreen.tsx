import { useState, useEffect, useRef } from "react";
import Header from "./Header";
import GeneratingToast from "./GeneratingToast";
import { MODEL_OPTIONS, PROGRESS_STAGES } from "./types";
import type { ModelChoice } from "./types";

interface BuilderScreenProps {
  templateName?: string | null;
  onChangeTemplate?: () => void;
}

export default function BuilderScreen({ templateName, onChangeTemplate }: BuilderScreenProps) {
  const [brief, setBrief] = useState("");
  const [slideCount, setSlideCount] = useState("10-15");
  const [model, setModel] = useState<ModelChoice>("claude-sonnet-4-5-20250929");
  const [generating, setGenerating] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [progressStage, setProgressStage] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  // Elapsed timer and progress stages during generation
  useEffect(() => {
    if (generating) {
      setElapsed(0);
      setProgressStage(0);
      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);

      const stageTimers = [8, 18, 28, 38].map((delay, i) =>
        setTimeout(() => setProgressStage(i + 1), delay * 1000)
      );

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
        stageTimers.forEach(clearTimeout);
      };
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [generating]);

  const handleGenerate = async () => {
    if (!brief.trim()) return;

    setGenerating(true);
    setError("");
    setDownloadUrl(null);
    const modelLabel = MODEL_OPTIONS.find((m) => m.value === model)?.label || "Claude";
    setStatus(`Generating slides with ${modelLabel}...`);

    try {
      console.log("[DeckBuilder] Starting generation with model:", model);
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief, slideCount, model }),
      });

      console.log("[DeckBuilder] Response status:", res.status);

      if (!res.ok) {
        let errorMsg = "Generation failed";
        try {
          const data = await res.json();
          errorMsg = data.error || errorMsg;
        } catch {
          errorMsg = `Server error (${res.status})`;
        }
        throw new Error(errorMsg);
      }

      setStatus("Building your deck...");

      const blob = await res.blob();
      console.log("[DeckBuilder] Blob received:", blob.size, "bytes, type:", blob.type);

      if (blob.size === 0) {
        throw new Error("Received empty file from server");
      }

      const url = URL.createObjectURL(blob);
      const disposition = res.headers.get("Content-Disposition");
      const filename =
        disposition?.match(/filename="(.+)"/)?.[1] || "presentation.pptx";

      // Try automatic download
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        document.body.removeChild(a);
      }, 100);

      setDownloadUrl(url);
      setDownloadName(filename);
      setStatus(`Done! "${filename}" has been downloaded.`);
      console.log("[DeckBuilder] Download triggered:", filename);

      setTimeout(() => {
        statusRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 200);
    } catch (err) {
      console.error("[DeckBuilder] Error:", err);
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      setStatus("");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Header
          model={model}
          templateName={templateName}
          onChangeTemplate={onChangeTemplate}
        />

        {/* Main card */}
        <div className={`glass-strong rounded-2xl p-8 md:p-10 glow-cyan fade-in fade-in-delay-1${generating ? " generating-active" : ""}`}>
          <h2 className="heading-display text-2xl md:text-3xl mb-2">
            What are we building?
          </h2>
          <p className="text-muted mb-6 text-sm">
            Describe your presentation. Include audience, key messages, and any
            specific data points.
          </p>

          {/* Done / Download status */}
          {!generating && status && (
            <div ref={statusRef} className="status-bar fade-in mb-6">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#0AACDC"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span className="status-text">{status}</span>
              {downloadUrl && (
                <a
                  href={downloadUrl}
                  download={downloadName}
                  className="btn-primary"
                  style={{ marginLeft: "auto", padding: "8px 20px", fontSize: "13px" }}
                >
                  <span>Download Again</span>
                </a>
              )}
            </div>
          )}

          {error && (
            <div className="error-bar fade-in mb-6" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D200F5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <textarea
            className="brief-input w-full mb-8"
            rows={8}
            placeholder={`Example: "Build a 12-slide deck on the Year of the Agentic AI Builder for enterprise IT leaders at JuiceIT 2026. Cover: Python overtaking JS in 2024, vibe coding becoming mainstream, 41% AI-generated code, the shadow AI risk in enterprise, and why hands-on workshops matter now. End with a CTA for upcoming sessions in Perth, Adelaide, and Brisbane."`}
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            disabled={generating}
            aria-label="Presentation brief"
          />

          {/* Controls row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
            <div className="flex flex-col sm:flex-row gap-6">
              <div>
                <label className="label-uppercase text-muted block mb-3">
                  Slide count
                </label>
                <div className="slide-count">
                  {["5-8", "10-15", "15-25", "25-35"].map((count) => (
                    <button
                      key={count}
                      className={slideCount === count ? "active" : ""}
                      onClick={() => setSlideCount(count)}
                      disabled={generating}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label-uppercase text-muted block mb-3">
                  Model
                </label>
                <div className="slide-count">
                  {MODEL_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      className={model === opt.value ? "active" : ""}
                      onClick={() => setModel(opt.value)}
                      disabled={generating}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              className="btn-primary"
              onClick={handleGenerate}
              disabled={generating || !brief.trim()}
              style={generating ? {
                opacity: 0.7,
                cursor: "not-allowed",
                animation: "gai-btn-pulse 2s ease-in-out infinite",
              } : undefined}
            >
              <span className="flex items-center gap-3">
                {generating ? (
                  <>
                    <span style={{
                      width: "18px",
                      height: "18px",
                      border: "2px solid rgba(255,255,255,0.2)",
                      borderTopColor: "#fff",
                      borderRadius: "50%",
                      animation: "gai-spin 0.7s linear infinite",
                      display: "inline-block",
                    }} />
                    Generating...
                  </>
                ) : (
                  <>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                    Build Deck
                  </>
                )}
              </span>
            </button>
          </div>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div
            className="info-card fade-in fade-in-delay-2"
            style={
              { "--card-accent": "rgba(10, 172, 220, 0.4)" } as React.CSSProperties
            }
          >
            <div className="label-uppercase mb-3" style={{ color: "#0AACDC" }}>
              How it works
            </div>
            <p className="text-sm leading-relaxed text-muted">
              Your brief goes to Claude, which architects the slide
              structure, content, and speaker notes. Then we render it into a
              branded .pptx file.
            </p>
          </div>

          <div
            className="info-card fade-in fade-in-delay-3"
            style={
              { "--card-accent": "rgba(155, 105, 255, 0.4)" } as React.CSSProperties
            }
          >
            <div className="label-uppercase mb-3" style={{ color: "#9B69FF" }}>
              Brand-locked
            </div>
            <p className="text-sm leading-relaxed text-muted">
              {templateName
                ? `Using your custom "${templateName}" template. Layouts, colors, and styling from your brand.`
                : "Every deck uses GAI Insights brand colors, typography, and slide layouts. Navy, cyan, purple. Consistent every time."}
            </p>
          </div>

          <div
            className="info-card fade-in fade-in-delay-4"
            style={
              { "--card-accent": "rgba(210, 0, 245, 0.4)" } as React.CSSProperties
            }
          >
            <div className="label-uppercase mb-3" style={{ color: "#D200F5" }}>
              Editable output
            </div>
            <p className="text-sm leading-relaxed text-muted">
              Download a real .pptx file. Open in PowerPoint or Google Slides.
              Edit anything. Speaker notes included as your talk track.
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center mt-16 pb-8 text-xs text-subtle">
          GAI Insights Deck Builder v2.0 &middot; Powered by Anthropic Claude
        </footer>
      </div>

      {/* Fixed-position generating toast */}
      {generating && (
        <GeneratingToast progressStage={progressStage} elapsed={elapsed} />
      )}
    </main>
  );
}
