"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

type Fault = "none" | "nack" | "range" | "jump" | "stuck" | "drift";
const faults: { id: Fault; label: string; how: string }[] = [
  { id: "none", label: "No fault", how: "Baseline run; the alarm must stay clear." },
  { id: "nack", label: "Open sensor (NACK)", how: "The sensor stops acknowledging on the bus." },
  { id: "range", label: "Out of range", how: "Reads −55 °C, below the sensor's valid window." },
  { id: "jump", label: "Step jump", how: "Reading steps by +8 °C in one sample." },
  { id: "stuck", label: "Stuck value", how: "Reading freezes exactly; noise disappears." },
  { id: "drift", label: "Slow drift", how: "Rises 0.4 °C per second; no single sample jumps." },
];

type Row = { t: number; tempCenti: number | null; fault: string; alarm: number };

/**
 * Deterministic in-browser model of the portfolio monitor: 10 Hz samples, a sensor model with one injected fault,
 * and the same detection rules the firmware implements (NACK, range, jump > 5 °C, stuck for 5 s, config).
 * It is a simulation; nothing here is a measurement from hardware.
 */
function simulate(fault: Fault, injectAt: number, seconds: number): { rows: Row[]; detectedAt: number | null; alarmAt: number | null; faultName: string | null } {
  const rows: Row[] = [];
  let lastValid: number | null = null;
  let lastChangeT = 0;
  let alarm = 0;
  let detectedAt: number | null = null;
  let faultName: string | null = null;
  let seed = 7;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  for (let i = 0; i <= seconds * 10; i++) {
    const t = i / 10;
    const active = fault !== "none" && t >= injectAt;
    let reading: number | null = 2500 + Math.round((rnd() - 0.5) * 12); // 25.00 °C ± 0.06
    if (active) {
      if (fault === "nack") reading = null;
      else if (fault === "range") reading = -5500;
      else if (fault === "jump") reading = 3300 + Math.round((rnd() - 0.5) * 12);
      else if (fault === "stuck") reading = 2500;
      else if (fault === "drift") reading = 2500 + Math.round((t - injectAt) * 40);
    }
    let f: string = "NONE";
    if (reading === null) f = "NACK";
    else if (reading < -4000 || reading > 12500) f = "RANGE";
    else if (lastValid !== null && Math.abs(reading - lastValid) > 500) f = "JUMP";
    else {
      if (lastValid === null || reading !== lastValid) lastChangeT = t;
      if (t - lastChangeT >= 5.0) f = "STUCK";
    }
    if (f === "NONE" && reading !== null) lastValid = reading;
    if (f !== "NONE" && detectedAt === null) {
      detectedAt = t;
      faultName = f;
      alarm = 1;
    }
    rows.push({ t, tempCenti: reading, fault: f, alarm });
  }
  return { rows, detectedAt, alarmAt: detectedAt, faultName };
}

export function SensorMonitorLab() {
  const [fault, setFault] = useState<Fault>("nack");
  const [injectAt, setInjectAt] = useState(2);
  const [result, setResult] = useState<ReturnType<typeof simulate> | null>(null);
  const run = () => setResult(simulate(fault, injectAt, 10));
  const latency = result && result.detectedAt !== null ? result.detectedAt - injectAt : null;
  const shown = result ? result.rows.filter((r, i) => i % 5 === 0 || r.fault !== "NONE").slice(0, 40) : [];
  return (
    <div className="flex flex-col gap-3">
      <p className="rounded-lg bg-amber-soft px-3 py-2 text-sm text-amber">Simulation. This models the detection rules against a sensor model in the browser; it is not a measurement from hardware and must be recorded as simulation evidence.</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-semibold">Fault to inject</span>
          <select value={fault} onChange={(e) => setFault(e.target.value as Fault)} data-testid="lab-fault" className="min-h-11 rounded-lg border border-line bg-surface px-3">
            {faults.map((f) => (
              <option key={f.id} value={f.id}>{f.label}</option>
            ))}
          </select>
          <span className="text-xs text-ink-3">{faults.find((f) => f.id === fault)?.how}</span>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-semibold">Inject at: {injectAt.toFixed(1)} s</span>
          <input type="range" min={1} max={5} step={0.5} value={injectAt} onChange={(e) => setInjectAt(Number(e.target.value))} data-testid="lab-inject" className="accent-accent" />
          <span className="text-xs text-ink-3">10 Hz samples for 10 s; detection rules: NACK, range −40 to 125 °C, jump &gt; 5 °C, no change for 5 s.</span>
        </label>
      </div>
      <div>
        <Button size="sm" onClick={run} data-testid="lab-run">Run 10 s</Button>
      </div>
      {result && (
        <div className="flex flex-col gap-2">
          <p className="rounded-lg bg-surface-2 px-3 py-2 text-sm" data-testid="lab-result">
            {fault === "none" ? (
              result.detectedAt === null ? "Baseline: no fault declared, alarm stayed clear for 10 s." : `Unexpected: ${result.faultName} declared at ${result.detectedAt.toFixed(1)} s on a baseline run.`
            ) : result.detectedAt === null ? (
              `Not detected within 10 s. ${fault === "drift" ? "Slow drift passes the jump and stuck rules; this is a known gap to record in the FMEA row." : ""}`
            ) : (
              <>Declared <strong>{result.faultName}</strong> at {result.detectedAt.toFixed(1)} s, injected at {injectAt.toFixed(1)} s: detection latency <strong>{latency!.toFixed(1)} s</strong> {latency! <= 2 ? "(within the 2.0 s requirement)" : "(outside the 2.0 s requirement: record it)"}.</>
            )}
          </p>
          <div className="max-h-48 overflow-y-auto rounded-lg border border-line bg-surface font-mono text-[11px]" role="log" aria-label="Simulated log lines" tabIndex={0} data-testid="lab-log">
            {shown.map((r) => (
              <div key={r.t} className={r.fault !== "NONE" ? "bg-amber-soft/50 px-2" : "px-2"}>
                AA,{Math.round(r.t * 1000)},{r.tempCenti === null ? 32767 : r.tempCenti},{r.alarm},{r.fault}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
