"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Feedback";
import { HARD_MAX_UPLOAD_MB } from "@/constants/upload";
import { CAMPUS_IMAGE_OPTIONS } from "@/constants/images";
import { api, errorMessage, isApiClientError } from "@/lib/api-client";
import { canOptimizeImage } from "@/lib/images";
import { formatBytes } from "@/lib/utils";
import type { Program, SiteSettings } from "@/types";
import { useToast } from "../Toast";

const CUSTOM_HERO = "__custom__";
/** Spark-plan Firestore storage quota (whole database, including PDF chunks). */
const SPARK_FIRESTORE_BYTES = 1024 ** 3;

const heroModeOf = (url: string | null) => (!url ? "" : CAMPUS_IMAGE_OPTIONS.some((o) => o.value === url) ? url : CUSTOM_HERO);

export function SettingsForm({ settings, programs, storedBytes }: { settings: SiteSettings; programs: Program[]; storedBytes: number | null }) {
  const router = useRouter();
  const toast = useToast();
  const [heroMode, setHeroMode] = React.useState(() => heroModeOf(settings.heroImageUrl));
  const [v, setV] = React.useState({
    siteName: settings.siteName,
    tagline: settings.tagline,
    contactEmail: settings.contactEmail ?? "",
    maxUploadMb: String(settings.maxUploadMb),
    heroImageUrl: settings.heroImageUrl ?? "",
    defaultProgramId: settings.defaultProgramId ?? "",
    announcementBanner: settings.announcementBanner ?? "",
    socialLinks: settings.socialLinks,
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const set = (patch: Partial<typeof v>) => setV((s) => ({ ...s, ...patch }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const mb = Number(v.maxUploadMb);
    if (!Number.isFinite(mb) || mb < 1 || mb > HARD_MAX_UPLOAD_MB) {
      setErrors({ maxUploadMb: `Between 1 and ${HARD_MAX_UPLOAD_MB} MB.` });
      return;
    }
    setSaving(true);
    setErrors({});
    try {
      await api.settings.update({
        siteName: v.siteName,
        tagline: v.tagline,
        contactEmail: v.contactEmail,
        maxUploadMb: mb,
        allowedMimeTypes: ["application/pdf"],
        heroImageUrl: v.heroImageUrl,
        defaultProgramId: v.defaultProgramId || null,
        announcementBanner: v.announcementBanner.trim() || null,
        socialLinks: v.socialLinks.filter((l) => l.label.trim() && l.url.trim()),
      });
      toast.success("Settings saved");
      router.refresh();
    } catch (err) {
      if (isApiClientError(err)) setErrors(err.fieldErrors);
      toast.error("Couldn't save settings", errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="grid gap-6 xl:grid-cols-[1fr_22rem]" noValidate>
      <div className="space-y-6">
        <Card className="space-y-4">
          <h2 className="font-semibold text-text">General</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Site name" value={v.siteName} onChange={(e) => set({ siteName: e.target.value })} error={errors.siteName} required />
            <Input label="Public contact email" type="email" value={v.contactEmail} onChange={(e) => set({ contactEmail: e.target.value })} error={errors.contactEmail} hint="Shown on the Contact page and footer. Leave blank to hide." />
          </div>
          <Input label="Tagline" value={v.tagline} onChange={(e) => set({ tagline: e.target.value })} error={errors.tagline} required />
          <Textarea label="Site-wide announcement banner" rows={2} maxLength={240} value={v.announcementBanner} onChange={(e) => set({ announcementBanner: e.target.value })} hint="Leave empty for no banner. Visitors can dismiss it." />
          <Select label="Default program (pre-selected when uploading)" value={v.defaultProgramId} onChange={(e) => set({ defaultProgramId: e.target.value })} options={programs.map((p) => ({ value: p.id, label: p.name }))} placeholder="None" />
        </Card>

        <Card className="space-y-4">
          <h2 className="font-semibold text-text">Homepage image</h2>
          <Select
            label="Hero image"
            value={heroMode}
            onChange={(e) => {
              const mode = e.target.value;
              setHeroMode(mode);
              set({ heroImageUrl: mode === CUSTOM_HERO ? (/^https?:\/\//.test(v.heroImageUrl) ? v.heroImageUrl : "") : mode });
            }}
            options={[...CAMPUS_IMAGE_OPTIONS, { value: CUSTOM_HERO, label: "Custom image URL…" }]}
            placeholder="Default (bundled campus photo)"
            error={heroMode === CUSTOM_HERO ? undefined : errors.heroImageUrl}
            hint="Campus photos are bundled with the site — the free Spark plan has no file storage for image uploads. To add another, put it in public/images/campus and list it in src/constants/images.ts."
          />
          {heroMode === CUSTOM_HERO && (
            <Input label="Image URL" type="url" value={v.heroImageUrl} onChange={(e) => set({ heroImageUrl: e.target.value })} error={errors.heroImageUrl} hint="An http(s) link to a campus photo you're allowed to use." />
          )}
          {v.heroImageUrl && (v.heroImageUrl.startsWith("/") || /^https?:\/\//.test(v.heroImageUrl)) && (
            <div className="relative aspect-[3/2] max-w-md overflow-hidden rounded-xl border border-border">
              <Image src={v.heroImageUrl} alt="Hero image preview" fill sizes="28rem" className="object-cover" unoptimized={!canOptimizeImage(v.heroImageUrl)} />
            </div>
          )}
        </Card>

        <Card className="space-y-3">
          <h2 className="font-semibold text-text">Social links</h2>
          {v.socialLinks.map((l, i) => (
            <div key={i} className="grid grid-cols-[1fr_2fr_2.5rem] gap-2">
              <input aria-label="Label" className="field" placeholder="Instagram" value={l.label} onChange={(e) => set({ socialLinks: v.socialLinks.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
              <input aria-label="URL" className="field" placeholder="https://…" value={l.url} onChange={(e) => set({ socialLinks: v.socialLinks.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)) })} />
              <button type="button" aria-label="Remove link" onClick={() => set({ socialLinks: v.socialLinks.filter((_, j) => j !== i) })} className="inline-flex items-center justify-center rounded-xl text-text-3 hover:bg-danger/10 hover:text-danger">
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ))}
          <Button size="sm" variant="secondary" onClick={() => set({ socialLinks: [...v.socialLinks, { label: "", url: "" }] })} disabled={v.socialLinks.length >= 10} leftIcon={<Plus className="h-4 w-4" aria-hidden />}>
            Add link
          </Button>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="space-y-4">
          <h2 className="font-semibold text-text">Uploads</h2>
          <Input label="Max PDF size (MB)" type="number" min={1} max={HARD_MAX_UPLOAD_MB} value={v.maxUploadMb} onChange={(e) => set({ maxUploadMb: e.target.value })} error={errors.maxUploadMb} hint={`Hard ceiling is ${HARD_MAX_UPLOAD_MB} MB (HARD_MAX_UPLOAD_MB), enforced by the upload API.`} />
          <p className="text-xs text-muted">Allowed type: PDF only.</p>
          {storedBytes !== null && (
            <div className="rounded-xl border border-border bg-bg-2/60 p-3 text-sm">
              <p className="font-medium text-text">Stored PDFs: {formatBytes(storedBytes)}</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border" aria-hidden>
                <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.max(1, (storedBytes / SPARK_FIRESTORE_BYTES) * 100))}%` }} />
              </div>
              <p className="mt-2 text-xs text-text-3">
                PDFs are stored in Firestore. On the free Spark plan the whole database is limited to 1 GiB, so this is {((storedBytes / SPARK_FIRESTORE_BYTES) * 100).toFixed(1)}% of it. Delete unused drafts or run <code>npm run cleanup:orphans</code> to free space.
              </p>
            </div>
          )}
        </Card>
        <Card>
          <h2 className="font-semibold text-text">Administrator accounts</h2>
          <p className="mt-2 text-sm text-text-3">For security there&apos;s no way to add admins from the website. The project owner grants or removes access from a terminal:</p>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-bg-2 p-3 text-xs text-lavender">
            npm run admin:grant -- name@gmail.com{"\n"}npm run admin:revoke -- name@gmail.com{"\n"}npm run admin:list
          </pre>
        </Card>
        {Object.keys(errors).length > 0 && !errors.maxUploadMb && <Alert variant="danger">Please fix the highlighted fields.</Alert>}
        <Button type="submit" loading={saving} className="w-full" leftIcon={<Save className="h-4 w-4" aria-hidden />}>
          Save settings
        </Button>
      </div>
    </form>
  );
}
