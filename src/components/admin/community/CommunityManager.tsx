"use client";

import * as React from "react";
import { Pin } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/lib/api-client";
import { cn, formatDate } from "@/lib/utils";
import { COMMUNITY_ITEM_TYPES, type Announcement, type CommunityItem } from "@/types";
import { EntityManager } from "../EntityManager";

const TYPE_LABEL: Record<string, string> = { event: "Event", "study-group": "Study group", project: "Project", discussion: "Discussion", link: "Link" };
const blankToNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);

export function CommunityManager({ announcements, items }: { announcements: Announcement[]; items: CommunityItem[] }) {
  const [tab, setTab] = React.useState<"announcements" | "items">("announcements");
  return (
    <div className="space-y-6">
      <div role="tablist" aria-label="Community" className="inline-flex rounded-xl border border-border bg-bg-2 p-1">
        {(
          [
            ["announcements", `Announcements (${announcements.length})`],
            ["items", `Community items (${items.length})`],
          ] as const
        ).map(([k, label]) => (
          <button key={k} role="tab" type="button" aria-selected={tab === k} onClick={() => setTab(k)} className={cn("rounded-lg px-4 py-1.5 text-sm font-semibold", tab === k ? "bg-primary/20 text-lavender" : "text-text-3 hover:text-text")}>
            {label}
          </button>
        ))}
      </div>

      {tab === "announcements" ? (
        <EntityManager<Announcement>
          noun="Announcement"
          rows={announcements}
          description="Shown at the top of the Community page. Pinned items come first."
          columns={[
            { header: "Title", cell: (r) => <span className="flex items-center gap-1.5 font-medium text-text">{r.isPinned && <Pin className="h-3.5 w-3.5 text-lavender" aria-label="Pinned" />}{r.title}</span> },
            { header: "Created", cell: (r) => formatDate(r.createdAt) },
          ]}
          fields={[
            { name: "title", label: "Title", type: "text", required: true, span: 2 },
            { name: "body", label: "Message", type: "textarea", required: true, rows: 5 },
            { name: "url", label: "Link (optional)", type: "url", span: 2 },
            { name: "isPinned", label: "Pin to top", type: "checkbox" },
            { name: "isActive", label: "Active", type: "checkbox" },
          ]}
          emptyValues={() => ({ title: "", body: "", url: "", isPinned: false, isActive: true })}
          toValues={(r) => ({ title: r.title, body: r.body, url: r.url ?? "", isPinned: r.isPinned, isActive: r.isActive })}
          toBody={(v) => ({ ...v })}
          validate={(v) => Object.fromEntries(["title", "body"].filter((k) => !String(v[k] ?? "").trim()).map((k) => [k, "Required."]))}
          create={(b) => api.announcements.create(b as never)}
          update={(id, b) => api.announcements.update(id, b as never)}
          remove={(id) => api.announcements.remove(id)}
        />
      ) : (
        <EntityManager<CommunityItem>
          noun="Community item"
          rows={items}
          description="Events, study groups, project calls, discussion channels and useful links."
          columns={[
            { header: "Title", cell: (r) => <span className="font-medium text-text">{r.title}</span> },
            { header: "Type", cell: (r) => <Badge variant="primary">{TYPE_LABEL[r.type]}</Badge> },
            { header: "Date", cell: (r) => (r.eventDate ? formatDate(r.eventDate) : "—") },
          ]}
          fields={[
            { name: "type", label: "Type", type: "select", required: true, options: () => COMMUNITY_ITEM_TYPES.map((t) => ({ value: t, label: TYPE_LABEL[t] })) },
            { name: "order", label: "Display order", type: "number", min: 0 },
            { name: "title", label: "Title", type: "text", required: true, span: 2 },
            { name: "description", label: "Description", type: "textarea", required: true },
            { name: "url", label: "Link", type: "url", span: 2 },
            { name: "eventDate", label: "Event date", type: "date" },
            { name: "location", label: "Location", type: "text" },
            { name: "isActive", label: "Active", type: "checkbox" },
          ]}
          emptyValues={() => ({ type: "event", order: 0, title: "", description: "", url: "", eventDate: "", location: "", isActive: true })}
          toValues={(r) => ({ type: r.type, order: r.order, title: r.title, description: r.description, url: r.url ?? "", eventDate: r.eventDate ? r.eventDate.slice(0, 10) : "", location: r.location ?? "", isActive: r.isActive })}
          toBody={(v) => ({ ...v, order: v.order === "" ? 0 : Number(v.order), location: blankToNull(v.location) })}
          validate={(v) => Object.fromEntries(["title", "description"].filter((k) => !String(v[k] ?? "").trim()).map((k) => [k, "Required."]))}
          create={(b) => api.community.create(b as never)}
          update={(id, b) => api.community.update(id, b as never)}
          remove={(id) => api.community.remove(id)}
        />
      )}
    </div>
  );
}
