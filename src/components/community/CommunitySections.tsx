import { CalendarDays, ExternalLink, FolderGit2, Link2, MapPin, MessagesSquare, Pin, Users, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import type { Announcement, CommunityItem, CommunityItemType } from "@/types";

export const COMMUNITY_SECTIONS: { type: CommunityItemType; title: string; empty: string; Icon: LucideIcon }[] = [
  { type: "event", title: "Events", empty: "No upcoming events listed.", Icon: CalendarDays },
  { type: "study-group", title: "Study Groups", empty: "No study groups listed yet.", Icon: Users },
  { type: "project", title: "Project Collaboration", empty: "No open projects listed yet.", Icon: FolderGit2 },
  { type: "discussion", title: "Discussions", empty: "No discussion channels listed yet.", Icon: MessagesSquare },
  { type: "link", title: "Useful Links", empty: "No links added yet.", Icon: Link2 },
];

export function AnnouncementList({ items }: { items: Announcement[] }) {
  if (items.length === 0) return <p className="rounded-xl border border-dashed border-border-2 p-5 text-sm text-text-3">No announcements right now.</p>;
  return (
    <ul className="space-y-3">
      {items.map((a) => (
        <li key={a.id} className={`card-surface p-5 ${a.isPinned ? "border-primary/40" : ""}`}>
          <div className="flex flex-wrap items-center gap-2">
            {a.isPinned && (
              <Badge variant="primary">
                <Pin className="h-3 w-3" aria-hidden /> Pinned
              </Badge>
            )}
            <span className="text-xs text-text-3">{formatDate(a.createdAt)}</span>
          </div>
          <h3 className="mt-2 font-semibold text-text">{a.title}</h3>
          <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-text-2">{a.body}</p>
          {a.url && (
            <a href={a.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-lavender hover:underline">
              Learn more <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}

export function CommunityItemCard({ item }: { item: CommunityItem }) {
  return (
    <article className="card-surface flex h-full flex-col p-5">
      <h3 className="font-semibold text-text">{item.title}</h3>
      {(item.eventDate || item.location) && (
        <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-3">
          {item.eventDate && (
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden />
              {formatDate(item.eventDate, { weekday: "short" })}
            </span>
          )}
          {item.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" aria-hidden />
              {item.location}
            </span>
          )}
        </p>
      )}
      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-text-2">{item.description}</p>
      {item.url && (
        <a href={item.url} target="_blank" rel="noopener noreferrer" className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-lavender hover:underline">
          Open link <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      )}
    </article>
  );
}
