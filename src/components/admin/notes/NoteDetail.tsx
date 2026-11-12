"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, ExternalLink, FileUp, Globe, History, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Feedback";
import { Badge } from "@/components/ui/Badge";
import { useAdminUpload } from "@/hooks/useAdminUpload";
import { api, errorMessage } from "@/lib/api-client";
import { adminFileUrl } from "@/lib/storage/paths";
import { formatBytes } from "@/lib/utils";
import type { CatalogTree } from "@/lib/queries/catalog";
import type { AuditLog, Note, NoteSummary } from "@/types";
import { auditLabel, formatDateTime } from "../format";
import { RelativeTime } from "../RelativeTime";
import { StatusBadge } from "../StatusBadge";
import { useToast } from "../Toast";
import { Dropzone, UploadProgress } from "./Dropzone";
import { DuplicateWarning } from "./DuplicateWarning";
import { NoteActions } from "./NoteActions";
import { NoteMetadataFields, toApiMetadata, validateNoteForm, type NoteFormValues } from "./NoteMetadataFields";

interface Props {
  note: Note;
  catalog: CatalogTree;
  duplicates: NoteSummary[];
  audit: AuditLog[];
  maxUploadBytes: number;
  /** Resolved server-side from Firebase Auth. */
  uploaderEmail: string | null;
}

const toForm = (n: Note): NoteFormValues => ({
  programId: n.programId,
  semesterId: n.semesterId,
  subjectId: n.subjectId,
  unitNumber: n.unitNumber,
  resourceType: n.resourceType,
  title: n.title,
  description: n.description,
  tags: n.tags,
});

export function NoteDetail({ note: initialNote, catalog, duplicates, audit, maxUploadBytes, uploaderEmail }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [note, setNote] = React.useState(initialNote);
  const [values, setValues] = React.useState<NoteFormValues>(() => toForm(initialNote));
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [replacing, setReplacing] = React.useState(false);
  const [showReplace, setShowReplace] = React.useState(false);
  const [previewKey, setPreviewKey] = React.useState(0);
  const upload = useAdminUpload({ maxUploadBytes });
  const dirty = JSON.stringify(values) !== JSON.stringify(toForm(note));

  const save = async () => {
    const errs = validateNoteForm(values);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      const { note: updated } = await api.adminNotes.update(note.id, toApiMetadata(values));
      setNote(updated);
      setValues(toForm(updated));
      toast.success("Changes saved");
      router.refresh();
    } catch (err) {
      const fe = (err as { fieldErrors?: Record<string, string> }).fieldErrors;
      if (fe) setErrors(fe);
      toast.error("Couldn't save", errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  /** Upload a new version under this note id, then attach it server-side. */
  const replaceWith = async (file: File) => {
    const meta = await upload.start(file, { noteId: note.id });
    if (!meta) return;
    setReplacing(true);
    try {
      const { note: updated } = await api.adminNotes.replaceFile(note.id, { file: meta });
      setNote(updated);
      setShowReplace(false);
      setPreviewKey((k) => k + 1);
      toast.success("File replaced", `Now on version ${updated.version}.`);
      router.refresh();
    } catch (err) {
      toast.error("Couldn't replace the file", errorMessage(err));
    } finally {
      setReplacing(false);
      upload.reset();
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <div className="space-y-4">
        <Card padding="none" className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
            <span className="text-sm font-medium text-text-2">Preview · {note.originalFileName}</span>
            <span className="flex gap-1">
              <Button href={adminFileUrl(note.id)} target="_blank" size="sm" variant="ghost" leftIcon={<ExternalLink className="h-3.5 w-3.5" aria-hidden />}>
                Open
              </Button>
              <Button href={adminFileUrl(note.id, { download: true })} size="sm" variant="ghost" leftIcon={<Download className="h-3.5 w-3.5" aria-hidden />}>
                Download
              </Button>
            </span>
          </div>
          <iframe key={previewKey} src={adminFileUrl(note.id)} title={`Preview of ${note.title}`} className="h-[72vh] w-full bg-white" />
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={note.status} />
            <Badge>v{note.version}</Badge>
            <Badge>{formatBytes(note.fileSizeBytes)}</Badge>
            {note.pageCount && <Badge>{note.pageCount} pages</Badge>}
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-text-3">Uploaded by</dt>
            <dd className="truncate text-text-2">{uploaderEmail ?? note.uploadedBy}</dd>
            <dt className="text-text-3">Created</dt>
            <dd className="text-text-2">{formatDateTime(note.createdAt)}</dd>
            <dt className="text-text-3">Updated</dt>
            <dd className="text-text-2">{formatDateTime(note.updatedAt)}</dd>
            <dt className="text-text-3">Published</dt>
            <dd className="text-text-2">{note.publishedAt ? formatDateTime(note.publishedAt) : "—"}</dd>
          </dl>
          {note.status === "published" && (
            <Link href={`/notes/${note.id}`} target="_blank" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-lavender hover:underline">
              <Globe className="h-4 w-4" aria-hidden /> View public page
            </Link>
          )}
          <div className="mt-4 border-t border-border pt-4">
            <NoteActions note={note} size="md" onChanged={(n) => { setNote(n); setPreviewKey((k) => k + 1); router.refresh(); }} onDeleted={() => router.push("/admin/notes")} />
          </div>
        </Card>

        <DuplicateWarning duplicates={duplicates} />

        <Card>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold text-text">Replace file</h2>
            {!showReplace && (
              <Button size="sm" variant="secondary" onClick={() => setShowReplace(true)} leftIcon={<FileUp className="h-4 w-4" aria-hidden />}>
                Upload new version
              </Button>
            )}
          </div>
          {showReplace && (
            <div className="mt-4 space-y-3">
              {note.status === "published" && <Alert variant="info">The new file goes live immediately and keeps the same public link.</Alert>}
              {upload.state === "idle" || upload.state === "error" ? (
                <Dropzone compact onFile={(f) => void replaceWith(f)} maxBytes={maxUploadBytes} />
              ) : (
                <UploadProgress progress={replacing ? 100 : upload.progress} fileName={upload.file?.name ?? ""} size={upload.file?.size ?? 0} state={replacing ? "saving" : upload.state} onCancel={replacing ? undefined : upload.cancel} />
              )}
              {upload.error && <Alert variant="danger">{upload.error}</Alert>}
              <Button size="sm" variant="ghost" onClick={() => { upload.reset(); setShowReplace(false); }} disabled={replacing}>
                Cancel
              </Button>
            </div>
          )}
        </Card>

        <Card className="space-y-5">
          <h2 className="font-semibold text-text">Details</h2>
          <NoteMetadataFields catalog={catalog} value={values} onChange={setValues} errors={errors} disabled={saving} />
          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            <Button onClick={save} loading={saving} disabled={!dirty} leftIcon={<Save className="h-4 w-4" aria-hidden />}>
              Save changes
            </Button>
            {dirty && (
              <Button variant="ghost" onClick={() => { setValues(toForm(note)); setErrors({}); }}>
                Discard
              </Button>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="flex items-center gap-2 font-semibold text-text">
            <History className="h-4 w-4 text-primary" aria-hidden /> History
          </h2>
          {audit.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No history recorded.</p>
          ) : (
            <ol className="mt-3 space-y-2.5 border-l border-border pl-4">
              {audit.map((a) => (
                <li key={a.id} className="relative text-sm">
                  <span className="absolute -left-[1.3rem] top-1.5 h-2 w-2 rounded-full bg-primary" aria-hidden />
                  <span className="font-medium text-text">{auditLabel(a.action)}</span>
                  <span className="block text-xs text-text-3">
                    {a.actorEmail} · <RelativeTime iso={a.createdAt} />
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </div>
  );
}
