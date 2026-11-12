import Image from "next/image";
import { UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { canOptimizeImage } from "@/lib/images";

interface Props {
  name: string;
  imageUrl: string | null;
  size?: "md" | "lg";
  className?: string;
}

export function FacultyAvatar({ name, imageUrl, size = "md", className }: Props) {
  const px = size === "lg" ? 112 : 64;
  const dims = size === "lg" ? "h-24 w-24 sm:h-28 sm:w-28" : "h-16 w-16";

  if (imageUrl) {
    return (
      <div className={cn("relative shrink-0 overflow-hidden rounded-full border border-primary/40 bg-bg-2 shadow-glow-sm", dims, className)}>
        <Image
          src={imageUrl}
          alt={`Portrait of ${name}`}
          width={px}
          height={px}
          sizes={`${px}px`}
          className="h-full w-full object-cover"
          unoptimized={!canOptimizeImage(imageUrl)}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border border-primary/40 bg-gradient-to-br from-primary/40 via-primary-2/30 to-bg-2 text-lavender shadow-glow-sm",
        dims,
        className,
      )}
      role="img"
      aria-label={`${name} (no photo)`}
    >
      <UserRound className={size === "lg" ? "h-11 w-11" : "h-7 w-7"} aria-hidden />
    </div>
  );
}
