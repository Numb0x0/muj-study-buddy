import { Beaker, BookOpen, ClipboardList, File, FileText, FlaskConical, Library, MessageCircleQuestion, ScrollText, type LucideProps } from "lucide-react";
import { RESOURCE_TYPE_META } from "@/constants/resources";
import type { ResourceType } from "@/types/note";

const ICONS = { BookOpen, FileText, ClipboardList, FlaskConical, Beaker, MessageCircleQuestion, Library, ScrollText, File } as const;

export type IconName = keyof typeof ICONS;

export function IconByName({ name, ...props }: LucideProps & { name: IconName | string }) {
  const Icon = (ICONS as Record<string, typeof File>)[name] ?? File;
  return <Icon {...props} />;
}

export function ResourceTypeIcon({ type, ...props }: LucideProps & { type: ResourceType }) {
  return <IconByName name={RESOURCE_TYPE_META[type]?.icon ?? "File"} {...props} />;
}
