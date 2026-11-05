"use client";

import { useState } from "react";
import { Markdown } from "@/components/ui/Markdown";

type Stage = {
  id: string;
  label: string;
  measure: string;
  good: string;
  bad: string;
};

const stages: Stage[] = [
  {
    id: "power",
    label: "Power",
    measure: "VDD, VDDA and VCAP **at the MCU pins**; supply current.",
    good: "VDD 3.3 V ±5 %, VCAP about 1.2 V, current a few tens of mA for a running F4.",
    bad: "VCAP 0 V with VDD present: the core domain is not alive. Current near 0 mA: nothing is running. Hundreds of mA: a short or a part fitted wrong.",
  },
  {
    id: "reset",
    label: "Reset",
    measure: "NRST with a meter, then with a scope.",
    good: "Close to VDD from the internal pull-up; a single clean pulse at power-on only.",
    bad: "Near 0 V continuously: supervisor, debugger, shorted cap or button holds reset. Periodic pulses: watchdog or brown-out reset loop.",
  },
  {
    id: "clock",
    label: "Clock",
    measure: "The chip starts on HSI by itself. Check HSE only via MCO or a low-capacitance probe.",
    good: "Debugger attaches regardless of the crystal. Firmware switches to HSE and HSERDY sets within milliseconds.",
    bad: "Core halted in `while(!HSERDY)`: crystal, load caps or HSE bypass mode wrong. A quiet crystal while in reset proves nothing.",
  },
  {
    id: "boot",
    label: "Boot source",
    measure: "BOOT0 level at the pin (and BOOT1 or option bits where applicable), stable at reset release.",
    good: "BOOT0 low: execution from main flash at 0x0800 0000.",
    bad: "BOOT0 high: system bootloader runs instead of your code, but the debugger still attaches. Floating BOOT0: random behaviour between power cycles.",
  },
  {
    id: "run",
    label: "First instruction",
    measure: "Connect the debugger, halt, read PC and the vector table.",
    good: "PC inside your firmware; status LED or UART banner appears.",
    bad: "PC in a fault handler, or stuck in a wait loop. Flash empty or vector table at the wrong address. Only now is firmware a suspect.",
  },
];

export function McuBootChain() {
  const [active, setActive] = useState(0);
  const stage = stages[active]!;
  return (
    <div className="flex flex-col gap-3">
      <div role="tablist" aria-label="Boot chain stages" className="grid grid-cols-5 gap-1">
        {stages.map((s, i) => {
          const selected = i === active;
          return (
            <button
              key={s.id}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={`boot-stage-${s.id}`}
              id={`boot-tab-${s.id}`}
              onClick={() => setActive(i)}
              className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-lg border px-1 py-2 text-[11px] font-semibold leading-tight transition-colors sm:text-xs ${
                selected ? "border-accent bg-accent-soft text-accent" : "border-line bg-surface text-ink-2 hover:bg-surface-2"
              }`}
            >
              <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden>
                <StageGlyph id={s.id} selected={selected} />
              </svg>
              <span className="text-center">{s.label}</span>
            </button>
          );
        })}
      </div>
      <svg viewBox="0 0 500 18" className="w-full" aria-hidden>
        {stages.map((s, i) => (
          <g key={s.id}>
            <rect x={i * 100 + 2} y={6} width={96} height={6} rx={3} fill={i <= active ? "var(--c-accent)" : "var(--c-line)"} />
            {i < stages.length - 1 && <path d={`M${i * 100 + 97} 9 l-5 -4 v8 z`} fill={i < active ? "var(--c-accent)" : "var(--c-line-2)"} />}
          </g>
        ))}
      </svg>
      <div id={`boot-stage-${stage.id}`} role="tabpanel" aria-labelledby={`boot-tab-${stage.id}`} className="rounded-xl border border-line bg-surface p-4 text-sm">
        <dl className="flex flex-col gap-3">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-3">Measure</dt>
            <dd>
              <Markdown size="sm">{stage.measure}</Markdown>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ok">Good reading</dt>
            <dd>
              <Markdown size="sm">{stage.good}</Markdown>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-amber">Bad reading means</dt>
            <dd>
              <Markdown size="sm">{stage.bad}</Markdown>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

function StageGlyph({ id, selected }: { id: string; selected: boolean }) {
  const stroke = selected ? "var(--c-accent)" : "var(--c-ink-3)";
  const common = { fill: "none", stroke, strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (id) {
    case "power":
      return <path d="M14 4v9M8.5 8.5a7.5 7.5 0 1 0 11 0" {...common} />;
    case "reset":
      return <path d="M4 20h7v-12h6v12h7" {...common} />;
    case "clock":
      return <path d="M3 14h4l3-8 4 16 3-8h8" {...common} />;
    case "boot":
      return (
        <g {...common}>
          <rect x="5" y="5" width="18" height="18" rx="3" />
          <path d="M9 14h10M14 9v10" />
        </g>
      );
    default:
      return <path d="M6 14h12M13 9l5 5-5 5" {...common} />;
  }
}
