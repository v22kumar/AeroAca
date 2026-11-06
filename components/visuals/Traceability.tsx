"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

const requirements = [
  { id: "REQ-1", text: "Banner at 115 200 8N1 within 500 ms of reset" },
  { id: "REQ-2", text: "Sensor fault annunciated within 2.0 s" },
  { id: "REQ-3", text: "Temperature within ±0.5 °C of reference, 0 to 60 °C" },
  { id: "REQ-4", text: "Watchdog restarts a hung main loop within 1.0 s (±LSI tol.)" },
];
const tests = [
  { id: "TC-1", text: "Analyser: banner text, bit time, start-bit latency after NRST" },
  { id: "TC-2", text: "Fault injection: open, short, out-of-range; ALARM edge latency, 5 trials each" },
  { id: "TC-3", text: "Reference bath at 0, 25, 60 °C; 10 samples each" },
  { id: "TC-4", text: "LED blink rate visually checked" },
  { id: "TC-5", text: "Halt core with debugger; NRST pulse timing; RCC_CSR flag" },
];
/** The links a careful reviewer would accept; TC-4 verifies nothing in the list. */
const intended: Record<string, string[]> = { "REQ-1": ["TC-1"], "REQ-2": ["TC-2"], "REQ-3": ["TC-3"], "REQ-4": ["TC-5"] };

export function Traceability() {
  const [links, setLinks] = useState<Set<string>>(() => new Set(["REQ-1:TC-1"]));
  const key = (r: string, t: string) => `${r}:${t}`;
  const toggle = (r: string, t: string) => {
    setLinks((prev) => {
      const next = new Set(prev);
      const k = key(r, t);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };
  const gaps = requirements.filter((r) => !tests.some((t) => links.has(key(r.id, t.id))));
  const orphans = tests.filter((t) => !requirements.some((r) => links.has(key(r.id, t.id))));
  const wrong = [...links].filter((k) => {
    const [r, t] = k.split(":") as [string, string];
    return !intended[r]?.includes(t);
  });
  const complete = gaps.length === 0 && wrong.length === 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs" aria-label="Requirements to tests traceability matrix">
          <thead>
            <tr>
              <th className="border border-line bg-surface-2 p-2 text-left font-semibold">Requirement</th>
              {tests.map((t) => (
                <th key={t.id} className="border border-line bg-surface-2 p-2 text-center font-semibold" title={t.text}>
                  {t.id}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {requirements.map((r) => (
              <tr key={r.id}>
                <th scope="row" className="border border-line p-2 text-left font-medium" title={r.text}>
                  <span className="block font-semibold">{r.id}</span>
                  <span className="block font-normal text-ink-2">{r.text}</span>
                </th>
                {tests.map((t) => {
                  const on = links.has(key(r.id, t.id));
                  return (
                    <td key={t.id} className="border border-line p-1 text-center">
                      <button
                        type="button"
                        onClick={() => toggle(r.id, t.id)}
                        aria-pressed={on}
                        aria-label={`${r.id} verified by ${t.id}`}
                        data-testid={`trace-${r.id}-${t.id}`}
                        className={`h-9 w-9 rounded-md border text-sm font-bold ${on ? "border-accent bg-accent text-on-accent" : "border-line bg-surface text-ink-3 hover:border-accent"}`}
                      >
                        {on ? "✓" : ""}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="flex flex-col gap-1 text-xs text-ink-2">
        {tests.map((t) => (
          <li key={t.id}>
            <span className="font-semibold">{t.id}</span>: {t.text}
          </li>
        ))}
      </ul>
      <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        <div className={`rounded-lg px-3 py-2 ${gaps.length ? "bg-amber-soft text-amber" : "bg-ok-soft text-ok"}`} data-testid="trace-gaps">
          {gaps.length ? `Gaps: ${gaps.map((g) => g.id).join(", ")} have no test.` : "No gaps: every requirement has a test."}
        </div>
        <div className={`rounded-lg px-3 py-2 ${orphans.length ? "bg-amber-soft text-amber" : "bg-ok-soft text-ok"}`} data-testid="trace-orphans">
          {orphans.length ? `Orphans: ${orphans.map((o) => o.id).join(", ")} verify no requirement.` : "No orphans."}
        </div>
      </div>
      {wrong.length > 0 && (
        <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger" data-testid="trace-wrong">
          {wrong.length} link{wrong.length > 1 ? "s" : ""} do not hold up: the test&apos;s method does not measure what the requirement states. Read the test descriptions again.
        </p>
      )}
      {complete && (
        <p className="rounded-lg bg-ok-soft px-3 py-2 text-sm text-ok" data-testid="trace-complete">
          Complete. TC-4 stays an orphan: a visual blink check verifies none of these requirements, so it is either wasted or needs a requirement of its own.
        </p>
      )}
      <div>
        <Button size="sm" variant="secondary" onClick={() => setLinks(new Set(["REQ-1:TC-1"]))}>
          Reset
        </Button>
      </div>
    </div>
  );
}
