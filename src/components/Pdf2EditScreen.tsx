"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import * as pdfjsLib from "pdfjs-dist";
import type { PDFDocumentProxy } from "pdfjs-dist";

// Set worker source to CDN (avoids bundling issues)
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

// ── Types ──────────────────────────────────────────

interface OcrBlock {
  text: string;
  vertices: { x: number; y: number }[];
}

interface PageData {
  pageNum: number;
  imageDataUrl: string;
  width: number;
  height: number;
}

interface PageOcrResult {
  pageNum: number;
  blocks: OcrBlock[];
}

type Phase = "idle" | "uploading" | "previewing" | "processing" | "done";

// ── Slide dimensions ────────────────────────────────

const SLIDE_WIDTH = 13.33; // inches (LAYOUT_WIDE)
const SLIDE_HEIGHT = 7.5;

// ── Component ───────────────────────────────────────

export default function Pdf2EditScreen() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("");
  const [pages, setPages] = useState<PageData[]>([]);
  const [ocrResults, setOcrResults] = useState<PageOcrResult[]>([]);
  const [progressText, setProgressText] = useState("");
  const [progressPage, setProgressPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState("");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Elapsed timer during processing
  useEffect(() => {
    if (phase === "processing") {
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [phase]);

  // ── PDF Parsing ──────────────────────────────────

  const parsePdf = useCallback(async (file: File) => {
    setPhase("uploading");
    setError("");
    setFileName(file.name);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf: PDFDocumentProxy = await pdfjsLib.getDocument({
        data: arrayBuffer,
      }).promise;

      const numPages = pdf.numPages;
      setTotalPages(numPages);
      const pageDataArr: PageData[] = [];

      for (let i = 1; i <= numPages; i++) {
        setProgressText(`Parsing PDF... Page ${i} of ${numPages}`);
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2 }); // 2x for quality

        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;

        await page.render({ canvasContext: ctx, canvas, viewport }).promise;

        pageDataArr.push({
          pageNum: i,
          imageDataUrl: canvas.toDataURL("image/jpeg", 0.85),
          width: viewport.width,
          height: viewport.height,
        });
      }

      setPages(pageDataArr);
      setPhase("previewing");
      setProgressText("");
    } catch (err) {
      console.error("[pdf2edit] PDF parse error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to parse PDF"
      );
      setPhase("idle");
    }
  }, []);

  // ── OCR + PPTX Generation ────────────────────────

  const handleConvert = useCallback(async () => {
    if (pages.length === 0) return;

    setPhase("processing");
    setError("");
    setOcrResults([]);

    try {
      // Step 1: OCR all pages
      const results: PageOcrResult[] = [];

      for (let i = 0; i < pages.length; i++) {
        setProgressPage(i + 1);
        setProgressText(`OCR: Page ${i + 1} of ${pages.length}...`);

        const res = await fetch("/api/pdf2edit/ocr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: pages[i].imageDataUrl }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(
            data.error || `OCR failed for page ${i + 1} (${res.status})`
          );
        }

        const data = await res.json();
        results.push({ pageNum: i + 1, blocks: data.blocks || [] });
      }

      setOcrResults(results);
      setProgressText("Building PPTX...");

      // Step 2: Build PPTX client-side with pptxgenjs
      const PptxGenJS = (await import("pptxgenjs")).default;
      const pptx = new PptxGenJS();
      pptx.layout = "LAYOUT_WIDE"; // 13.33 x 7.5

      for (let i = 0; i < pages.length; i++) {
        const slide = pptx.addSlide();
        const pageData = pages[i];
        const ocrPage = results[i];

        // Add original page image as background
        slide.addImage({
          data: pageData.imageDataUrl,
          x: 0,
          y: 0,
          w: SLIDE_WIDTH,
          h: SLIDE_HEIGHT,
        });

        // Add editable text boxes at OCR positions
        for (const block of ocrPage.blocks) {
          if (block.vertices.length < 4) continue;

          const v = block.vertices;
          const minX = Math.min(v[0].x, v[3].x);
          const minY = Math.min(v[0].y, v[1].y);
          const maxX = Math.max(v[1].x, v[2].x);
          const maxY = Math.max(v[2].y, v[3].y);

          // Convert pixel coordinates to inches
          const xInches = (minX / pageData.width) * SLIDE_WIDTH;
          const yInches = (minY / pageData.height) * SLIDE_HEIGHT;
          const wInches =
            ((maxX - minX) / pageData.width) * SLIDE_WIDTH;
          const hInches =
            ((maxY - minY) / pageData.height) * SLIDE_HEIGHT;

          // Estimate font size from block height
          const fontPt = Math.min(
            48,
            Math.max(8, Math.round(hInches * 72 * 0.75))
          );

          slide.addText(block.text, {
            x: xInches,
            y: yInches,
            w: Math.max(wInches, 0.5),
            h: Math.max(hInches, 0.2),
            fontSize: fontPt,
            color: "FFFFFF",
            valign: "top",
            wrap: true,
            shrinkText: true,
          });
        }
      }

      // Step 3: Generate and download
      setProgressText("Finalizing download...");
      const pptxBlob = (await pptx.write({ outputType: "blob" })) as Blob;
      const baseName = fileName.replace(/\.pdf$/i, "");
      const outName = `${baseName}_editable.pptx`;

      const url = URL.createObjectURL(pptxBlob);

      // Auto-download
      const a = document.createElement("a");
      a.href = url;
      a.download = outName;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => document.body.removeChild(a), 100);

      setDownloadUrl(url);
      setDownloadName(outName);
      setPhase("done");
      setProgressText("");
    } catch (err) {
      console.error("[pdf2edit] Convert error:", err);
      setError(
        err instanceof Error ? err.message : "Conversion failed"
      );
      setPhase("previewing");
    }
  }, [pages, fileName]);

  // ── File handling ────────────────────────────────

  const handleFile = useCallback(
    (file: File) => {
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        setError("Please upload a PDF file");
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        setError("File too large (max 100MB)");
        return;
      }
      setError("");
      parsePdf(file);
    },
    [parsePdf]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleReset = useCallback(() => {
    setPhase("idle");
    setPages([]);
    setOcrResults([]);
    setError("");
    setDownloadUrl(null);
    setDownloadName("");
    setFileName("");
    setProgressText("");
    setProgressPage(0);
    setTotalPages(0);
  }, []);

  // ── Render ───────────────────────────────────────

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="flex items-center gap-4 mb-10 fade-in">
          <div className="logo-mark logo-sm">
            <div className="logo-mark-inner">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0AACDC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              <div className="logo-dot" />
            </div>
          </div>
          <div>
            <h1 className="heading-display text-xl md:text-2xl">PDF2Edit</h1>
            <p className="text-muted text-xs mt-1">PDF to Editable PPTX Converter</p>
          </div>
          <div className="ml-auto">
            <a
              href="/"
              className="text-muted text-xs hover:text-white transition-colors"
              style={{ textDecoration: "none" }}
            >
              &larr; Deck Builder
            </a>
          </div>
        </header>

        {/* Main card */}
        <div className={`glass-strong rounded-2xl p-8 md:p-10 glow-cyan fade-in fade-in-delay-1${phase === "processing" ? " generating-active" : ""}`}>
          <h2 className="heading-display text-2xl md:text-3xl mb-2">
            Convert PDF to Editable Slides
          </h2>
          <p className="text-muted mb-6 text-sm">
            Drop an image-based PDF. We&apos;ll OCR every page and create an editable PowerPoint with text boxes positioned over the original images.
          </p>

          {/* Error bar */}
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

          {/* Done / Download status */}
          {phase === "done" && (
            <div className="status-bar fade-in mb-6">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0AACDC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span className="status-text">
                Done! &ldquo;{downloadName}&rdquo; has been downloaded.
              </span>
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
              <button
                onClick={handleReset}
                className="btn-primary"
                style={{ padding: "8px 20px", fontSize: "13px", background: "rgba(155, 105, 255, 0.15)", border: "1px solid rgba(155, 105, 255, 0.3)" }}
              >
                <span>Convert Another</span>
              </button>
            </div>
          )}

          {/* ─── Phase: Idle ─── */}
          {phase === "idle" && (
            <div className="fade-in">
              <div
                className={`upload-zone${dragOver ? " upload-zone-active" : ""}`}
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => inputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
                aria-label="Upload PDF file"
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                    e.target.value = "";
                  }}
                  className="hidden"
                />
                <div className="upload-zone-content">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="upload-icon">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                  <p className="text-white font-medium mt-4">
                    Drop your PDF here
                  </p>
                  <p className="text-muted text-sm mt-2">
                    or click to browse &middot; Image-based PDFs work best &middot; Max 100MB
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ─── Phase: Uploading (parsing) ─── */}
          {phase === "uploading" && (
            <div className="fade-in" style={{ textAlign: "center", padding: "48px 0" }}>
              <div className="spinner spinner-lg mb-4" style={{ margin: "0 auto 16px" }} />
              <p className="text-white font-medium">{progressText || "Parsing PDF..."}</p>
              <p className="text-muted text-sm mt-2">{fileName}</p>
            </div>
          )}

          {/* ─── Phase: Previewing ─── */}
          {phase === "previewing" && (
            <div className="fade-in">
              <div className="flex items-center justify-between mb-4">
                <p className="text-muted text-sm">
                  {pages.length} page{pages.length !== 1 ? "s" : ""} detected
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleReset}
                    className="text-muted text-sm hover:text-white transition-colors"
                    style={{ background: "none", border: "none", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "3px" }}
                  >
                    Choose different PDF
                  </button>
                </div>
              </div>

              <div className="pdf-page-grid">
                {pages.map((p) => (
                  <div key={p.pageNum} className="pdf-page-thumb">
                    <img
                      src={p.imageDataUrl}
                      alt={`Page ${p.pageNum}`}
                      style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }}
                    />
                    <span className="pdf-page-num">{p.pageNum}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-center mt-8">
                <button
                  className="btn-primary"
                  onClick={handleConvert}
                >
                  <span className="flex items-center gap-3">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                    Convert to Editable PPTX
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* ─── Phase: Processing (shown inline, toast is separate) ─── */}
          {phase === "processing" && (
            <div className="fade-in" style={{ textAlign: "center", padding: "48px 0" }}>
              <div className="spinner spinner-lg" style={{ margin: "0 auto 16px" }} />
              <p className="text-white font-medium">{progressText}</p>
              <p className="text-muted text-sm mt-2">
                Page {progressPage} of {totalPages}
              </p>
            </div>
          )}
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div
            className="info-card fade-in fade-in-delay-2"
            style={{ "--card-accent": "rgba(10, 172, 220, 0.4)" } as React.CSSProperties}
          >
            <div className="label-uppercase mb-3" style={{ color: "#0AACDC" }}>
              How it works
            </div>
            <p className="text-sm leading-relaxed text-muted">
              Your PDF pages are rendered as images, then Google Cloud Vision OCR detects all text with positions. We overlay editable text boxes on the original images.
            </p>
          </div>

          <div
            className="info-card fade-in fade-in-delay-3"
            style={{ "--card-accent": "rgba(155, 105, 255, 0.4)" } as React.CSSProperties}
          >
            <div className="label-uppercase mb-3" style={{ color: "#9B69FF" }}>
              Editable output
            </div>
            <p className="text-sm leading-relaxed text-muted">
              Open in PowerPoint or Google Slides. Click any text to edit it. The original page images preserve the visual design as backgrounds.
            </p>
          </div>

          <div
            className="info-card fade-in fade-in-delay-4"
            style={{ "--card-accent": "rgba(210, 0, 245, 0.4)" } as React.CSSProperties}
          >
            <div className="label-uppercase mb-3" style={{ color: "#D200F5" }}>
              Privacy first
            </div>
            <p className="text-sm leading-relaxed text-muted">
              PDF rendering happens in your browser. Only page images are sent to Google Vision for OCR. PPTX is built entirely client-side.
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center mt-16 pb-8 text-xs text-subtle">
          GAI Insights PDF2Edit v1.0 &middot; Powered by Google Cloud Vision
        </footer>
      </div>

      {/* Fixed-position processing toast */}
      {phase === "processing" && (
        <>
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes gai-spin { to { transform: rotate(360deg); } }
            @keyframes gai-pulse { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
          `}} />
          <div style={{
            position: "fixed",
            bottom: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9999,
            width: "min(480px, calc(100vw - 32px))",
            background: "rgba(0, 29, 88, 0.95)",
            border: "2px solid rgba(10, 172, 220, 0.6)",
            borderRadius: "16px",
            padding: "24px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 60px rgba(10, 172, 220, 0.15)",
            backdropFilter: "blur(20px)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                border: "3px solid rgba(10, 172, 220, 0.2)",
                borderTopColor: "#0AACDC",
                animation: "gai-spin 1s linear infinite",
                flexShrink: 0,
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  color: "#ffffff",
                  fontSize: "15px",
                  fontWeight: 600,
                  lineHeight: 1.4,
                  margin: 0,
                  animation: "gai-pulse 2s ease-in-out infinite",
                }}>
                  {progressText}
                </p>
                <p style={{
                  color: "rgba(10, 172, 220, 0.8)",
                  fontSize: "12px",
                  fontWeight: 400,
                  margin: "4px 0 0",
                  fontVariantNumeric: "tabular-nums",
                }}>
                  {elapsed}s elapsed
                </p>
              </div>
            </div>
            {/* Progress bar */}
            <div style={{
              marginTop: "14px",
              height: "3px",
              background: "rgba(255, 255, 255, 0.1)",
              borderRadius: "2px",
              overflow: "hidden",
            }}>
              <div style={{
                height: "100%",
                width: `${totalPages > 0 ? (progressPage / totalPages) * 100 : 0}%`,
                background: "linear-gradient(90deg, #0AACDC, #9B69FF, #D200F5)",
                borderRadius: "2px",
                transition: "width 0.5s ease",
              }} />
            </div>
          </div>
        </>
      )}
    </main>
  );
}
