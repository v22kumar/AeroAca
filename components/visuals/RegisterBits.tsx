"use client";

import { useState } from "react";
import { BitGrid, cExpression } from "./BitGrid";
import { Button } from "@/components/ui/Button";

const fields = Array.from({ length: 8 }, (_, pin) => ({ name: `PA${pin}`, msb: pin * 2 + 1, lsb: pin * 2 })).reverse();
const modes = ["Input (00)", "Output (01)", "Alternate (10)", "Analogue (11)"];
const initial = 0x00a3; // PA0 analogue, PA2/PA3 alternate function

export function RegisterBits() {
  const [value, setValue] = useState(initial);
  const toggle = (bit: number) => setValue((v) => (v ^ (1 << bit)) >>> 0);
  return (
    <div className="flex flex-col gap-3">
      <BitGrid width={16} value={value} initial={initial} fields={fields} onToggle={toggle} label="GPIOA MODER low half" />
      <div className="grid grid-cols-2 gap-1 text-xs sm:grid-cols-4">
        {fields
          .slice()
          .reverse()
          .map((f) => {
            const mode = (value >>> f.lsb) & 0x3;
            return (
              <div key={f.name} className="rounded-md border border-line bg-surface px-2 py-1">
                <span className="font-semibold">{f.name}</span> <span className="text-ink-2">{modes[mode]}</span>
              </div>
            );
          })}
      </div>
      <pre className="overflow-x-auto rounded-lg bg-code-bg p-3 text-xs text-code-ink">
        <code>{cExpression("GPIOA->MODER", initial, value)}</code>
      </pre>
      <div>
        <Button size="sm" variant="secondary" onClick={() => setValue(initial)}>
          Reset to initial 0x00A3
        </Button>
      </div>
    </div>
  );
}
