"use client";

import { useId, useState } from "react";

const presets = [
  { value: 0x41, label: "0x41 'A'" },
  { value: 0x53, label: "0x53 'S'" },
  { value: 0x55, label: "0x55 (alternating)" },
  { value: 0x00, label: "0x00" },
  { value: 0xff, label: "0xFF" },
];

type Parity = "none" | "even" | "odd";

export function UartFrame() {
  const [byte, setByte] = useState(0x41);
  const [parity, setParity] = useState<Parity>("none");
  const [errPct, setErrPct] = useState(0);
  const id = useId();

  const dataBits = Array.from({ length: 8 }, (_, i) => (byte >> i) & 1); // LSB first
  const ones = dataBits.reduce((a, b) => a + b, 0);
  const parityBit = parity === "none" ? null : parity === "even" ? ones % 2 : (ones + 1) % 2;
  const bits: { label: string; level: number; kind: "start" | "data" | "parity" | "stop" }[] = [
    { label: "S", level: 0, kind: "start" },
    ...dataBits.map((b, i) => ({ label: `D${i}`, level: b, kind: "data" as const })),
    ...(parityBit === null ? [] : [{ label: "P", level: parityBit, kind: "parity" as const }]),
    { label: "ST", level: 1, kind: "stop" },
  ];

  // geometry
  const W = 640;
  const left = 40;
  const bitW = (W - left - 20) / (bits.length + 1);
  const hi = 40;
  const lo = 100;
  let path = `M${left - 30} ${hi} H${left}`;
  bits.forEach((b, i) => {
    const x0 = left + i * bitW;
    const y = b.level ? hi : lo;
    path += ` V${y} H${x0 + bitW}`;
  });
  path += ` V${hi} H${W - 10}`;

  // receiver samples: bit k sampled at (k + 0.5) * T_r from the start edge, T_r = T * (1 + err)
  const Tr = 1 + errPct / 100;
  const samples = bits.map((_, k) => {
    const t = (k + 0.5) * Tr; // in units of true bit time
    const idx = Math.floor(t);
    const ok = idx === k;
    const level = idx >= 0 && idx < bits.length ? bits[idx]!.level : 1;
    return { k, x: left + t * bitW, ok, level };
  });
  const received = samples.slice(1, 9).reduce((acc, s, i) => acc | (s.level << i), 0);
  const stopSample = samples[samples.length - 1]!;
  const framingError = stopSample.level === 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-2">
          Byte to send
          <select value={byte} onChange={(e) => setByte(Number(e.target.value))} className="min-h-10 rounded-lg border border-line bg-surface px-2 text-sm font-medium text-ink">
            {presets.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-2">
          Parity
          <select value={parity} onChange={(e) => setParity(e.target.value as Parity)} className="min-h-10 rounded-lg border border-line bg-surface px-2 text-sm font-medium text-ink">
            <option value="none">None (8N1)</option>
            <option value="even">Even (8E1)</option>
            <option value="odd">Odd (8O1)</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-2">
          Receiver rate error: {errPct > 0 ? "+" : ""}
          {errPct} %
          <input id={`${id}-err`} type="range" min={-8} max={8} step={1} value={errPct} onChange={(e) => setErrPct(Number(e.target.value))} className="accent-[var(--c-accent)]" aria-label="Receiver rate error in percent" />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} 150`} className="w-full rounded-xl border border-line bg-surface" role="img" aria-label={`UART frame for byte 0x${byte.toString(16).toUpperCase().padStart(2, "0")}, ${framingError ? "framing error" : "received correctly"}`}>
        <text x={6} y={lo - 20} fontSize="12" fontWeight="700" fill="var(--c-ink-2)">
          TX
        </text>
        {bits.map((b, i) => (
          <g key={i}>
            <rect x={left + i * bitW} y={22} width={bitW} height={100} fill={b.kind === "data" ? "transparent" : "var(--c-accent-soft)"} opacity={0.5} />
            <text x={left + i * bitW + bitW / 2} y={16} fontSize="10" textAnchor="middle" fill="var(--c-ink-3)">
              {b.label}
            </text>
            <text x={left + i * bitW + bitW / 2} y={140} fontSize="12" fontWeight="700" textAnchor="middle" fill="var(--c-ink)">
              {b.level}
            </text>
          </g>
        ))}
        <path d={path} fill="none" stroke="var(--c-ink)" strokeWidth="2" strokeLinejoin="round" />
        {samples.map((s) => (
          <circle key={s.k} cx={s.x} cy={s.level ? hi : lo} r={4.5} fill={s.ok ? "var(--c-ok)" : "var(--c-danger)"} stroke="var(--c-surface)" strokeWidth="1.5" />
        ))}
      </svg>
      <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        <Readout label="Sent" value={`0x${byte.toString(16).toUpperCase().padStart(2, "0")}`} mono />
        <Readout label="Bits on wire (LSB first)" value={dataBits.join("")} mono />
        <Readout label="Receiver decoded" value={`0x${received.toString(16).toUpperCase().padStart(2, "0")}`} mono tone={received === byte && !framingError ? "ok" : "danger"} />
        <Readout label="Stop bit" value={framingError ? "sampled low: framing error" : "high, frame OK"} tone={framingError ? "danger" : "ok"} />
      </div>
      <p className="text-xs text-ink-3">Dots show where the receiver samples each bit. Green dots land in the intended bit; red dots have drifted into a neighbour. Error accumulates from the start edge, which is why the stop bit fails first.</p>
    </div>
  );
}

function Readout({ label, value, mono, tone }: { label: string; value: string; mono?: boolean; tone?: "ok" | "danger" }) {
  return (
    <div className="rounded-lg border border-line bg-surface-2/60 px-3 py-2">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-3">{label}</div>
      <div className={`${mono ? "font-mono" : ""} font-semibold ${tone === "ok" ? "text-ok" : tone === "danger" ? "text-danger" : ""}`}>{value}</div>
    </div>
  );
}
