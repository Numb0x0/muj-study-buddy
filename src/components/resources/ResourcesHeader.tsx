"use client";

import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { RESOURCE_TYPE_META } from "@/constants/resources";
import type { ResourceType } from "@/types";

/**
 * Heading for /resources that follows the *current* type filter. The explorer
 * updates the URL with history.replaceState (no server round-trip), and
 * useSearchParams picks that up, so the title never goes stale.
 */
export function ResourcesHeader() {
  const type = useSearchParams().get("type") ?? "";
  const meta = type && type in RESOURCE_TYPE_META ? RESOURCE_TYPE_META[type as ResourceType] : null;
  const isLab = type === "lab";
  const title = isLab ? "Lab Resources" : (meta?.plural ?? "All Resources");
  const description = isLab
    ? "Lab manuals, experiments, code and viva questions — filter by program, semester and subject."
    : (meta?.description ?? "Notes, previous year papers, assignments and lab material — search by title, subject, course code, unit or tag.");
  const typed = isLab || Boolean(meta);
  return (
    <PageHeader
      eyebrow="Resource library"
      title={title}
      description={description}
      crumbs={typed ? [{ label: "Resources", href: "/resources" }, { label: title }] : [{ label: "Resources" }]}
    />
  );
}
