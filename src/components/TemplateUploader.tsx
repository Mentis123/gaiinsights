import { useState, useRef, useCallback } from "react";

interface TemplateUploaderProps {
  onUpload: (file: File) => void;
  uploading: boolean;
  error?: string;
}

export default function TemplateUploader({ onUpload, uploading, error }: TemplateUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.name.toLowerCase().endsWith(".pptx")) {
      return; // Validation happens in parent
    }
    onUpload(file);
  }, [onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  return (
    <div className="fade-in">
      <div
        className={`upload-zone${dragOver ? " upload-zone-active" : ""}${uploading ? " upload-zone-uploading" : ""}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !uploading && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && !uploading && inputRef.current?.click()}
        aria-label="Upload PowerPoint template"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
          className="hidden"
        />

        {uploading ? (
          <div className="upload-zone-content">
            <div className="spinner spinner-lg mb-4" />
            <p className="text-white font-medium">Analyzing your template...</p>
            <p className="text-muted text-sm mt-2">Extracting layouts, colors, and fonts</p>
          </div>
        ) : (
          <div className="upload-zone-content">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="upload-icon">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p className="text-white font-medium mt-4">
              Drop your .pptx template here
            </p>
            <p className="text-muted text-sm mt-2">
              or click to browse &middot; Max 50MB
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="error-bar fade-in mt-4" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D200F5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}
