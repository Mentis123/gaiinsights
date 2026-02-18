"use client";

import dynamic from "next/dynamic";

const Pdf2EditScreen = dynamic(() => import("@/components/Pdf2EditScreen"), {
  ssr: false,
  loading: () => (
    <main className="min-h-screen flex items-center justify-center">
      <div className="spinner spinner-lg" />
    </main>
  ),
});

export default function Pdf2EditPage() {
  return <Pdf2EditScreen />;
}
