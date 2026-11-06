"use client";

import { useState } from "react";

const BYTE = 0xa5; // 1010 0101, MSB first

function Toggle({ label, value, onChange, options }: { label: string; value: number; onChange: (v: number) => void; options: [string, string] }) {
  return (
    <fieldset className="flex flex-col gap-1 text-xs font-semibold text-ink-2">
      <legend className="mb-1">{label}</legend>
      <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-line">
        {options.map((o, i) => (
          <label key={o} className={`flex min-h-10 cursor-pointer items-center justify-center px-2 text-center text-xs font-semibold ${value === i ? "bg-accent text-on-accent" : "bg-surface text-ink-2"}`}>
            <input type="radio" name={label} checked={value === i} onChange={() => onChange(i)} className="sr-only" />
            {o}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function SpiModes() {
  const [cpol, setCpol] = useState(0);
  const [cpha, setCpha] = useState(0);
  const [devCpol, setDevCpol] = useState(0);
  const [devCpha, setDevCpha] = useState(0);
  const mode = cpol * 2 + cpha;
  const devMode = devCpol * 2 + devCpha;
  const samplingEdge = (cpol ^ cpha) === 0 ? "rising" : "falling";
  const bits = Array.from({ length: 8 }, (_, i) => (BYTE >> (7 - i)) & 1);

  const W = 640;
  const left = 50;
  const bitW = 68;
  const sclHi = 30;
  const sclLo = 70;
  const dHi = 105;
  const dLo = 145;
  const idle = cpol ? sclHi : sclLo;
  const active = cpol ? sclLo : sclHi;
  // SCK: 8 pulses; each pulse: first edge at x0, second at x0 + bitW/2
  let scl = `M${10} ${idle} H${left}`;
  for (let i = 0; i < 8; i++) {
    const x0 = left + i * bitW;
    scl += ` V${active} H${x0 + bitW / 2} V${idle} H${x0 + bitW}`;
  }
  scl += ` H${W - 10}`;
  // data: with CPHA=0 data is valid from before first edge (changes on second edge); with CPHA=1 data changes on first edge, sampled on second
  let data = "";
  let cur = bits[0]!;
  const yOf = (b: number) => (b ? dHi : dLo);
  if (cpha === 0) {
    // Data is valid before the first (sampling) edge and changes on the second edge of the
    // previous bit, i.e. half a clock before the next sampling edge.
    data = `M10 ${yOf(cur)}`;
    for (let i = 1; i < 8; i++) {
      const b = bits[i]!;
      if (b !== cur) {
        const xChange = left + i * bitW - bitW / 2;
        data += ` H${xChange} V${yOf(b)}`;
        cur = b;
      }
    }
    data += ` H${W - 10}`;
  } else {
    data = `M10 ${dLo} H${left}`;
    cur = 0;
    for (let i = 0; i < 8; i++) {
      const x0 = left + i * bitW;
      const b = bits[i]!;
      if (b !== cur) {
        data += ` V${yOf(b)}`;
        cur = b;
      }
      data += ` H${x0 + bitW}`;
    }
    data += ` H${W - 10}`;
  }
  const sampleXs = bits.map((_, i) => left + i * bitW + (cpha === 0 ? 0 : bitW / 2));
  const sampledLevels = bits.map((b) => b);

  const mismatch = mode !== devMode;
  const mismatchText = !mismatch
    ? "Master and device agree. Every bit is sampled where the other side holds it stable."
    : cpol !== devCpol && cpha === devCpha
      ? "Clock polarity differs: the device sees the idle level as an edge and counts one extra transition. Typical symptom: data shifted by one bit."
      : cpol === devCpol && cpha !== devCpha
        ? "Clock phase differs: the master samples while the device is changing its output. Typical symptom: data shifted by one bit, sometimes unstable."
        : "Both differ. The sampling edge happens to match, but the device's idle expectation does not, so the first clock is misread. Expect shifted data.";

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <Toggle label="Master CPOL (idle)" value={cpol} onChange={setCpol} options={["0: idle low", "1: idle high"]} />
        <Toggle label="Master CPHA (sample)" value={cpha} onChange={setCpha} options={["0: first edge", "1: second edge"]} />
      </div>
      <svg viewBox={`0 0 ${W} 170`} className="w-full rounded-xl border border-line bg-surface" role="img" aria-label={`SPI mode ${mode}: clock idles ${cpol ? "high" : "low"}, data sampled on the ${samplingEdge} edge`}>
        <text x={6} y={sclLo - 14} fontSize="12" fontWeight="700" fill="var(--c-ink-2)">
          SCK
        </text>
        <text x={6} y={dLo - 14} fontSize="12" fontWeight="700" fill="var(--c-ink-2)">
          MOSI
        </text>
        <path d={scl} fill="none" stroke="var(--c-ink)" strokeWidth="2" strokeLinejoin="round" />
        <path d={data} fill="none" stroke="var(--c-accent)" strokeWidth="2.2" strokeLinejoin="round" />
        {sampleXs.map((x, i) => (
          <g key={i}>
            <line x1={x} y1={sclHi - 6} x2={x} y2={dLo + 6} stroke="var(--c-ok)" strokeDasharray="3 3" strokeWidth="1" />
            <circle cx={x} cy={sampledLevels[i] ? dHi : dLo} r={4.5} fill="var(--c-ok)" stroke="var(--c-surface)" strokeWidth="1.5" />
            <text x={x} y={164} fontSize="11" fontWeight="700" textAnchor="middle" fill="var(--c-ink)">
              {bits[i]}
            </text>
          </g>
        ))}
      </svg>
      <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
        <div className="rounded-lg border border-line bg-surface-2/60 px-3 py-2">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-3">Master mode</div>
          <div className="font-semibold">Mode {mode}</div>
        </div>
        <div className="rounded-lg border border-line bg-surface-2/60 px-3 py-2">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-3">Samples on</div>
          <div className="font-semibold">{samplingEdge} edge</div>
        </div>
        <div className="rounded-lg border border-line bg-surface-2/60 px-3 py-2">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-3">Byte (MSB first)</div>
          <div className="font-mono font-semibold">0xA5</div>
        </div>
      </div>
      <div className="rounded-xl border border-line bg-surface p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">What the device expects (from its datasheet)</p>
        <div className="grid grid-cols-2 gap-2">
          <Toggle label="Device idle level" value={devCpol} onChange={setDevCpol} options={["idle low", "idle high"]} />
          <Toggle label="Device latches on" value={devCpha} onChange={setDevCpha} options={["first edge", "second edge"]} />
        </div>
        <p className={`mt-2 rounded-lg px-3 py-2 text-sm ${mismatch ? "bg-amber-soft text-amber" : "bg-ok-soft text-ok"}`} data-testid="spi-mismatch">
          Device mode {devMode}. {mismatchText}
        </p>
      </div>
    </div>
  );
}
