"use client";

import dynamic from "next/dynamic";
import { Spinner } from "@/components/ui/Feedback";

/** Client-only wrapper: pdf.js needs browser APIs, so it is never server-rendered. */
export const PdfViewerLoader = dynamic(() => import("./PdfViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[75dvh] min-h-[420px] items-center justify-center gap-2 rounded-2xl border border-border bg-bg-2 text-text-3">
      <Spinner /> Preparing viewer…
    </div>
  ),
});
