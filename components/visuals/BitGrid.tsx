"use client";

import { toHex } from "@/lib/learning/grading";

export type BitField = { name: string; msb: number; lsb: number; description?: string };

const fieldPalette = ["bg-accent-soft", "bg-amber-soft", "bg-surface-2", "bg-ok-soft"];

/**
 * A tappable register. Bits are rendered MSB-first in rows of 8 so it reads well at phone width.
 * Pure presentational: value in, onToggle out.
 */
export function BitGrid({
  width,
  value,
  initial,
  fields,
  onToggle,
  protectedBits,
  label,
}: {
  width: 8 | 16 | 32;
  value: number;
  initial?: number;
  fields: BitField[];
  onToggle?: (bit: number) => void;
  protectedBits?: number[];
  label: string;
}) {
  const rows: number[][] = [];
  for (let start = width - 1; start >= 0; start -= 8) {
    rows.push(Array.from({ length: 8 }, (_, i) => start - i).filter((b) => b >= 0));
  }
  const fieldOf = (bit: number) => fields.findIndex((f) => bit <= f.msb && bit >= f.lsb);
  const protectedSet = new Set(protectedBits ?? []);

  return (
    <div className="flex flex-col gap-3">
      <div role="group" aria-label={label} className="flex flex-col gap-2">
        {rows.map((row, ri) => (
          <div key={ri} className="grid grid-cols-8 gap-1">
            {row.map((bit) => {
              const v = (value >>> bit) & 1;
              const changed = initial !== undefined && (((initial >>> bit) & 1) !== v);
              const fi = fieldOf(bit);
              const field = fields[fi];
              const isProtected = protectedSet.has(bit);
              return (
                <button
                  key={bit}
                  type="button"
                  disabled={!onToggle}
                  onClick={() => onToggle?.(bit)}
                  aria-label={`Bit ${bit}${field ? `, ${field.name}` : ""}, value ${v}${isProtected ? ", belongs to another pin" : ""}`}
                  aria-pressed={v === 1}
                  data-bit={bit}
                  className={`flex min-h-12 flex-col items-center justify-center rounded-md border text-sm font-bold tabular-nums transition-colors ${
                    v ? "border-accent bg-accent text-on-accent" : `border-line ${fi >= 0 ? fieldPalette[fi % fieldPalette.length] : "bg-surface"} text-ink`
                  } ${changed ? "ring-2 ring-amber ring-offset-1 ring-offset-paper" : ""} ${onToggle ? "hover:border-accent" : "cursor-default"}`}
                >
                  <span className="text-[9px] font-semibold leading-none text-current opacity-70">{bit}</span>
                  <span className="leading-none">{v}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-ink-2">
        {fields.map((f, i) => (
          <span key={f.name} className="inline-flex items-center gap-1">
            <span className={`inline-block h-2.5 w-2.5 rounded-sm border border-line ${fieldPalette[i % fieldPalette.length]}`} aria-hidden />
            {f.name} [{f.msb}:{f.lsb}]
          </span>
        ))}
      </div>
      <div className="font-mono text-sm">
        <span className="text-ink-3">value = </span>
        <span className="font-bold" data-testid="bitgrid-hex">
          {toHex(value, width)}
        </span>
      </div>
    </div>
  );
}

/** Build the C read-modify-write expression that turns `initial` into `value`. */
export function cExpression(regName: string, initial: number, value: number): string {
  const set = (value & ~initial) >>> 0;
  const clear = (initial & ~value) >>> 0;
  const hex = (n: number) => "0x" + n.toString(16).toUpperCase() + "u";
  if (!set && !clear) return `/* no change */`;
  if (set && !clear) return `${regName} |= ${hex(set)};`;
  if (clear && !set) return `${regName} &= ~${hex(clear)};`;
  return `${regName} = (${regName} & ~${hex(clear)}) | ${hex(set)};`;
}
