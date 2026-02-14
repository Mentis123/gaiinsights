import { PROGRESS_STAGES } from "./types";

interface GeneratingToastProps {
  progressStage: number;
  elapsed: number;
}

export default function GeneratingToast({ progressStage, elapsed }: GeneratingToastProps) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes gai-spin { to { transform: rotate(360deg); } }
        @keyframes gai-pulse { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
        @keyframes gai-progress { 0% { width: 0%; } 20% { width: 25%; } 50% { width: 55%; } 80% { width: 80%; } 100% { width: 96%; } }
        @keyframes gai-btn-pulse { 0%,100% { box-shadow: 0 0 8px rgba(10,172,220,0.3); } 50% { box-shadow: 0 0 20px rgba(10,172,220,0.6); } }
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
              {PROGRESS_STAGES[progressStage]}
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
        <div style={{
          marginTop: "14px",
          height: "3px",
          background: "rgba(255, 255, 255, 0.1)",
          borderRadius: "2px",
          overflow: "hidden",
        }}>
          <div style={{
            height: "100%",
            background: "linear-gradient(90deg, #0AACDC, #9B69FF, #D200F5)",
            borderRadius: "2px",
            animation: "gai-progress 50s linear forwards",
          }} />
        </div>
      </div>
    </>
  );
}
