"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

const steps = [
  { title: "Reset released", flash: "vector table, code, .data initial values", ram: "unknown (power-up garbage)", note: "The core reads word 0 (initial MSP) and word 1 (Reset_Handler | 1) from the vector table. SP = 0x2002 0000; PC = Reset_Handler." },
  { title: "Copy .data", flash: "vector table, code, .data initial values", ram: ".data = initial values; .bss = garbage; heap/stack unused", note: "Loop from _sidata (flash) to _sdata.._edata (RAM). Initialised globals now hold their values." },
  { title: "Zero .bss", flash: "vector table, code, .data initial values", ram: ".data = initial values; .bss = 0", note: "Loop from _sbss to _ebss writing zero. Zero-initialised and uninitialised globals are now 0." },
  { title: "SystemInit()", flash: "unchanged", ram: ".data, .bss valid", note: "Clock tree: HSI 16 MHz → PLL 168 MHz. FPU enabled. VTOR = 0x0800 0000 (this image's table)." },
  { title: "__libc_init_array()", flash: "unchanged", ram: ".data, .bss valid; constructors may write globals", note: "C++ static constructors and __attribute__((constructor)) functions run, in link order." },
  { title: "main()", flash: "unchanged", ram: "valid; stack grows down from 0x2002 0000", note: "Your first line. Everything it assumes about globals, the clock and interrupts was set up by the five steps before it." },
];

export function StartupSequence() {
  const [i, setI] = useState(0);
  const s = steps[i]!;
  return (
    <div className="flex flex-col gap-3">
      <ol className="flex flex-wrap gap-1 text-xs" aria-label="Startup steps">
        {steps.map((st, k) => (
          <li key={st.title}>
            <button
              type="button"
              onClick={() => setI(k)}
              aria-current={k === i ? "step" : undefined}
              data-testid={`startup-step-${k}`}
              className={`rounded-md border px-2 py-1 ${k === i ? "border-accent bg-accent text-on-accent" : k < i ? "border-line bg-surface-2 text-ink-2" : "border-line bg-surface text-ink-3"}`}
            >
              {k + 1}. {st.title}
            </button>
          </li>
        ))}
      </ol>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="rounded-lg border border-line bg-surface p-3 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-3">Flash 0x0800 0000</p>
          <p className="mt-1 text-ink-2">{s.flash}</p>
        </div>
        <div className="rounded-lg border border-line bg-surface p-3 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-3">RAM 0x2000 0000</p>
          <p className="mt-1 text-ink-2" data-testid="startup-ram">{s.ram}</p>
        </div>
      </div>
      <p className="rounded-lg bg-surface-2 px-3 py-2 text-sm" data-testid="startup-note">{s.note}</p>
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" onClick={() => setI((k) => Math.max(0, k - 1))} disabled={i === 0}>
          Back
        </Button>
        <Button size="sm" onClick={() => setI((k) => Math.min(steps.length - 1, k + 1))} disabled={i === steps.length - 1} data-testid="startup-next">
          Next step
        </Button>
      </div>
    </div>
  );
}
