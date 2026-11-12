"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, ExternalLink, FileText, LogIn, Save, Send, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Feedback";
import { Card } from "@/components/ui/Card";
import { useAdminUpload } from "@/hooks/useAdminUpload";
import { api, errorMessage } from "@/lib/api-client";
import { adminFileUrl } from "@/lib/storage/paths";
import { formatBytes } from "@/lib/utils";
import type { CatalogTree } from "@/lib/queries/catalog";
import type { Note, NoteSummary } from "@/types";
import { titleFromFileName } from "../format";
import { useToast } from "../Toast";
import { Dropzone, UploadProgress } from "./Dropzone";
import { DuplicateWarning } from "./DuplicateWarning";
import { EMPTY_NOTE_FORM, NoteMetadataFields, toApiMetadata, validateNoteForm, type NoteFormValues } from "./NoteMetadataFields";

interface Props {
  catalog: CatalogTree;
  maxUploadBytes: number;
  defaultProgramId: string | null;
}

export function UploadNoteForm({ catalog, maxUploadBytes, defaultProgramId }: Props) {
  const router = useRouter();
  const toast = useToast();
  const upload = useAdminUpload({ maxUploadBytes });
  const [values, setValues] = React.useState<NoteFormValues>(() => ({
    ...EMPTY_NOTE_FORM,
    programId: defaultProgramId && catalog.programs.some((p) => p.id === defaultProgramId) ? defaultProgramId : catalog.programs.length === 1 ? catalog.programs[0].id : "",
  }));
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [submitting, setSubmitting] = React.useState<"draft" | "publish" | null>(null);
  const [created, setCreated] = React.useState<{ note: Note; duplicates: NoteSummary[] } | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const dirty = upload.state !== "idle" && !created;
  React.useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const onFile = (file: File) => {
    setCreated(null);
    setSubmitError(null);
    if (!values.title) setValues((v) => ({ ...v, title: titleFromFileName(file.name) }));
    void upload.start(file);
  };

  const submit = async (mode: "draft" | "publish") => {
    const errs = validateNoteForm(values);
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast.error("Check the highlighted fields");
      return;
    }
    if (!upload.fileMeta || !upload.noteId) return;
    setSubmitting(mode);
    setSubmitError(null);
    try {
      const res = await api.adminNotes.create({ ...toApiMetadata(values), noteId: upload.noteId, file: upload.fileMeta });
      setCreated(res);
      if (mode === "publish") {
        try {
          await api.adminNotes.publish(res.note.id);
          toast.success("Published", res.note.title);
          router.push(`/admin/notes/${res.note.id}`);
          return;
        } catch (err) {
          setSubmitError(`Saved as a draft, but publishing failed: ${errorMessage(err)}`);
          toast.error("Publish failed — saved as draft");
          return;
        }
      }
      toast.success("Draft saved", res.duplicates.length ? "Possible duplicates were found — review below." : res.note.title);
      if (!res.duplicates.length) router.push(`/admin/notes/${res.note.id}`);
    } catch (err) {
      const fieldErrs = (err as { fieldErrors?: Record<string, string> }).fieldErrors;
      if (fieldErrs && Object.keys(fieldErrs).length) setErrors(fieldErrs);
      setSubmitError(errorMessage(err));
    } finally {
      setSubmitting(null);
    }
  };

  const uploading = ["validating", "preparing", "uploading"].includes(upload.state);
  const ready = upload.state === "done" && !!upload.fileMeta;

  if (created) {
    return (
      <div className="space-y-6">
        <Alert variant="success" title="Draft saved">
          “{created.note.title}” is saved as a private draft. Students can&apos;t see it until it&apos;s published.
        </Alert>
        <DuplicateWarning duplicates={created.duplicates} />
        {submitError && <Alert variant="danger">{submitError}</Alert>}
        <div className="flex flex-wrap gap-2">
          <Button href={`/admin/notes/${created.note.id}`} leftIcon={<FileText className="h-4 w-4" aria-hidden />}>
            Open draft to preview & publish
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              upload.reset();
              setCreated(null);
              setValues((v) => ({ ...v, title: "", description: "", tags: [] }));
            }}
            leftIcon={<Upload className="h-4 w-4" aria-hidden />}
          >
            Upload another
          </Button>
        </div>
        <iframe src={adminFileUrl(created.note.id)} title="Draft preview" className="h-[70vh] w-full rounded-2xl border border-border bg-white" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <Card className="space-y-4">
        <h2 className="flex items-center gap-2 font-semibold text-text">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs text-lavender">1</span>
          Choose the PDF
        </h2>
        {upload.state === "idle" || upload.state === "error" ? (
          <Dropzone onFile={onFile} maxBytes={maxUploadBytes} />
        ) : uploading ? (
          <UploadProgress progress={upload.progress} fileName={upload.file?.name ?? ""} size={upload.file?.size ?? 0} state={upload.state} onCancel={upload.cancel} />
        ) : (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-success/30 bg-success/10 p-4">
            <span className="flex min-w-0 items-center gap-3">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-success" aria-hidden />
              <span className="min-w-0">
                <span className="block truncate font-medium text-text">{upload.file?.name}</span>
                <span className="text-xs text-text-3">
                  {formatBytes(upload.file?.size ?? 0)}
                  {upload.fileMeta?.pageCount ? ` · ${upload.fileMeta.pageCount} pages` : ""} · uploaded privately
                </span>
              </span>
            </span>
            <Button size="sm" variant="ghost" onClick={upload.reset}>
              Change
            </Button>
          </div>
        )}
        {upload.state === "error" && upload.error && (
          <Alert variant="danger" title="Upload problem">
            {upload.error}
            {upload.errorCode === "UNAUTHORIZED" && (
              <Button size="sm" variant="secondary" className="mt-2" href="/admin/login?next=/admin/notes/new" leftIcon={<LogIn className="h-4 w-4" aria-hidden />}>
                Sign in again
              </Button>
            )}
          </Alert>
        )}
        {ready && upload.noteId && (
          <a href={adminFileUrl(upload.noteId)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-lavender hover:underline">
            Preview uploaded file <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
        )}
        <p className="text-xs text-muted">The file is stored privately as a draft. It only becomes public when you publish.</p>
      </Card>

      <Card className="space-y-5">
        <h2 className="flex items-center gap-2 font-semibold text-text">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs text-lavender">2</span>
          Describe it
        </h2>
        {catalog.programs.length === 0 && (
          <Alert variant="warning">
            No programs exist yet. <Link href="/admin/catalog" className="font-semibold underline">Set up the catalogue</Link> first.
          </Alert>
        )}
        <NoteMetadataFields catalog={catalog} value={values} onChange={setValues} errors={errors} disabled={!!submitting} />
        {submitError && <Alert variant="danger">{submitError}</Alert>}
        <div className="flex flex-wrap gap-2 border-t border-border pt-5">
          <Button onClick={() => void submit("publish")} disabled={!ready || !!submitting} loading={submitting === "publish"} leftIcon={<Send className="h-4 w-4" aria-hidden />}>
            Save & publish
          </Button>
          <Button variant="secondary" onClick={() => void submit("draft")} disabled={!ready || !!submitting} loading={submitting === "draft"} leftIcon={<Save className="h-4 w-4" aria-hidden />}>
            Save as draft
          </Button>
          {!ready && <p className="self-center text-xs text-muted">Upload a file to continue.</p>}
        </div>
      </Card>
    </div>
  );
}
