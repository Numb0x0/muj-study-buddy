import * as React from "react";
import { cn } from "@/lib/utils";

export function Container({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("container-page", className)} {...rest} />;
}
