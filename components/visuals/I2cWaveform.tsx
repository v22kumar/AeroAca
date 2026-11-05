"use client";

import { useId, useState } from "react";

const presets = [
  { addr: 0x48, label: "0x48 (ADD0 → GND)" },
  { addr: 0x49, label: "0x49 (ADD0 → V+)" },
  { addr: 0x4a, label: "0x4A (ADD0 → SDA)" },
  { addr: 0x4b, label: "0x4B (ADD0 → SCL)" },
];

export function I2cWaveform() {
  const [addr, setAddr] = useState(0x48);
  const [read, setRead] = useState(false);
  const [ack, setAck] = useState(true);
  const id = useId();

  const byte = ((addr << 1) | (read ? 1 : 0)) & 0xff;
  const bits = Array.from({ length: 8 }, (_, i) => (byte >> (7 - i)) & 1);

  // Geometry
  const W = 640;
  const left = 60;
  const bitW = 56;
  const hi = 1;
  const sclY = { hi: 40, lo: 80 };
  const sdaY = { hi: 120, lo: 160 };
  const startX = left + 20;
  const bitStart = startX + 24;
  const stopX = bitStart + 9 * bitW + 10;

  // SCL path: high until start+ a bit, then 9 pulses, then high
  let scl = `M${left} ${sclY.hi} H${bitStart - 6}`;
  for (let i = 0; i < 9; i++) {
    const x0 = bitStart + i * bitW;
    scl += ` V${sclY.lo} H${x0 + 10} V${sclY.hi} H${x0 + bitW - 16}`;
  }
  scl += ` V${sclY.lo} H${stopX - 2} V${sclY.hi} H${W - 10}`;

  // SDA path: high, START falls at startX (SCL high), bits change while SCL low, ACK bit, STOP rises at stopX
  const levels = [...bits, ack ? 0 : 1];
  let sda = `M${left} ${sdaY.hi} H${startX} V${sdaY.lo}`;
  let cur = 0;
  for (let i = 0; i < 9; i++) {
    const x0 = bitStart + i * bitW;
    const lvl = levels[i]!;
    if (lvl !== cur) {
      sda += ` H${x0 + 2} V${lvl === hi ? sdaY.hi : sdaY.lo}`;
      cur = lvl;
    }
  }
  // after the ack bit, master releases/holds low for STOP: go low while SCL low, then rise at stopX with SCL high
  if (cur !== 0) sda += ` H${bitStart + 9 * bitW - 12} V${sdaY.lo}`;
  sda += ` H${stopX + 6} V${sdaY.hi} H${W - 10}`;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-2">
          7-bit address
          <select value={addr} onChange={(e) => setAddr(Number(e.target.value))} className="min-h-10 rounded-lg border border-line bg-surface px-2 text-sm font-medium text-ink">
            {presets.map((p) => (
              <option key={p.addr} value={p.addr}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="flex flex-col gap-1 text-xs font-semibold text-ink-2">
          <legend className="mb-1">Direction</legend>
          <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-line">
            <Toggle name={`${id}-dir`} checked={!read} onChange={() => setRead(false)} label="Write (0)" />
            <Toggle name={`${id}-dir`} checked={read} onChange={() => setRead(true)} label="Read (1)" />
          </div>
        </fieldset>
        <fieldset className="flex flex-col gap-1 text-xs font-semibold text-ink-2">
          <legend className="mb-1">Device at that address?</legend>
          <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-line">
            <Toggle name={`${id}-ack`} checked={ack} onChange={() => setAck(true)} label="Yes → ACK" />
            <Toggle name={`${id}-ack`} checked={!ack} onChange={() => setAck(false)} label="No → NACK" />
          </div>
        </fieldset>
      </div>

      <svg viewBox={`0 0 ${W} 190`} className="w-full rounded-xl border border-line bg-surface" role="img" aria-label={`I2C address byte 0x${byte.toString(16).toUpperCase().padStart(2, "0")} followed by ${ack ? "ACK" : "NACK"}`}>
        <text x={10} y={sclY.lo - 14} fontSize="13" fontWeight="700" fill="var(--c-ink-2)">
          SCL
        </text>
        <text x={10} y={sdaY.lo - 14} fontSize="13" fontWeight="700" fill="var(--c-ink-2)">
          SDA
        </text>
        <path d={scl} fill="none" stroke="var(--c-ink)" strokeWidth="2" strokeLinejoin="round" />
        <path d={sda} fill="none" stroke="var(--c-accent)" strokeWidth="2.2" strokeLinejoin="round" />
        {/* bit labels */}
        {levels.map((lvl, i) => {
          const x = bitStart + i * bitW + 22;
          const isAck = i === 8;
          return (
            <g key={i}>
              <text x={x} y={20} fontSize="11" textAnchor="middle" fill="var(--c-ink-3)">
                {isAck ? "ACK" : i === 7 ? "R/W" : `A${6 - i}`}
              </text>
              <text x={x} y={184} fontSize="13" fontWeight="700" textAnchor="middle" fill={isAck ? (ack ? "var(--c-ok)" : "var(--c-danger)") : "var(--c-ink)"}>
                {isAck ? (ack ? "0" : "1") : lvl}
              </text>
            </g>
          );
        })}
        <text x={startX - 6} y={184} fontSize="11" textAnchor="middle" fill="var(--c-amber)" fontWeight="700">
          S
        </text>
        <text x={stopX + 6} y={184} fontSize="11" textAnchor="middle" fill="var(--c-amber)" fontWeight="700">
          P
        </text>
        {/* ninth clock highlight */}
        <rect x={bitStart + 8 * bitW - 2} y={28} width={bitW - 8} height={140} fill={ack ? "var(--c-ok-soft)" : "var(--c-danger-soft)"} opacity="0.55" rx="6" />
      </svg>

      <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        <Readout label="7-bit address" value={`0x${addr.toString(16).toUpperCase()}`} />
        <Readout label="First byte on wire" value={`0x${byte.toString(16).toUpperCase().padStart(2, "0")}`} mono />
        <Readout label="Binary" value={bits.join("")} mono />
        <Readout label="Ninth clock" value={ack ? "SDA low = ACK" : "SDA high = NACK"} tone={ack ? "ok" : "danger"} />
      </div>
      <p className="text-xs text-ink-3">
        The receiver drives SDA during the ninth clock. The master only reads it. Decoders usually print the 7-bit form with a direction flag (for example “0x48 W”), while a raw byte view prints 0x{byte.toString(16).toUpperCase().padStart(2, "0")}.
      </p>
    </div>
  );
}

function Toggle({ name, checked, onChange, label }: { name: string; checked: boolean; onChange: () => void; label: string }) {
  return (
    <label className={`flex min-h-10 cursor-pointer items-center justify-center px-2 text-center text-xs font-semibold ${checked ? "bg-accent text-on-accent" : "bg-surface text-ink-2"}`}>
      <input type="radio" name={name} checked={checked} onChange={onChange} className="sr-only" />
      {label}
    </label>
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
