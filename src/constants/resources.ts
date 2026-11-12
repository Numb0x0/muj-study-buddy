import type { ResourceType } from "@/types/note";

export interface ResourceTypeMeta {
  value: ResourceType;
  label: string;
  plural: string;
  description: string;
  /** lucide icon name, resolved by components/ui/ResourceTypeIcon */
  icon: "BookOpen" | "FileText" | "ClipboardList" | "FlaskConical" | "Beaker" | "MessageCircleQuestion" | "Library" | "ScrollText" | "File";
}

export const RESOURCE_TYPE_META: Record<ResourceType, ResourceTypeMeta> = {
  notes: { value: "notes", label: "Notes", plural: "Semester Notes", description: "Subject-wise, well organized notes.", icon: "BookOpen" },
  pyq: { value: "pyq", label: "Previous Year Paper", plural: "Previous Year Papers", description: "PYQs to help you prepare better.", icon: "FileText" },
  assignment: { value: "assignment", label: "Assignment", plural: "Assignments", description: "References, solutions and submission guides.", icon: "ClipboardList" },
  "lab-manual": { value: "lab-manual", label: "Lab Manual", plural: "Lab Manuals", description: "Lab manuals and procedures.", icon: "FlaskConical" },
  "lab-experiment": { value: "lab-experiment", label: "Lab Experiment", plural: "Lab Experiments", description: "Experiment write-ups and code.", icon: "Beaker" },
  viva: { value: "viva", label: "Viva Questions", plural: "Viva Questions", description: "Viva preparation question banks.", icon: "MessageCircleQuestion" },
  reference: { value: "reference", label: "Reference", plural: "Reference Material", description: "Extra reading and references.", icon: "Library" },
  syllabus: { value: "syllabus", label: "Syllabus", plural: "Syllabus Documents", description: "Official course syllabus.", icon: "ScrollText" },
  other: { value: "other", label: "Other", plural: "Other Resources", description: "Miscellaneous resources.", icon: "File" },
};

export const RESOURCE_TYPE_OPTIONS = Object.values(RESOURCE_TYPE_META).map((m) => ({ value: m.value, label: m.label }));

/** Public filter options: the "lab" umbrella (manuals + experiments + viva) plus every concrete type. */
export const SEARCH_TYPE_OPTIONS = [{ value: "lab", label: "Lab resources (all)" }, ...RESOURCE_TYPE_OPTIONS];

/** The 4 big cards on the homepage ("Your Academic Space"). */
export const ACADEMIC_SPACE_CARDS = [
  { title: "Semester Notes", description: "Subject-wise, well-organised notes for every semester.", href: "/resources?type=notes", icon: "BookOpen" },
  { title: "Previous Year Papers", description: "PYQs to help you prepare better.", href: "/resources?type=pyq", icon: "FileText" },
  { title: "Assignments", description: "References, solutions and submission guides.", href: "/resources?type=assignment", icon: "ClipboardList" },
  { title: "Lab Resources", description: "Lab manuals, experiments, code and viva questions.", href: "/resources?type=lab", icon: "FlaskConical" },
] as const;

/** "Lab Resources" is an umbrella over several concrete types. */
export const LAB_RESOURCE_TYPES: ResourceType[] = ["lab-manual", "lab-experiment", "viva"];

export const DEFAULT_PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 50;
