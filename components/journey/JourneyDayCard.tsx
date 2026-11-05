"use client";

import Link from "next/link";
import type { DayState, ItemState } from "@/lib/progress/journey";
import { applyKey } from "@/lib/progress/journey";
import { useProgress } from "@/lib/progress/ProgressProvider";
import { Icon } from "@/components/ui/Icon";

const statusIcon: Record<ItemState["status"], { cls: string; icon?: "check" }> = {
  done: { cls: "bg-ok-soft text-ok", icon: "check" },
  "in-progress": { cls: "bg-amber-soft text-amber" },
  todo: { cls: "bg-surface-2 text-ink-3" },
  planned: { cls: "border border-dashed border-line-2 text-ink-3" },
};

/** The checklist for one journey day. Career actions are ticked here; everything else links to its screen. */
export function JourneyDayChecklist({ ds, compact = false }: { ds: DayState; compact?: boolean }) {
  const { store } = useProgress();
  return (
    <ol className="divide-y divide-line" data-testid={`day-${ds.day.day}-items`}>
      {ds.items.map((it, i) => {
        const s = statusIcon[it.status];
        const inner = (
          <>
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${s.cls}`} aria-hidden>
              {s.icon ? <Icon name="check" size={14} /> : i + 1}
            </span>
            <span className="min-w-0 flex-1">
              <span className={`block text-[15px] ${it.done ? "text-ink-2 line-through decoration-line-2" : "font-medium"}`}>{it.title}</span>
              <span className="block text-xs text-ink-3">
                {it.kindLabel} · {it.minutes} min
                {!compact && it.detail ? ` · ${it.detail}` : ""}
              </span>
            </span>
          </>
        );
        if (it.item.kind === "apply") {
          const key = applyKey(ds.day.day, it.item.id);
          return (
            <li key={it.key}>
              <label className="flex cursor-pointer items-start gap-3 px-4 py-3 hover:bg-surface-2">
                <input type="checkbox" checked={it.done} onChange={(e) => store.setApplyDone(key, e.target.checked)} className="mt-1.5 h-4 w-4 shrink-0 accent-[var(--c-accent)]" aria-label={`${it.title}: mark done`} data-testid={`apply-${it.item.id}`} />
                <span className="min-w-0 flex-1">
                  <span className={`block text-[15px] ${it.done ? "text-ink-2 line-through decoration-line-2" : "font-medium"}`}>{it.title}</span>
                  <span className="block text-xs text-ink-3">
                    {it.kindLabel} · {it.minutes} min
                  </span>
                  {!compact && it.detail && <span className="mt-1 block text-sm text-ink-2">{it.detail}</span>}
                </span>
              </label>
            </li>
          );
        }
        if (!it.available || !it.href) {
          return (
            <li key={it.key} className="flex items-start gap-3 px-4 py-3 text-ink-3">
              {inner}
              <span className="shrink-0 rounded-full border border-dashed border-line px-2 py-0.5 text-[10px] font-semibold">Coming soon</span>
            </li>
          );
        }
        return (
          <li key={it.key}>
            <Link href={it.href} className="flex items-start gap-3 px-4 py-3 hover:bg-surface-2">
              {inner}
              <Icon name="chevron-right" size={18} className="mt-1 shrink-0 text-ink-3" />
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
