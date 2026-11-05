import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "lg" | "sm";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors select-none disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap";
const variants: Record<Variant, string> = {
  primary: "bg-accent text-on-accent hover:bg-accent-strong active:bg-accent-strong",
  secondary: "bg-surface text-ink border border-line-2 hover:bg-surface-2",
  ghost: "bg-transparent text-accent hover:bg-accent-soft",
  danger: "bg-danger-soft text-danger border border-transparent hover:border-danger",
};
const sizes: Record<Size, string> = {
  sm: "text-sm px-3 py-1.5 min-h-9",
  md: "text-[15px] px-4 py-2.5 min-h-11",
  lg: "text-base px-5 py-3 min-h-12 w-full sm:w-auto",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra = "") {
  return `${base} ${variants[variant]} ${sizes[size]} ${extra}`;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; children: ReactNode }) {
  return (
    <button type="button" className={buttonClass(variant, size, className)} {...rest}>
      {children}
    </button>
  );
}

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...rest
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
  "aria-label"?: string;
}) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)} {...rest}>
      {children}
    </Link>
  );
}
