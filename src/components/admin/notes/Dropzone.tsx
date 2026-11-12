"use client";

import * as React from "react";
import { FileUp } from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";

interface Props {
  onFile: (file: File) => void;
  maxBytes: number;
  disabled?: boolean;
  compact?: boolean;
}

export function Dropzone({ onFile, maxBytes, disabled, compact }: Props) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [over, setOver] = React.useState(false);

  const pick = (files: FileList | null) => {
    const f = files?.[0];
    if (f) onFile(f);
  };

  return (
    <>
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      aria-label="Upload a PDF: drop it here or press Enter to browse"
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (!disabled) pick(e.dataTransfer.files);
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed text-center transition-all",
        compact ? "px-4 py-6" : "px-6 py-14",
        over ? "border-primary bg-primary/10 shadow-glow-sm" : "border-border-2 bg-bg-2/60 hover:border-primary/60 hover:bg-primary/5",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-lavender">
        <FileUp className="h-7 w-7" aria-hidden />
      </span>
      <p className="mt-4 font-semibold text-text">{over ? "Drop to upload" : "Drag & drop a PDF here"}</p>
      <p className="mt-1 text-sm text-text-3">
        or <span className="font-semibold text-lavender">browse</span> · PDF only · up to {formatBytes(maxBytes, 0)}
      </p>
    </div>
    {/* Kept outside the drop target so it isn't a nested interactive control. */}
    <input
      ref={inputRef}
      type="file"
      accept="application/pdf,.pdf"
      className="sr-only"
      tabIndex={-1}
      aria-label="Choose a PDF file"
      disabled={disabled}
      onChange={(e) => {
        pick(e.target.files);
        e.target.value = "";
      }}
    />
    </>
  );
}

export function UploadProgress({ progress, fileName, size, onCancel, state }: { progress: number; fileName: string; size: number; onCancel?: () => void; state: string }) {
  return (
    <div className="rounded-2xl border border-border bg-bg-2/60 p-4">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="min-w-0 truncate font-medium text-text">{fileName}</span>
        <span className="shrink-0 text-text-3">{formatBytes(size)}</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-label="Upload progress">
        <div className="h-full rounded-full bg-gradient-to-r from-primary to-primary-2 transition-[width] duration-200" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-text-3">
        <span>{state === "preparing" ? "Preparing…" : state === "validating" ? "Checking file…" : `${progress}% uploaded`}</span>
        {onCancel && (
          <button type="button" onClick={onCancel} className="font-semibold text-danger hover:underline">
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
