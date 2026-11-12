/**
 * Search tokens for a note. Kept free of server-only imports so CLI scripts
 * (scripts/reindex-notes.ts) and the server share one definition.
 */
import { RESOURCE_TYPE_META } from "@/constants/resources";
import type { ResourceType } from "@/types/note";
import { buildSearchTokens } from "./search";

export interface TokenSource {
  title: string;
  description: string;
  subjectName: string;
  subjectCode: string;
  unitNumber: number | null;
  unitTitle: string | null;
  resourceType: ResourceType;
  tags: string[];
  programShortName?: string;
}

export function computeSearchTokens(n: TokenSource): string[] {
  const meta = RESOURCE_TYPE_META[n.resourceType];
  return buildSearchTokens(
    [
      n.title,
      n.subjectCode,
      n.subjectName,
      n.unitNumber ? `unit ${n.unitNumber}` : null,
      n.unitTitle,
      meta?.label,
      meta?.plural,
      ...n.tags,
      n.programShortName,
    ],
    [n.description],
  );
}
