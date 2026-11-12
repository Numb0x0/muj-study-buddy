import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import type { NoteStatus } from "@/types/note";

const STATUS: Record<NoteStatus, { label: string; variant: BadgeVariant }> = {
  draft: { label: "Draft", variant: "warning" },
  published: { label: "Published", variant: "success" },
  archived: { label: "Archived", variant: "default" },
};

export function StatusBadge({ status, className }: { status: NoteStatus; className?: string }) {
  const s = STATUS[status] ?? { label: status, variant: "default" as const };
  return (
    <Badge variant={s.variant} className={className}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {s.label}
    </Badge>
  );
}

export function ActiveBadge({ active }: { active: boolean }) {
  return <Badge variant={active ? "success" : "default"}>{active ? "Active" : "Inactive"}</Badge>;
}
