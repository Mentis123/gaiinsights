"use client";

import { useState, useEffect, lazy, Suspense } from "react";
import LoginScreen from "@/components/LoginScreen";
import BuilderScreen from "@/components/BuilderScreen";
import type { AppState } from "@/components/types";
import type { TemplateConfig, TemplateLibrary } from "@/lib/types";

const StudioScreen = lazy(() => import("@/components/StudioScreen"));

export default function Home() {
  const [state, setState] = useState<AppState>("loading");
  const [library, setLibrary] = useState<TemplateLibrary>({ activeId: null, templates: [] });

  const activeTemplate = library.activeId
    ? library.templates.find((t) => t.id === library.activeId) || null
    : null;

  useEffect(() => {
    if (document.cookie.includes("gai_auth")) {
      setState("builder");
      loadLibrary();
    } else {
      setState("login");
    }
  }, []);

  const loadLibrary = async () => {
    try {
      const res = await fetch("/api/templates");
      if (res.ok) {
        const data = await res.json();
        if (data.library) {
          setLibrary(data.library);
        }
      }
    } catch {
      // No templates, use default
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
          loadLibrary();
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
          library={library}
          onSelect={(updatedLibrary: TemplateLibrary) => {
            setLibrary(updatedLibrary);
            setState("builder");
          }}
          onApprove={(config: TemplateConfig, updatedLibrary?: TemplateLibrary) => {
            if (updatedLibrary) setLibrary(updatedLibrary);
            else setLibrary((prev) => ({
              ...prev,
              activeId: config.id,
              templates: prev.templates.map((t) => t.id === config.id ? config : t),
            }));
            setState("builder");
          }}
          onBack={() => setState("builder")}
        />
      </Suspense>
    );
  }

  // ─── Builder ───────────────────────────────────
  return (
    <BuilderScreen
      templateName={activeTemplate ? getTemplateName(activeTemplate) : null}
      onChangeTemplate={() => setState("studio")}
    />
  );
}

function getTemplateName(config: TemplateConfig): string {
  if (config.name) return config.name;
  const url = config.blobUrl;
  const match = url.match(/\/([^/]+)\.pptx/);
  if (match) {
    return match[1].replace(/-/g, " ").replace(/active template/i, "Custom Template");
  }
  return "Custom Template";
}
