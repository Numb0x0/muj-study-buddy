"use client";

import * as React from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import { ChevronLeft, ChevronRight, Download, ExternalLink, Maximize, Minimize, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { Alert, Spinner } from "@/components/ui/Feedback";
import { PDF_WORKER_SRC } from "@/lib/pdf-worker";
import { UPLOAD_CHUNK_BYTES } from "@/constants/upload";
import { cn } from "@/lib/utils";

// Must be set in the same module that renders <Document> (react-pdf requirement).
pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_SRC;

/**
 * Files are stored in Firestore in UPLOAD_CHUNK_BYTES pieces; asking for ranges
 * of the same size means each range request reads exactly one stored chunk
 * (pdf.js's 64 KiB default would re-read the same chunk many times).
 * Module-level so the object identity is stable (react-pdf reloads on change).
 */
const PDF_OPTIONS = { rangeChunkSize: UPLOAD_CHUNK_BYTES };

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;
const RENDER_MARGIN = "1200px 0px";

interface Props {
  fileUrl: string;
  downloadUrl: string;
  title: string;
  /** Known page count from metadata (used before the PDF loads). */
  initialPageCount?: number | null;
}

export default function PdfViewer({ fileUrl, downloadUrl, title, initialPageCount }: Props) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const slotRefs = React.useRef<Array<HTMLDivElement | null>>([]);

  const [numPages, setNumPages] = React.useState<number>(0);
  const [aspect, setAspect] = React.useState(1.414); // A4 portrait until the first page reports in
  const [containerWidth, setContainerWidth] = React.useState(0);
  const [zoom, setZoom] = React.useState(1);
  const [current, setCurrent] = React.useState(1);
  /** Page number being typed; null when not editing (input shows the current page). */
  const [pageDraft, setPageDraft] = React.useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [visible, setVisible] = React.useState<Set<number>>(() => new Set([1, 2]));

  // Fit-to-width baseline, tracked with ResizeObserver.
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const baseWidth = Math.max(240, Math.min(containerWidth - 32, 1000));
  const pageWidth = Math.round(baseWidth * zoom);
  const pageHeight = Math.round(pageWidth * aspect);

  // Lazily render pages near the viewport; keep a page rendered once it has been seen.
  React.useEffect(() => {
    const root = scrollRef.current;
    if (!root || !numPages) return;
    const io = new IntersectionObserver(
      (entries) => {
        setVisible((prev) => {
          let changed = false;
          const next = new Set(prev);
          for (const e of entries) {
            const n = Number((e.target as HTMLElement).dataset.page);
            if (e.isIntersecting && !next.has(n)) {
              next.add(n);
              changed = true;
            }
          }
          return changed ? next : prev;
        });
      },
      { root, rootMargin: RENDER_MARGIN },
    );
    slotRefs.current.slice(0, numPages).forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [numPages]);

  // Current page = the slot whose top is nearest the top third of the viewport.
  const onScroll = React.useCallback(() => {
    const root = scrollRef.current;
    if (!root || !numPages) return;
    const probe = root.scrollTop + root.clientHeight / 3;
    let best = 1;
    for (let i = 0; i < numPages; i++) {
      const el = slotRefs.current[i];
      if (el && el.offsetTop <= probe) best = i + 1;
    }
    setCurrent((c) => (c === best ? c : best));
  }, [numPages]);

  const goTo = React.useCallback(
    (n: number) => {
      if (!numPages) return;
      const target = Math.min(Math.max(1, n), numPages);
      const el = slotRefs.current[target - 1];
      const root = scrollRef.current;
      if (el && root) root.scrollTo({ top: el.offsetTop - 12, behavior: "smooth" });
      setCurrent(target);
    },
    [numPages],
  );

  const changeZoom = React.useCallback((delta: number | "reset") => {
    setZoom((z) => (delta === "reset" ? 1 : Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round((z + delta) * 100) / 100))));
  }, []);

  // Keep the current page anchored when zoom changes.
  const anchorPage = React.useRef(current);
  React.useEffect(() => {
    anchorPage.current = current;
  }, [current]);
  React.useEffect(() => {
    const el = slotRefs.current[anchorPage.current - 1];
    if (el && scrollRef.current) scrollRef.current.scrollTop = el.offsetTop - 12;
  }, [zoom]);

  // Fullscreen
  React.useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement === rootRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);
  const fullscreenSupported = typeof document !== "undefined" && Boolean(document.fullscreenEnabled);
  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await rootRef.current?.requestFullscreen();
    } catch {
      /* some mobile browsers refuse; the button is hidden when unsupported */
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if ((e.target as HTMLElement).tagName === "INPUT") return;
    switch (e.key) {
      case "ArrowRight":
      case "PageDown":
        e.preventDefault();
        goTo(current + 1);
        break;
      case "ArrowLeft":
      case "PageUp":
        e.preventDefault();
        goTo(current - 1);
        break;
      case "+":
      case "=":
        e.preventDefault();
        changeZoom(ZOOM_STEP);
        break;
      case "-":
        e.preventDefault();
        changeZoom(-ZOOM_STEP);
        break;
      case "0":
        e.preventDefault();
        changeZoom("reset");
        break;
    }
  };

  const total = numPages || initialPageCount || 0;

  return (
    <div
      ref={rootRef}
      className={cn("flex flex-col overflow-hidden rounded-2xl border border-border bg-bg-2", isFullscreen && "rounded-none border-0")}
      onKeyDown={onKeyDown}
    >
      {/* Toolbar */}
      <div role="toolbar" aria-label="PDF controls" className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface/80 px-3 py-2 backdrop-blur">
        <div className="flex items-center gap-1">
          <ToolButton label="Previous page" onClick={() => goTo(current - 1)} disabled={current <= 1 || !numPages}>
            <ChevronLeft className="h-4 w-4" />
          </ToolButton>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const n = Number(pageDraft);
              if (pageDraft && Number.isFinite(n)) goTo(n);
              setPageDraft(null);
            }}
            className="flex items-center gap-1.5 text-sm text-text-3"
          >
            <label htmlFor="pdf-page" className="sr-only">
              Page number
            </label>
            <input
              id="pdf-page"
              inputMode="numeric"
              value={pageDraft ?? String(current)}
              onChange={(e) => setPageDraft(e.target.value.replace(/\D/g, ""))}
              onBlur={() => setPageDraft(null)}
              className="h-8 w-12 rounded-lg border border-border bg-bg-2 text-center text-text focus:border-primary focus:outline-none"
              disabled={!numPages}
            />
            <span>of {total || "–"}</span>
          </form>
          <ToolButton label="Next page" onClick={() => goTo(current + 1)} disabled={!numPages || current >= numPages}>
            <ChevronRight className="h-4 w-4" />
          </ToolButton>
        </div>

        <div className="flex items-center gap-1">
          <ToolButton label="Zoom out" onClick={() => changeZoom(-ZOOM_STEP)} disabled={zoom <= MIN_ZOOM}>
            <ZoomOut className="h-4 w-4" />
          </ToolButton>
          <button
            type="button"
            onClick={() => changeZoom("reset")}
            className="h-8 min-w-14 rounded-lg px-2 text-xs font-semibold tabular-nums text-text-2 hover:bg-white/5"
            aria-label="Reset zoom to fit width"
            title="Fit width (0)"
          >
            {Math.round(zoom * 100)}%
          </button>
          <ToolButton label="Zoom in" onClick={() => changeZoom(ZOOM_STEP)} disabled={zoom >= MAX_ZOOM}>
            <ZoomIn className="h-4 w-4" />
          </ToolButton>
          <span className="mx-1 hidden h-5 w-px bg-border sm:block" aria-hidden />
          <ToolButton label="Fit width" onClick={() => changeZoom("reset")} className="hidden sm:inline-flex">
            <RotateCcw className="h-4 w-4" />
          </ToolButton>
          {fullscreenSupported && (
            <ToolButton label={isFullscreen ? "Exit full screen" : "Full screen"} onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </ToolButton>
          )}
          <a href={downloadUrl} download className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-lavender hover:bg-primary/10" aria-label="Download PDF" title="Download">
            <Download className="h-4 w-4" aria-hidden />
          </a>
        </div>
      </div>

      {/* Pages */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        tabIndex={0}
        aria-label={`${title} — PDF pages`}
        className={cn("relative overflow-auto bg-[#0c0e1c] px-4 py-4 focus-visible:outline-none", isFullscreen ? "h-[calc(100dvh-3.25rem)]" : "h-[75dvh] min-h-[420px]")}
      >
        {loadError ? (
          <div className="mx-auto max-w-lg py-10">
            <Alert variant="danger" title="This PDF couldn't be displayed here">
              <p>{loadError}</p>
              <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 font-semibold text-text underline-offset-4 hover:underline">
                Open the PDF directly <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            </Alert>
          </div>
        ) : (
          <Document
            file={fileUrl}
            options={PDF_OPTIONS}
            onLoadSuccess={(doc) => {
              setNumPages(doc.numPages);
              setLoadError(null);
            }}
            onLoadError={(err) => setLoadError(err.message || "The file could not be loaded.")}
            loading={
              <div className="flex h-64 items-center justify-center gap-2 text-text-3">
                <Spinner /> Loading PDF…
              </div>
            }
            error={<span />}
            className="flex w-max min-w-full flex-col items-start"
          >
            {Array.from({ length: numPages }, (_, i) => {
              const n = i + 1;
              return (
                <div
                  key={n}
                  ref={(el) => {
                    slotRefs.current[i] = el;
                  }}
                  data-page={n}
                  className="relative mx-auto mb-4 flex justify-center"
                  style={{ minHeight: pageHeight, width: pageWidth }}
                >
                  {visible.has(n) ? (
                    <Page
                      pageNumber={n}
                      width={pageWidth}
                      renderTextLayer={false}
                      renderAnnotationLayer
                      onLoadSuccess={n === 1 ? (p) => setAspect(p.originalHeight / p.originalWidth) : undefined}
                      loading={<div className="flex items-center justify-center bg-white/5" style={{ width: pageWidth, height: pageHeight }} />}
                    />
                  ) : (
                    <div className="rounded-md bg-white/[0.03]" style={{ width: pageWidth, height: pageHeight }} aria-hidden />
                  )}
                  <span className="absolute -bottom-0.5 right-2 translate-y-full text-[10px] text-muted">{n}</span>
                </div>
              );
            })}
          </Document>
        )}
      </div>
    </div>
  );
}

function ToolButton({ label, onClick, disabled, children, className }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn("inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-2 transition-colors hover:bg-white/5 hover:text-text disabled:opacity-40 disabled:hover:bg-transparent", className)}
    >
      {children}
    </button>
  );
}
