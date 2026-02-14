"use client";

import { useState, useEffect, lazy, Suspense } from "react";
import LoginScreen from "@/components/LoginScreen";
import BuilderScreen from "@/components/BuilderScreen";
import type { AppState } from "@/components/types";
import type { TemplateConfig } from "@/lib/types";

const StudioScreen = lazy(() => import("@/components/StudioScreen"));

export default function Home() {
  const [state, setState] = useState<AppState>("loading");
  const [templateConfig, setTemplateConfig] = useState<TemplateConfig | null>(null);

  useEffect(() => {
    if (document.cookie.includes("gai_auth")) {
      setState("builder");
      // Check for existing custom template
      loadTemplateConfig();
    } else {
      setState("login");
    }
  }, []);

  const loadTemplateConfig = async () => {
    try {
      const res = await fetch("/api/templates/config");
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setTemplateConfig(data.config);
        }
      }
    } catch {
      // No custom template, use default
    }
  };

  // ─── Loading ───────────────────────────────────
  if (state === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="spinner spinner-lg" />
      </main>
    );
  }

  // ─── Login ─────────────────────────────────────
  if (state === "login") {
    return (
      <LoginScreen
        onSuccess={() => {
          setState("builder");
          loadTemplateConfig();
        }}
      />
    );
  }

  // ─── Studio ────────────────────────────────────
  if (state === "studio") {
    return (
      <Suspense fallback={
        <main className="min-h-screen flex items-center justify-center">
          <div className="spinner spinner-lg" />
        </main>
      }>
        <StudioScreen
          existingConfig={templateConfig}
          onApprove={(config: TemplateConfig) => {
            setTemplateConfig(config);
            setState("builder");
          }}
          onSkip={() => setState("builder")}
        />
      </Suspense>
    );
  }

  // ─── Builder ───────────────────────────────────
  return (
    <BuilderScreen
      templateName={templateConfig ? getTemplateName(templateConfig) : null}
      onChangeTemplate={() => setState("studio")}
    />
  );
}

function getTemplateName(config: TemplateConfig): string {
  // Extract a friendly name from the blob URL or use a default
  const url = config.blobUrl;
  const match = url.match(/\/([^/]+)\.pptx/);
  if (match) {
    return match[1].replace(/-/g, " ").replace(/active template/i, "Custom Template");
  }
  return "Custom Template";
}
