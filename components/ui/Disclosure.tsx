import type { ReactNode } from "react";

export function Disclosure({ title, children, className = "", defaultOpen = false }: { title: string; children: ReactNode; className?: string; defaultOpen?: boolean }) {
  return (
    <details className={`group rounded-xl border border-line bg-surface-2/60 ${className}`} open={defaultOpen || undefined}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-[15px] font-semibold text-ink marker:hidden [&::-webkit-details-marker]:hidden">
        <span>{title}</span>
        <span aria-hidden className="text-ink-3 transition-transform group-open:rotate-180">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6l5 5 5-5" />
          </svg>
        </span>
      </summary>
      <div className="px-4 pb-4">{children}</div>
    </details>
  );
}
