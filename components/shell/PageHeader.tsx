import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, lede, action }: { eyebrow?: string; title: string; lede?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-2">
      {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">{eyebrow}</p>}
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-[26px] font-bold leading-tight tracking-tight text-ink md:text-3xl">{title}</h1>
        {action}
      </div>
      {lede && <div className="text-[15px] leading-relaxed text-ink-2">{lede}</div>}
    </div>
  );
}
