import { Compass, GraduationCap, type LucideProps } from "lucide-react";
import { RESOURCE_TYPE_META } from "@/constants/resources";
import { IconByName } from "@/components/ui/ResourceTypeIcon";
import type { ResourceType } from "@/types/note";
import { pathOf } from "./nav-utils";

/** Picks a representative icon for a Resources sub-link from its href. */
export function NavChildIcon({ href, ...props }: LucideProps & { href: string }) {
  const query = href.split("?")[1];
  const type = query ? new URLSearchParams(query).get("type") : null;
  if (type === "lab") return <IconByName name="FlaskConical" {...props} />;
  if (type && type in RESOURCE_TYPE_META) return <IconByName name={RESOURCE_TYPE_META[type as ResourceType].icon} {...props} />;
  if (pathOf(href) === "/programs") return <GraduationCap {...props} />;
  return <Compass {...props} />;
}
