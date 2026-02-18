"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import * as pdfjsLib from "pdfjs-dist";
import type { PDFDocumentProxy } from "pdfjs-dist";
import type {
  SlideAnalysis,
  TextElement,
  ShapeElement,
  ImageRegion,
  LineElement,
} from "@/lib/pdf2edit-types";

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
type ConversionMode = "vision" | "ocr";
type ModelChoice = "claude-sonnet-4-6" | "claude-sonnet-4-5-20250929" | "claude-opus-4-6";

// ── Slide dimensions ────────────────────────────────

const SLIDE_WIDTH = 13.33; // inches (LAYOUT_WIDE)
const SLIDE_HEIGHT = 7.5;

// ── Nano Banana Pro Prompt ───────────────────────────

const CLEAN_BG_PROMPT = `Remove ALL text from this presentation slide image. This includes:
- Titles, subtitles, headings
- Body text, bullet points, captions
- Labels, annotations, watermarks
- Any and all readable characters

KEEP everything else exactly as-is:
- Background colors, gradients, and patterns
- Photos, illustrations, icons, and logos
- Decorative shapes, lines, and borders
- Any non-text visual elements

Return the cleaned image at the same resolution.`;

// ── Image Cropping Utility ──────────────────────────

async function cropImageRegion(
  imageDataUrl: string,
  srcX: number,
  srcY: number,
  srcW: number,
  srcH: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = srcW;
      canvas.height = srcH;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not create canvas context"));
        return;
      }
      ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("Failed to load image for cropping"));
    img.src = imageDataUrl;
  });
}

// ── Component ───────────────────────────────────────

export default function Pdf2EditScreen() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("");
  const [pages, setPages] = useState<PageData[]>([]);
  const [ocrResults, setOcrResults] = useState<PageOcrResult[]>([]);
  const [analysisResults, setAnalysisResults] = useState<SlideAnalysis[]>([]);
  const [progressText, setProgressText] = useState("");
  const [progressPage, setProgressPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState("");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [conversionMode, setConversionMode] = useState<ConversionMode>("vision");
  const [selectedModel, setSelectedModel] = useState<ModelChoice>("claude-sonnet-4-6");
  const [cleanBackgrounds, setCleanBackgrounds] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
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

  // ── Vision Mode: AI Analysis + Native PPTX ────────

  const handleConvertVision = useCallback(async () => {
    if (pages.length === 0) return;

    setPhase("processing");
    setError("");
    setAnalysisResults([]);

    try {
      const analyses: SlideAnalysis[] = [];

      // Step 1: Analyze all pages with Claude Vision
      for (let i = 0; i < pages.length; i++) {
        setProgressPage(i + 1);
        setProgressText(`Analyzing slide ${i + 1} of ${pages.length}...`);

        let analysis: SlideAnalysis | null = null;
        let retries = 0;

        while (!analysis && retries < 2) {
          const res = await fetch("/api/pdf2edit/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              image: pages[i].imageDataUrl,
              width: pages[i].width,
              height: pages[i].height,
              model: selectedModel,
            }),
          });

          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            if (data.retryable && retries === 0) {
              retries++;
              setProgressText(`Retrying analysis for slide ${i + 1}...`);
              continue;
            }
            throw new Error(
              data.error || `Analysis failed for slide ${i + 1} (${res.status})`
            );
          }

          analysis = await res.json();
        }

        if (!analysis) {
          throw new Error(`Failed to analyze slide ${i + 1} after retries`);
        }

        analyses.push(analysis);
      }

      setAnalysisResults(analyses);
      setProgressText("Building native PPTX...");

      // Step 2: Build PPTX with native elements only
      const PptxGenJS = (await import("pptxgenjs")).default;
      const pptx = new PptxGenJS();
      pptx.layout = "LAYOUT_WIDE"; // 13.33 x 7.5

      for (let i = 0; i < pages.length; i++) {
        setProgressText(`Building slide ${i + 1} of ${pages.length}...`);
        const slide = pptx.addSlide();
        const analysis = analyses[i];
        const pageData = pages[i];

        // Set background color
        if (analysis.background?.color) {
          slide.background = { color: analysis.background.color };
        }

        // Add elements in order (should be z-order from API)
        for (const el of analysis.elements) {
          try {
            switch (el.type) {
              case "shape": {
                const shape = el as ShapeElement;
                const shapeMap: Record<string, string> = {
                  roundedRect: "roundRect",
                  ellipse: "ellipse",
                  rect: "rect",
                };
                const shapeName = shapeMap[shape.shape] || "rect";
                const shapeOpts: Record<string, unknown> = {
                  x: shape.x,
                  y: shape.y,
                  w: shape.w,
                  h: shape.h,
                  fill: { color: shape.fill },
                };
                if (shape.borderColor) {
                  shapeOpts.line = {
                    color: shape.borderColor,
                    width: shape.borderWidth || 1,
                  };
                }
                slide.addShape(
                  shapeName as Parameters<typeof slide.addShape>[0],
                  shapeOpts
                );
                break;
              }

              case "image": {
                const img = el as ImageRegion;
                try {
                  const croppedData = await cropImageRegion(
                    pageData.imageDataUrl,
                    img.srcX,
                    img.srcY,
                    img.srcW,
                    img.srcH
                  );
                  slide.addImage({
                    data: croppedData,
                    x: img.x,
                    y: img.y,
                    w: img.w,
                    h: img.h,
                  });
                } catch (cropErr) {
                  console.warn(`[pdf2edit] Failed to crop image region on slide ${i + 1}:`, cropErr);
                }
                break;
              }

              case "text": {
                const txt = el as TextElement;
                slide.addText(txt.text, {
                  x: txt.x,
                  y: txt.y,
                  w: Math.max(txt.w, 0.5),
                  h: Math.max(txt.h, 0.2),
                  fontSize: txt.fontSize,
                  fontFace: txt.fontFace || "Arial",
                  color: txt.color,
                  bold: txt.bold || false,
                  italic: txt.italic || false,
                  align: txt.align || "left",
                  valign: txt.valign || "top",
                  isTextBox: true,
                  wrap: true,
                });
                break;
              }

              case "line": {
                const line = el as LineElement;
                slide.addShape(
                  "line" as Parameters<typeof slide.addShape>[0],
                  {
                    x: line.x,
                    y: line.y,
                    w: line.w,
                    h: line.h,
                    line: {
                      color: line.color,
                      width: line.lineWidth || 1,
                    },
                  }
                );
                break;
              }
            }
          } catch (elErr) {
            console.warn(`[pdf2edit] Element render error on slide ${i + 1}:`, elErr);
          }
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
      console.error("[pdf2edit] Vision convert error:", err);
      setError(
        err instanceof Error ? err.message : "Conversion failed"
      );
      setPhase("previewing");
    }
  }, [pages, fileName, selectedModel]);

  // ── OCR Mode: Legacy Fallback ──────────────────────

  const handleConvertOcr = useCallback(async () => {
    if (pages.length === 0) return;

    setPhase("processing");
    setError("");
    setOcrResults([]);

    try {
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

      const PptxGenJS = (await import("pptxgenjs")).default;
      const pptx = new PptxGenJS();
      pptx.layout = "LAYOUT_WIDE";

      for (let i = 0; i < pages.length; i++) {
        const slide = pptx.addSlide();
        const pageData = pages[i];
        const ocrPage = results[i];

        slide.addImage({
          data: pageData.imageDataUrl,
          x: 0,
          y: 0,
          w: SLIDE_WIDTH,
          h: SLIDE_HEIGHT,
        });

        for (const block of ocrPage.blocks) {
          if (block.vertices.length < 4) continue;

          const v = block.vertices;
          const minX = Math.min(v[0].x, v[3].x);
          const minY = Math.min(v[0].y, v[1].y);
          const maxX = Math.max(v[1].x, v[2].x);
          const maxY = Math.max(v[2].y, v[3].y);

          const xInches = (minX / pageData.width) * SLIDE_WIDTH;
          const yInches = (minY / pageData.height) * SLIDE_HEIGHT;
          const wInches = ((maxX - minX) / pageData.width) * SLIDE_WIDTH;
          const hInches = ((maxY - minY) / pageData.height) * SLIDE_HEIGHT;

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

      setProgressText("Finalizing download...");
      const pptxBlob = (await pptx.write({ outputType: "blob" })) as Blob;
      const baseName = fileName.replace(/\.pdf$/i, "");
      const outName = `${baseName}_editable.pptx`;

      const url = URL.createObjectURL(pptxBlob);

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
      console.error("[pdf2edit] OCR convert error:", err);
      setError(
        err instanceof Error ? err.message : "Conversion failed"
      );
      setPhase("previewing");
    }
  }, [pages, fileName]);

  // ── Dispatch to correct handler ────────────────────

  const handleConvert = useCallback(() => {
    if (conversionMode === "vision") {
      handleConvertVision();
    } else {
      handleConvertOcr();
    }
  }, [conversionMode, handleConvertVision, handleConvertOcr]);

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
    setAnalysisResults([]);
    setError("");
    setDownloadUrl(null);
    setDownloadName("");
    setFileName("");
    setProgressText("");
    setProgressPage(0);
    setTotalPages(0);
    setCopiedIdx(null);
  }, []);

  const handleCopyPrompt = useCallback((idx: number) => {
    navigator.clipboard.writeText(CLEAN_BG_PROMPT).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    });
  }, []);

  const handleDownloadPageImage = useCallback((pageData: PageData) => {
    const a = document.createElement("a");
    a.href = pageData.imageDataUrl;
    a.download = `slide_${pageData.pageNum}_background.jpg`;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => document.body.removeChild(a), 100);
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
            <p className="text-muted text-xs mt-1">
              PDF to Editable PPTX &middot; {conversionMode === "vision" ? "AI Vision Rebuild" : "OCR + Image Overlay"}
            </p>
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
            {conversionMode === "vision"
              ? "AI Vision analyzes each slide and rebuilds it with native, fully editable PowerPoint elements. No background images."
              : "OCR detects text and overlays editable text boxes on the original page images."}
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

          {/* ─── Clean Backgrounds Panel (Done + Vision + Toggle On) ─── */}
          {phase === "done" && conversionMode === "vision" && cleanBackgrounds && pages.length > 0 && (
            <div className="fade-in" style={{ marginTop: "24px" }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "16px",
              }}>
                <div style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #0AACDC, #9B69FF)",
                  flexShrink: 0,
                }} />
                <h3 className="heading-display" style={{ fontSize: "16px", margin: 0 }}>
                  Clean Backgrounds — Manual Test
                </h3>
                <span className="text-muted" style={{ fontSize: "12px" }}>
                  Download each slide image + copy the prompt into Nano Banana Pro
                </span>
              </div>

              {/* Prompt block with copy */}
              <div style={{
                background: "rgba(0, 0, 0, 0.3)",
                border: "1px solid rgba(155, 105, 255, 0.2)",
                borderRadius: "12px",
                padding: "16px",
                marginBottom: "16px",
                position: "relative",
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "10px",
                }}>
                  <span className="label-uppercase" style={{ color: "#9B69FF", fontSize: "11px" }}>
                    Gemini Prompt
                  </span>
                  <button
                    onClick={() => handleCopyPrompt(-1)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "6px 14px",
                      fontSize: "12px",
                      fontWeight: 600,
                      background: copiedIdx === -1
                        ? "rgba(10, 172, 220, 0.2)"
                        : "rgba(155, 105, 255, 0.15)",
                      border: copiedIdx === -1
                        ? "1px solid rgba(10, 172, 220, 0.4)"
                        : "1px solid rgba(155, 105, 255, 0.3)",
                      borderRadius: "8px",
                      color: copiedIdx === -1 ? "#0AACDC" : "#9B69FF",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    {copiedIdx === -1 ? (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        Copy Prompt
                      </>
                    )}
                  </button>
                </div>
                <pre style={{
                  margin: 0,
                  fontSize: "12px",
                  lineHeight: 1.6,
                  color: "rgba(255, 255, 255, 0.6)",
                  whiteSpace: "pre-wrap",
                  fontFamily: "'SF Mono', 'Cascadia Code', 'Fira Code', monospace",
                }}>
                  {CLEAN_BG_PROMPT}
                </pre>
              </div>

              {/* Slide image grid */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "16px",
              }}>
                {pages.map((p, idx) => (
                  <div key={p.pageNum} style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    borderRadius: "12px",
                    overflow: "hidden",
                    transition: "border-color 0.2s",
                  }}>
                    <div style={{ position: "relative", aspectRatio: "16/9" }}>
                      <img
                        src={p.imageDataUrl}
                        alt={`Slide ${p.pageNum}`}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                      <span style={{
                        position: "absolute",
                        top: "8px",
                        left: "8px",
                        background: "rgba(0, 0, 0, 0.7)",
                        color: "#fff",
                        fontSize: "11px",
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: "6px",
                        backdropFilter: "blur(4px)",
                      }}>
                        Slide {p.pageNum}
                      </span>
                    </div>
                    <div style={{
                      padding: "12px",
                      display: "flex",
                      gap: "8px",
                    }}>
                      <button
                        onClick={() => handleDownloadPageImage(p)}
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          padding: "8px 12px",
                          fontSize: "12px",
                          fontWeight: 600,
                          background: "linear-gradient(135deg, rgba(10, 172, 220, 0.15), rgba(155, 105, 255, 0.15))",
                          border: "1px solid rgba(10, 172, 220, 0.3)",
                          borderRadius: "8px",
                          color: "#0AACDC",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Download Image
                      </button>
                      <button
                        onClick={() => handleCopyPrompt(idx)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          padding: "8px 12px",
                          fontSize: "12px",
                          fontWeight: 600,
                          background: copiedIdx === idx
                            ? "rgba(10, 172, 220, 0.2)"
                            : "rgba(155, 105, 255, 0.1)",
                          border: copiedIdx === idx
                            ? "1px solid rgba(10, 172, 220, 0.4)"
                            : "1px solid rgba(155, 105, 255, 0.2)",
                          borderRadius: "8px",
                          color: copiedIdx === idx ? "#0AACDC" : "#9B69FF",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                      >
                        {copiedIdx === idx ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-muted" style={{ fontSize: "11px", marginTop: "12px", textAlign: "center" }}>
                Use these images with <strong style={{ color: "rgba(155, 105, 255, 0.8)" }}>Gemini 3 Pro Image</strong> (Nano Banana Pro) in Google AI Studio to generate text-free backgrounds
              </p>
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
                    or click to browse &middot; Max 100MB
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

              {/* Mode toggle + Model selector */}
              <div style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
                alignItems: "center",
                marginBottom: "20px",
                padding: "16px",
                background: "rgba(255, 255, 255, 0.03)",
                borderRadius: "12px",
                border: "1px solid rgba(255, 255, 255, 0.06)",
              }}>
                {/* Mode toggle */}
                <div style={{ display: "flex", borderRadius: "8px", overflow: "hidden", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
                  <button
                    onClick={() => setConversionMode("vision")}
                    style={{
                      padding: "8px 16px",
                      fontSize: "13px",
                      fontWeight: 500,
                      border: "none",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      background: conversionMode === "vision"
                        ? "linear-gradient(135deg, rgba(10, 172, 220, 0.3), rgba(155, 105, 255, 0.3))"
                        : "rgba(255, 255, 255, 0.03)",
                      color: conversionMode === "vision" ? "#ffffff" : "rgba(255, 255, 255, 0.4)",
                      borderRight: "1px solid rgba(255, 255, 255, 0.1)",
                    }}
                  >
                    AI Vision Rebuild
                  </button>
                  <button
                    onClick={() => setConversionMode("ocr")}
                    style={{
                      padding: "8px 16px",
                      fontSize: "13px",
                      fontWeight: 500,
                      border: "none",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      background: conversionMode === "ocr"
                        ? "linear-gradient(135deg, rgba(10, 172, 220, 0.3), rgba(155, 105, 255, 0.3))"
                        : "rgba(255, 255, 255, 0.03)",
                      color: conversionMode === "ocr" ? "#ffffff" : "rgba(255, 255, 255, 0.4)",
                    }}
                  >
                    Legacy OCR
                  </button>
                </div>

                {/* Model selector (Vision mode only) */}
                {conversionMode === "vision" && (
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value as ModelChoice)}
                    style={{
                      padding: "8px 12px",
                      fontSize: "13px",
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "8px",
                      color: "#ffffff",
                      cursor: "pointer",
                      appearance: "none",
                      paddingRight: "28px",
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='rgba(255,255,255,0.4)' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 10px center",
                    }}
                  >
                    <option value="claude-sonnet-4-6" style={{ background: "#001D58" }}>Sonnet 4.6</option>
                    <option value="claude-sonnet-4-5-20250929" style={{ background: "#001D58" }}>Sonnet 4.5</option>
                    <option value="claude-opus-4-6" style={{ background: "#001D58" }}>Opus 4.6</option>
                  </select>
                )}

                {/* Clean backgrounds toggle (Vision mode only) */}
                {conversionMode === "vision" && (
                  <label style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                    fontSize: "13px",
                    color: cleanBackgrounds ? "#ffffff" : "rgba(255, 255, 255, 0.4)",
                    transition: "color 0.2s",
                    userSelect: "none",
                  }}>
                    <div style={{
                      position: "relative",
                      width: "36px",
                      height: "20px",
                      borderRadius: "10px",
                      background: cleanBackgrounds
                        ? "linear-gradient(135deg, #0AACDC, #9B69FF)"
                        : "rgba(255, 255, 255, 0.1)",
                      transition: "background 0.2s",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}>
                      <div style={{
                        position: "absolute",
                        top: "2px",
                        left: cleanBackgrounds ? "18px" : "2px",
                        width: "16px",
                        height: "16px",
                        borderRadius: "50%",
                        background: "#ffffff",
                        transition: "left 0.2s",
                      }} />
                      <input
                        type="checkbox"
                        checked={cleanBackgrounds}
                        onChange={(e) => setCleanBackgrounds(e.target.checked)}
                        style={{ position: "absolute", opacity: 0, width: "100%", height: "100%", cursor: "pointer", margin: 0 }}
                      />
                    </div>
                    Clean backgrounds
                  </label>
                )}

                {/* Cost estimate */}
                {conversionMode === "vision" && (
                  <span className="text-muted" style={{ fontSize: "12px", marginLeft: "auto" }}>
                    ~${(pages.length * ((selectedModel === "claude-opus-4-6" ? 0.15 : 0.03) + (cleanBackgrounds ? 0.14 : 0))).toFixed(2)} estimated
                    {cleanBackgrounds && " (incl. bg clean)"}
                  </span>
                )}
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
                      {conversionMode === "vision" ? (
                        <>
                          <circle cx="12" cy="12" r="10" />
                          <circle cx="12" cy="12" r="4" />
                          <line x1="21.17" y1="8" x2="12" y2="8" />
                          <line x1="3.95" y1="6.06" x2="8.54" y2="14" />
                          <line x1="10.88" y1="21.94" x2="15.46" y2="14" />
                        </>
                      ) : (
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                      )}
                    </svg>
                    {conversionMode === "vision"
                      ? "Rebuild with AI Vision"
                      : "Convert with OCR"}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* ─── Phase: Processing ─── */}
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
              {conversionMode === "vision" ? "AI Vision Rebuild" : "How it works"}
            </div>
            <p className="text-sm leading-relaxed text-muted">
              {conversionMode === "vision"
                ? "Claude Vision analyzes each slide image and identifies every element — text, shapes, colors, and images. Slides are rebuilt from scratch with native PowerPoint elements."
                : "Your PDF pages are rendered as images, then Google Cloud Vision OCR detects all text with positions. We overlay editable text boxes on the original images."}
            </p>
          </div>

          <div
            className="info-card fade-in fade-in-delay-3"
            style={{ "--card-accent": "rgba(155, 105, 255, 0.4)" } as React.CSSProperties}
          >
            <div className="label-uppercase mb-3" style={{ color: "#9B69FF" }}>
              {conversionMode === "vision" ? "Truly editable" : "Editable output"}
            </div>
            <p className="text-sm leading-relaxed text-muted">
              {conversionMode === "vision"
                ? "No background images or doubled text. Every element is a native PowerPoint object — resize, recolor, restyle, and rearrange freely."
                : "Open in PowerPoint or Google Slides. Click any text to edit it. The original page images preserve the visual design as backgrounds."}
            </p>
          </div>

          <div
            className="info-card fade-in fade-in-delay-4"
            style={{ "--card-accent": "rgba(210, 0, 245, 0.4)" } as React.CSSProperties}
          >
            <div className="label-uppercase mb-3" style={{ color: "#D200F5" }}>
              {conversionMode === "vision" ? "Cost" : "Privacy first"}
            </div>
            <p className="text-sm leading-relaxed text-muted">
              {conversionMode === "vision"
                ? "~$0.03/page with Sonnet 4.5 (~$0.27 for a 10-page deck). PDF rendering stays in your browser — only page images are sent to Claude for analysis."
                : "PDF rendering happens in your browser. Only page images are sent to Google Vision for OCR. PPTX is built entirely client-side."}
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center mt-16 pb-8 text-xs text-subtle">
          GAI Insights PDF2Edit v2.0 &middot; {conversionMode === "vision" ? "Powered by Claude AI" : "Powered by Google Cloud Vision"}
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
