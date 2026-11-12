"use client";

import * as React from "react";
import { Archive, EyeOff, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api, errorMessage } from "@/lib/api-client";
import type { Note } from "@/types";
import { ConfirmInline } from "../ConfirmInline";
import { useToast } from "../Toast";

type Action = "publish" | "unpublish" | "archive" | "delete";

/** Publish / unpublish / archive / delete with inline confirmation for destructive actions. */
export function NoteActions({ note, onChanged, onDeleted, size = "sm" }: { note: Pick<Note, "id" | "title" | "status">; onChanged: (n: Note) => void; onDeleted: () => void; size?: "sm" | "md" }) {
  const toast = useToast();
  const [busy, setBusy] = React.useState<Action | null>(null);
  const [confirm, setConfirm] = React.useState<Action | null>(null);

  const run = async (action: Action) => {
    setBusy(action);
    try {
      if (action === "delete") {
        await api.adminNotes.remove(note.id);
        toast.success("Deleted", note.title);
        onDeleted();
      } else {
        const { note: updated } = await api.adminNotes[action](note.id);
        toast.success(action === "publish" ? "Published" : action === "unpublish" ? "Moved back to drafts" : "Archived", note.title);
        onChanged(updated);
      }
      setConfirm(null);
    } catch (err) {
      toast.error(`Couldn't ${action}`, errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  if (confirm) {
    const msg =
      confirm === "delete"
        ? `Delete “${note.title}” and its file permanently?`
        : confirm === "unpublish"
          ? "Unpublish? Students will lose access immediately."
          : "Archive? It will be hidden from students and kept privately.";
    return <ConfirmInline message={msg} confirmLabel={confirm === "delete" ? "Delete" : confirm === "unpublish" ? "Unpublish" : "Archive"} danger={confirm === "delete"} loading={busy === confirm} onConfirm={() => run(confirm)} onCancel={() => setConfirm(null)} />;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {note.status !== "published" && (
        <Button size={size} onClick={() => void run("publish")} loading={busy === "publish"} leftIcon={<Send className="h-3.5 w-3.5" aria-hidden />}>
          Publish
        </Button>
      )}
      {note.status === "published" && (
        <Button size={size} variant="secondary" onClick={() => setConfirm("unpublish")} leftIcon={<EyeOff className="h-3.5 w-3.5" aria-hidden />}>
          Unpublish
        </Button>
      )}
      {note.status !== "archived" && (
        <Button size={size} variant="ghost" onClick={() => setConfirm("archive")} leftIcon={<Archive className="h-3.5 w-3.5" aria-hidden />}>
          Archive
        </Button>
      )}
      <Button size={size} variant="danger" onClick={() => setConfirm("delete")} leftIcon={<Trash2 className="h-3.5 w-3.5" aria-hidden />} aria-label={`Delete ${note.title}`}>
        <span className="sr-only sm:not-sr-only">Delete</span>
      </Button>
    </div>
  );
}
