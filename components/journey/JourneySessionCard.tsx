"use client";

import Link from "next/link";
import type { SessionState, ItemState } from "@/lib/progress/journey";
import { applyKey } from "@/lib/progress/journey";
import { useProgress } from "@/lib/progress/ProgressProvider";
import { Icon } from "@/components/ui/Icon";

const statusIcon: Record<ItemState["status"], { cls: string; icon?: "check" }> = {
  done: { cls: "bg-ok-soft text-ok", icon: "check" },
  "in-progress": { cls: "bg-amber-soft text-amber" },
  todo: { cls: "bg-surface-2 text-ink-3" },
  planned: { cls: "border border-dashed border-line-2 text-ink-3" },
};

/** The checklist for one journey session. Career actions are ticked here; everything else links to its screen. */
export function JourneySessionChecklist({ ss, compact = false }: { ss: SessionState; compact?: boolean }) {
  const { store } = useProgress();
  return (
    <ol className="divide-y divide-line" data-testid={`session-${ss.session.session}-items`}>
      {ss.items.map((it, i) => {
        const s = statusIcon[it.status];
        const isApply = it.item.kind === "apply";
        const body = (
          <span className="min-w-0 flex-1">
            <span className={`block text-[15px] ${it.done ? "text-ink-2 line-through decoration-line-2" : "font-medium"}`}>{it.title}</span>
            <span className="block text-xs text-ink-3">
              {it.kindLabel} · {it.minutes} min
              {!compact && !isApply && it.detail ? ` · ${it.detail}` : ""}
            </span>
            {!compact && isApply && it.detail && <span className="mt-1 block text-sm text-ink-2">{it.detail}</span>}
            {it.item.kind === "apply" && it.item.href && (
              <Link href={it.item.href} className="mt-1 inline-block text-sm font-semibold text-accent underline underline-offset-2" data-testid={`apply-link-${it.item.id}`}>
                Open the portfolio track
              </Link>
            )}
          </span>
        );
        const inner = (
          <>
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${s.cls}`} aria-hidden>
              {s.icon ? <Icon name="check" size={14} /> : i + 1}
            </span>
            {body}
          </>
        );
        if (it.item.kind === "apply") {
          const key = applyKey(ss.session.session, it.item.id);
          return (
            <li key={it.key}>
              <label className="flex cursor-pointer items-start gap-3 px-4 py-3 hover:bg-surface-2">
                <input type="checkbox" checked={it.done} onChange={(e) => store.setApplyDone(key, e.target.checked)} className="mt-1.5 h-4 w-4 shrink-0 accent-[var(--c-accent)]" aria-label={`${it.title}: mark done`} data-testid={`apply-${it.item.id}`} />
                {body}
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
