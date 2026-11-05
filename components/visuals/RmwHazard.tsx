"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

type Frame = { title: string; main: string; isr: string; odr: number; r0: number | null; r1: number | null; note: string };

const frames: Frame[] = [
  { title: "Start", main: "ODR |= (1u << 5);", isr: "idle", odr: 0x00, r0: null, r1: null, note: "ODR is 0x00. Main line wants to set PA5." },
  { title: "Main: load", main: "LDR r0, [ODR]   ; r0 = 0x00", isr: "idle", odr: 0x00, r0: 0x00, r1: null, note: "The compiler reads ODR into a register. This copy is now independent of the hardware." },
  { title: "Interrupt fires", main: "(suspended)", isr: "ODR |= (1u << 6);", odr: 0x00, r0: 0x00, r1: null, note: "The ISR runs its own read-modify-write on the same register." },
  { title: "ISR: load, OR, store", main: "(suspended)", isr: "LDR r1,[ODR]; ORR r1,#0x40; STR r1,[ODR]", odr: 0x40, r0: 0x00, r1: 0x40, note: "ODR is now 0x40: PA6 is high. Correct so far." },
  { title: "Main resumes: OR", main: "ORR r0, #0x20   ; r0 = 0x20", isr: "done", odr: 0x40, r0: 0x20, r1: 0x40, note: "Main ORs its stale copy (0x00), producing 0x20. It has no idea PA6 was set." },
  { title: "Main: store", main: "STR r0, [ODR]   ; ODR = 0x20", isr: "done", odr: 0x20, r0: 0x20, r1: 0x40, note: "ODR becomes 0x20. PA6 is low again. The interrupt's update is lost, and nothing reports an error." },
];

export function RmwHazard() {
  const [i, setI] = useState(0);
  const f = frames[i]!;
  const bits = Array.from({ length: 8 }, (_, b) => (f.odr >> (7 - b)) & 1);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <Button size="sm" variant="secondary" onClick={() => setI((x) => Math.max(0, x - 1))} disabled={i === 0} aria-label="Previous step">
          <Icon name="chevron-left" size={16} /> Prev
        </Button>
        <span className="text-sm font-semibold" aria-live="polite">
          {i + 1}/{frames.length} · {f.title}
        </span>
        <Button size="sm" variant="secondary" onClick={() => setI((x) => Math.min(frames.length - 1, x + 1))} disabled={i === frames.length - 1} aria-label="Next step">
          Next <Icon name="chevron-right" size={16} />
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Lane title="Main line" code={f.main} reg={f.r0 === null ? "r0 = ?" : `r0 = 0x${f.r0.toString(16).toUpperCase().padStart(2, "0")}`} active={i !== 2 && i !== 3} />
        <Lane title="Interrupt handler" code={f.isr} reg={f.r1 === null ? "r1 = ?" : `r1 = 0x${f.r1.toString(16).toUpperCase().padStart(2, "0")}`} active={i === 2 || i === 3} />
      </div>
      <div className="rounded-xl border border-line bg-surface p-3">
        <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-ink-3">
          <span>GPIOA-&gt;ODR (bits 7:0)</span>
          <span className="font-mono text-ink">0x{f.odr.toString(16).toUpperCase().padStart(2, "0")}</span>
        </div>
        <div className="grid grid-cols-8 gap-1">
          {bits.map((b, idx) => {
            const bit = 7 - idx;
            const highlight = bit === 5 || bit === 6;
            return (
              <div key={bit} className={`flex min-h-10 flex-col items-center justify-center rounded-md border text-sm font-bold ${b ? "border-accent bg-accent text-on-accent" : "border-line bg-surface-2 text-ink"} ${highlight ? "ring-1 ring-amber" : ""}`}>
                <span className="text-[9px] opacity-70">PA{bit}</span>
                <span>{b}</span>
              </div>
            );
          })}
        </div>
      </div>
      <p className={`rounded-lg px-3 py-2 text-sm ${i === frames.length - 1 ? "bg-danger-soft text-danger" : "bg-surface-2 text-ink-2"}`}>{f.note}</p>
    </div>
  );
}

function Lane({ title, code, reg, active }: { title: string; code: string; reg: string; active: boolean }) {
  return (
    <div className={`rounded-xl border p-3 ${active ? "border-accent bg-accent-soft/50" : "border-line bg-surface"}`}>
      <div className="text-xs font-semibold uppercase tracking-wide text-ink-3">{title}</div>
      <pre className="mt-1 overflow-x-auto whitespace-pre-wrap font-mono text-xs text-ink">{code}</pre>
      <div className="mt-1 font-mono text-xs text-ink-2">{reg}</div>
    </div>
  );
}
