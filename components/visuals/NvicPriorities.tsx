"use client";

import { useState } from "react";

const groupings = [
  { id: 4, label: "Group 4: 4 preempt bits, 0 sub", pre: 4 },
  { id: 3, label: "Group 3: 3 preempt bits, 1 sub", pre: 3 },
  { id: 2, label: "Group 2: 2 preempt bits, 2 sub", pre: 2 },
  { id: 1, label: "Group 1: 1 preempt bit, 3 sub", pre: 1 },
  { id: 0, label: "Group 0: 0 preempt bits, 4 sub", pre: 0 },
];

/** Who preempts whom on a 4-bit NVIC, given the grouping and an RTOS syscall limit. */
export function NvicPriorities() {
  const [g, setG] = useState(4);
  const [irqs, setIrqs] = useState([
    { name: "ADC DMA", prio: 2 },
    { name: "CAN RX", prio: 5 },
    { name: "UART RX", prio: 6 },
  ]);
  const [limit, setLimit] = useState(5);
  const pre = groupings.find((x) => x.id === g)!.pre;
  const preemptOf = (p: number) => p >> (4 - pre);
  const subOf = (p: number) => p & ((1 << (4 - pre)) - 1);
  const set = (i: number, prio: number) => setIrqs((prev) => prev.map((x, k) => (k === i ? { ...x, prio } : x)));
  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-semibold">Priority grouping</span>
        <select value={g} onChange={(e) => setG(Number(e.target.value))} data-testid="nvic-group" className="min-h-11 rounded-lg border border-line bg-surface px-3">
          {groupings.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
        </select>
      </label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {irqs.map((irq, i) => (
          <label key={irq.name} className="flex flex-col gap-1 text-sm"><span>{irq.name}: priority {irq.prio}</span><input type="range" min={0} max={15} value={irq.prio} onChange={(e) => set(i, Number(e.target.value))} data-testid={`nvic-prio-${i}`} className="accent-accent" /></label>
        ))}
      </div>
      <label className="flex flex-col gap-1 text-sm"><span>configMAX_SYSCALL_INTERRUPT_PRIORITY: {limit} (interrupts numbered ≥ {limit} may call the kernel)</span><input type="range" min={1} max={15} value={limit} onChange={(e) => setLimit(Number(e.target.value))} data-testid="nvic-limit" className="accent-accent" /></label>
      <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Scrollable table">
        <table className="w-full border-collapse text-xs">
          <thead><tr><th className="border border-line bg-surface-2 p-2 text-left">Interrupt</th><th className="border border-line bg-surface-2 p-2">Preempt / sub</th><th className="border border-line bg-surface-2 p-2 text-left">Can preempt</th><th className="border border-line bg-surface-2 p-2 text-left">Kernel API</th></tr></thead>
          <tbody>
            {irqs.map((irq, i) => {
              const victims = irqs.filter((o, k) => k !== i && preemptOf(irq.prio) < preemptOf(o.prio)).map((o) => o.name);
              const sameLevel = irqs.filter((o, k) => k !== i && preemptOf(irq.prio) === preemptOf(o.prio)).map((o) => o.name);
              return (
                <tr key={irq.name} data-testid={`nvic-row-${i}`}>
                  <th scope="row" className="border border-line p-2 text-left font-semibold">{irq.name} ({irq.prio})</th>
                  <td className="border border-line p-2 text-center font-mono">{preemptOf(irq.prio)} / {subOf(irq.prio)}</td>
                  <td className="border border-line p-2">{victims.length ? victims.join(", ") : "nothing"}{sameLevel.length ? ` · same level as ${sameLevel.join(", ")} (sub-priority only orders pending)` : ""}</td>
                  <td className={`border border-line p-2 ${irq.prio >= limit ? "text-ok" : "text-danger"}`}>{irq.prio >= limit ? "allowed (FromISR only)" : "forbidden: more urgent than the limit"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-ink-3">Smaller number is more urgent. Only the preemption bits decide preemption; sub-priority bits order handlers that are pending together. Illustrative, 4-bit NVIC.</p>
    </div>
  );
}
