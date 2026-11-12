import * as React from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "danger" | "link";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-primary to-primary-2 text-white shadow-[0_8px_24px_-8px_rgba(168,85,247,0.7)] hover:shadow-[0_10px_32px_-6px_rgba(168,85,247,0.85)] hover:brightness-110",
  secondary: "bg-surface-2 text-text border border-border hover:border-primary/50 hover:bg-surface",
  outline: "border border-border-2 bg-transparent text-text hover:border-primary/60 hover:bg-primary/10",
  ghost: "bg-transparent text-text-2 hover:bg-white/5 hover:text-text",
  danger: "bg-danger/15 text-danger border border-danger/30 hover:bg-danger/25",
  link: "bg-transparent text-primary underline-offset-4 hover:underline px-0 h-auto",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
  icon: "h-10 w-10 p-0",
};

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

type ButtonAsButton = CommonProps & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps> & { href?: undefined };
type ButtonAsLink = CommonProps & Omit<React.ComponentProps<typeof Link>, keyof CommonProps> & { href: string };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

export function Button(props: ButtonProps) {
  const { variant = "primary", size = "md", loading, leftIcon, rightIcon, className, children, ...rest } = props;
  const classes = cn(base, variants[variant], sizes[size], className);
  const content = (
    <>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </>
  );
  if ("href" in rest && rest.href !== undefined) {
    const { href, ...linkRest } = rest as ButtonAsLink;
    // API routes, downloads and external URLs must be plain anchors (no client-side routing).
    const plain = "download" in linkRest || href.startsWith("/api/") || /^(https?:|mailto:|tel:)/.test(href);
    if (plain) {
      const { prefetch: _prefetch, replace: _replace, scroll: _scroll, ...anchorRest } = linkRest as Record<string, unknown>;
      void _prefetch;
      void _replace;
      void _scroll;
      return (
        <a href={href} className={classes} {...(anchorRest as React.AnchorHTMLAttributes<HTMLAnchorElement>)}>
          {content}
        </a>
      );
    }
    return (
      <Link href={href} className={classes} {...linkRest}>
        {content}
      </Link>
    );
  }
  const { type = "button", disabled, ...btnRest } = rest as ButtonAsButton;
  return (
    <button type={type} className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...btnRest}>
      {content}
    </button>
  );
}
