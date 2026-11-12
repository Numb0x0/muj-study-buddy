import type { MetadataRoute } from "next";
import { SITE } from "@/constants/site";
import { getCatalogTree, EMPTY_CATALOG } from "@/lib/queries/catalog";
import { getRecentNotes } from "@/lib/queries/notes";
import { tryQuery } from "@/lib/queries/safe";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE.url.replace(/\/$/, "");
  const now = new Date();
  const staticRoutes = ["", "/resources", "/curriculum", "/programs", "/faculty", "/tools", "/community", "/about", "/contact", "/how-it-works", "/privacy", "/disclaimer"];
  const entries: MetadataRoute.Sitemap = staticRoutes.map((p) => ({ url: `${base}${p}`, lastModified: now, changeFrequency: "weekly", priority: p === "" ? 1 : 0.7 }));

  const [catalog, notes] = await Promise.all([tryQuery(() => getCatalogTree(), EMPTY_CATALOG), tryQuery(() => getRecentNotes(200), [])]);
  for (const p of catalog.programs) entries.push({ url: `${base}/programs/${p.id}`, lastModified: new Date(p.updatedAt), changeFrequency: "monthly", priority: 0.6 });
  for (const s of catalog.semesters) entries.push({ url: `${base}/semesters/${s.id}`, lastModified: new Date(s.updatedAt), changeFrequency: "monthly", priority: 0.5 });
  for (const s of catalog.subjects) entries.push({ url: `${base}/subjects/${s.id}`, lastModified: new Date(s.updatedAt), changeFrequency: "weekly", priority: 0.6 });
  for (const n of notes) entries.push({ url: `${base}/notes/${n.id}`, lastModified: new Date(n.updatedAt), changeFrequency: "monthly", priority: 0.5 });
  return entries;
}
