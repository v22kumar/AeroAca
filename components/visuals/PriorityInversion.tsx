"use client";

import { useState } from "react";

const CS = 3; // L's critical section, ms
const H_WORK = 2;
const H_READY = 1;
const M_READY = 1.5;

/** Illustrative three-task timeline: H blocks on a lock held by L while M runs. */
export function PriorityInversion() {
  const [inherit, setInherit] = useState(false);
  const [mLen, setMLen] = useState(12);
  // Without inheritance: L runs 0..H_READY, H preempts and blocks, M runs M_READY..M_READY+mLen, L finishes CS, H runs.
  // With inheritance: L raised at H_READY; M cannot preempt; L finishes at CS; H runs CS..CS+H_WORK; M after.
  const segs: { task: "H" | "M" | "L"; from: number; to: number; kind: "run" | "cs" | "wait" }[] = [];
  let hStart: number;
  if (inherit) {
    segs.push({ task: "L", from: 0, to: CS, kind: "cs" });
    segs.push({ task: "H", from: H_READY, to: CS, kind: "wait" });
    hStart = CS;
    segs.push({ task: "H", from: hStart, to: hStart + H_WORK, kind: "run" });
    segs.push({ task: "M", from: M_READY, to: hStart + H_WORK, kind: "wait" });
    segs.push({ task: "M", from: hStart + H_WORK, to: hStart + H_WORK + mLen, kind: "run" });
  } else {
    segs.push({ task: "L", from: 0, to: M_READY, kind: "cs" });
    segs.push({ task: "H", from: H_READY, to: M_READY + mLen + (CS - M_READY), kind: "wait" });
    segs.push({ task: "M", from: M_READY, to: M_READY + mLen, kind: "run" });
    segs.push({ task: "L", from: M_READY + mLen, to: M_READY + mLen + (CS - M_READY), kind: "cs" });
    hStart = M_READY + mLen + (CS - M_READY);
    segs.push({ task: "H", from: hStart, to: hStart + H_WORK, kind: "run" });
  }
  const total = Math.max(...segs.map((s) => s.to)) + 1;
  const hLatency = hStart + H_WORK - H_READY;
  const W = 640;
  const left = 40;
  const scale = (W - left - 10) / total;
  const rows: ("H" | "M" | "L")[] = ["H", "M", "L"];
  const y = (t: string) => 20 + rows.indexOf(t as "H") * 34;
  const fill = { run: "var(--c-accent)", cs: "var(--c-amber)", wait: "var(--c-line-2)" } as const;

  return (
    <div className="flex flex-col gap-3">
      <svg viewBox={`0 0 ${W} 130`} className="w-full" role="img" aria-label="Priority inversion timeline">
        {rows.map((r) => (
          <text key={r} x={8} y={y(r) + 16} className="fill-ink text-[13px] font-semibold">
            {r}
          </text>
        ))}
        {segs.map((s, i) => (
          <rect key={i} x={left + s.from * scale} y={y(s.task)} width={Math.max(1, (s.to - s.from) * scale)} height={22} rx={3} fill={fill[s.kind]} opacity={s.kind === "wait" ? 0.8 : 1} />
        ))}
        <line x1={left} x2={W - 10} y1={118} y2={118} stroke="var(--c-line-2)" />
        {Array.from({ length: Math.floor(total / 5) + 1 }, (_, i) => i * 5).map((t) => (
          <text key={t} x={left + t * scale} y={128} textAnchor="middle" className="fill-ink-3 text-[10px]">
            {t}
          </text>
        ))}
        <text x={W - 10} y={128} textAnchor="end" className="fill-ink-3 text-[10px]">
          ms
        </text>
      </svg>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-2">
        <span><span className="inline-block h-3 w-3 rounded-sm align-middle" style={{ background: "var(--c-accent)" }} /> running</span>
        <span><span className="inline-block h-3 w-3 rounded-sm align-middle" style={{ background: "var(--c-amber)" }} /> L inside the critical section (holds the lock)</span>
        <span><span className="inline-block h-3 w-3 rounded-sm align-middle" style={{ background: "var(--c-line-2)" }} /> waiting</span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={inherit} onChange={(e) => setInherit(e.target.checked)} data-testid="pi-inherit" className="h-5 w-5 accent-accent" />
          Priority inheritance (mutex)
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>M run length: {mLen} ms</span>
          <input type="range" min={2} max={30} value={mLen} onChange={(e) => setMLen(Number(e.target.value))} data-testid="pi-mlen" className="accent-accent" />
        </label>
      </div>
      <p className="rounded-lg bg-surface-2 px-3 py-2 text-sm" data-testid="pi-latency">
        H ready at {H_READY} ms, finished at {(hStart + H_WORK).toFixed(1)} ms: <strong>{hLatency.toFixed(1)} ms</strong> from ready to done
        {inherit ? " (bounded by L's 3 ms critical section)" : " (L's critical section plus the whole of M's run)"}.
      </p>
    </div>
  );
}
