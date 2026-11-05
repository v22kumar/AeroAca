import type { ItemStatus } from "@/lib/progress/selectors";

type Kind = ItemStatus | "planned" | "reviewed" | "draft" | "simulated";

const styles: Record<Kind, { label: string; cls: string }> = {
  "not-started": { label: "Not started", cls: "bg-surface-2 text-ink-2 border-line" },
  "in-progress": { label: "In progress", cls: "bg-amber-soft text-amber border-transparent" },
  completed: { label: "Completed", cls: "bg-ok-soft text-ok border-transparent" },
  planned: { label: "Coming soon", cls: "bg-transparent text-ink-3 border-line border-dashed" },
  reviewed: { label: "Technically reviewed", cls: "bg-accent-soft text-accent border-transparent" },
  draft: { label: "Draft", cls: "bg-amber-soft text-amber border-transparent" },
  simulated: { label: "Simulated readings", cls: "bg-surface-2 text-ink-2 border-line" },
};

export function StatusPill({ kind, className = "" }: { kind: Kind; className?: string }) {
  const s = styles[kind];
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${s.cls} ${className}`}>
      {s.label}
    </span>
  );
}
