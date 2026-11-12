"use client";

import { BadgeCheck, Star } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Feedback";
import { api } from "@/lib/api-client";
import { FACULTY_PHOTO_OPTIONS } from "@/constants/images";
import type { Department, Faculty, University } from "@/types";
import { EntityManager } from "../EntityManager";
import type { FormValues } from "../EntityForm";

const blankToNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);

/** Bundled photos, plus the record's current value if it is an older external URL (so saving doesn't drop it). */
function photoOptions(v: FormValues) {
  const current = typeof v.imageUrl === "string" ? v.imageUrl : "";
  return current && !FACULTY_PHOTO_OPTIONS.some((o) => o.value === current) ? [{ value: current, label: `Current: ${current}` }, ...FACULTY_PHOTO_OPTIONS] : FACULTY_PHOTO_OPTIONS;
}

export function FacultyManager({ faculty, departments, universities }: { faculty: Faculty[]; departments: Department[]; universities: University[] }) {
  const deptLabel = (id: string) => departments.find((d) => d.id === id)?.shortName ?? "";
  return (
    <EntityManager<Faculty>
      noun="Faculty member"
      rows={faculty}
      emptyText="Add profiles using details from official MUJ sources only."
      drawerNote={
        <Alert variant="warning" title="Verify before publishing contact details">
          Contact details stay hidden until you tick “Verified”. Only tick it once the faculty member (or the department) has agreed to their email and phone being shown publicly — many numbers are personal mobiles.
        </Alert>
      }
      columns={[
        {
          header: "Name",
          cell: (r) => (
            <span className="flex flex-wrap items-center gap-1.5 font-medium text-text">
              {r.name}
              {r.isVerified && <BadgeCheck className="h-4 w-4 text-success" aria-label="Verified" />}
              {r.isFeatured && <Star className="h-3.5 w-3.5 text-warning" aria-label="Featured on homepage" />}
            </span>
          ),
        },
        { header: "Designation", cell: (r) => r.designation },
        { header: "Department", cell: (r) => r.departmentLabel },
        { header: "Contact", cell: (r) => (r.isVerified ? <span className="text-xs">{[r.email, r.phone].filter(Boolean).join(" · ") || "—"}</span> : <Badge variant="warning">Pending verification</Badge>) },
      ]}
      fields={[
        { name: "universityId", label: "University", type: "select", required: true, options: () => universities.map((u) => ({ value: u.id, label: u.name })), onChangeReset: ["departmentId"] },
        { name: "departmentId", label: "Department", type: "select", required: true, options: (v: FormValues) => departments.filter((d) => d.universityId === v.universityId).map((d) => ({ value: d.id, label: d.name })) },
        { name: "name", label: "Full name", type: "text", required: true, placeholder: "Dr. …" },
        { name: "designation", label: "Designation", type: "text", required: true, placeholder: "Associate Professor" },
        { name: "departmentLabel", label: "Department label", type: "text", hint: "Shown on cards. Defaults to the department's short name." },
        { name: "officeLocation", label: "Office", type: "text" },
        { name: "email", label: "Official email", type: "email" },
        { name: "phone", label: "Official phone", type: "tel" },
        { name: "profileUrl", label: "Official profile URL", type: "url", span: 2 },
        {
          name: "imageUrl",
          label: "Photo",
          type: "select",
          span: 2,
          placeholder: "No photo (default avatar)",
          options: photoOptions,
          hint: "Photos are bundled with the site because the free Spark plan has no file storage for uploads. To add one, put a square .webp in public/images/faculty, list it in src/constants/images.ts and redeploy.",
        },
        { name: "specializations", label: "Specializations", type: "tags", lowercase: false, max: 12 },
        { name: "bio", label: "Short bio", type: "textarea" },
        { name: "order", label: "Display order", type: "number", min: 0 },
        { name: "isVerified", label: "Verified: OK to show email and phone publicly", type: "checkbox", hint: "Tick only after the faculty member (or the department) has agreed." },
        { name: "isFeatured", label: "Feature on homepage", type: "checkbox" },
        { name: "isActive", label: "Active (visible)", type: "checkbox" },
      ]}
      emptyValues={() => ({
        universityId: universities[0]?.id ?? "",
        departmentId: departments[0]?.id ?? "",
        name: "",
        designation: "",
        departmentLabel: "",
        officeLocation: "",
        email: "",
        phone: "",
        profileUrl: "",
        imageUrl: "",
        specializations: [],
        bio: "",
        order: 0,
        isVerified: false,
        isFeatured: false,
        isActive: true,
      })}
      toValues={(r) => ({
        universityId: r.universityId,
        departmentId: r.departmentId,
        name: r.name,
        designation: r.designation,
        departmentLabel: r.departmentLabel,
        officeLocation: r.officeLocation ?? "",
        email: r.email ?? "",
        phone: r.phone ?? "",
        profileUrl: r.profileUrl ?? "",
        imageUrl: r.imageUrl ?? "",
        specializations: r.specializations,
        bio: r.bio ?? "",
        order: r.order,
        isVerified: r.isVerified,
        isFeatured: r.isFeatured,
        isActive: r.isActive,
      })}
      toBody={(v) => ({
        ...v,
        departmentLabel: String(v.departmentLabel || "").trim() || deptLabel(String(v.departmentId)),
        officeLocation: blankToNull(v.officeLocation),
        bio: blankToNull(v.bio),
        order: v.order === "" ? 0 : Number(v.order),
      })}
      validate={(v) => {
        const e: Record<string, string> = {};
        for (const k of ["universityId", "departmentId", "name", "designation"]) if (!v[k]) e[k] = "Required.";
        return e;
      }}
      create={(b) => api.faculty.create(b as never)}
      update={(id, b) => api.faculty.update(id, b as never)}
      remove={(id) => api.faculty.remove(id)}
    />
  );
}
