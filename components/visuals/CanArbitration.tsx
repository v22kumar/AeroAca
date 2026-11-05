"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

function bitsOf(id: number): number[] {
  return Array.from({ length: 11 }, (_, i) => (id >> (10 - i)) & 1);
}

/** Bitwise arbitration between two 11-bit identifiers: dominant 0 beats recessive 1. */
export function CanArbitration() {
  const [a, setA] = useState("120");
  const [b, setB] = useState("11F");
  const [step, setStep] = useState(0);
  const ida = Math.min(0x7ff, parseInt(a || "0", 16) || 0);
  const idb = Math.min(0x7ff, parseInt(b || "0", 16) || 0);
  const ba = bitsOf(ida);
  const bb = bitsOf(idb);
  let loser: "A" | "B" | null = null;
  let loseAt = -1;
  for (let i = 0; i < 11; i++) {
    if (ba[i] !== bb[i]) {
      loser = ba[i] === 1 ? "A" : "B";
      loseAt = i;
      break;
    }
  }
  const shown = Math.min(step, 11);
  const bus = Array.from({ length: 11 }, (_, i) => {
    const aActive = loser !== "A" || i <= loseAt;
    const bActive = loser !== "B" || i <= loseAt;
    return (aActive ? ba[i]! : 1) & (bActive ? bb[i]! : 1);
  });
  const cell = (v: number, active: boolean, highlight: boolean) => (
    <td className={`border border-line p-1 text-center font-mono ${highlight ? "bg-amber-soft font-bold" : ""} ${active ? "" : "text-ink-3"}`}>{active ? v : "·"}</td>
  );
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        <label className="flex items-center gap-2 text-sm">Node A ID 0x<input value={a} onChange={(e) => { setA(e.target.value.replace(/[^0-9a-fA-F]/g, "").slice(0, 3)); setStep(0); }} data-testid="can-id-a" className="w-16 rounded-md border border-line bg-surface px-2 py-1 font-mono" aria-label="Node A identifier (hex)" /></label>
        <label className="flex items-center gap-2 text-sm">Node B ID 0x<input value={b} onChange={(e) => { setB(e.target.value.replace(/[^0-9a-fA-F]/g, "").slice(0, 3)); setStep(0); }} data-testid="can-id-b" className="w-16 rounded-md border border-line bg-surface px-2 py-1 font-mono" aria-label="Node B identifier (hex)" /></label>
        <Button size="sm" onClick={() => setStep((s) => Math.min(11, s + 1))} data-testid="can-step">Next bit</Button>
        <Button size="sm" variant="secondary" onClick={() => setStep(0)}>Reset</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs" aria-label="Arbitration field bit by bit">
          <thead><tr><th className="border border-line bg-surface-2 p-1 text-left">Bit</th>{Array.from({ length: 11 }, (_, i) => <th key={i} className="border border-line bg-surface-2 p-1">{10 - i}</th>)}</tr></thead>
          <tbody>
            <tr><th scope="row" className="border border-line p-1 text-left">A sends</th>{ba.map((v, i) => (i < shown ? cell(v, loser !== "A" || i <= loseAt, i === loseAt) : <td key={i} className="border border-line p-1 text-center text-ink-3">?</td>))}</tr>
            <tr><th scope="row" className="border border-line p-1 text-left">B sends</th>{bb.map((v, i) => (i < shown ? cell(v, loser !== "B" || i <= loseAt, i === loseAt) : <td key={i} className="border border-line p-1 text-center text-ink-3">?</td>))}</tr>
            <tr><th scope="row" className="border border-line p-1 text-left">Bus</th>{bus.map((v, i) => (i < shown ? cell(v, true, i === loseAt) : <td key={i} className="border border-line p-1 text-center text-ink-3">?</td>))}</tr>
          </tbody>
        </table>
      </div>
      <p className="rounded-lg bg-surface-2 px-3 py-2 text-sm" data-testid="can-result">
        {ida === idb
          ? "Identical identifiers: arbitration cannot separate them and both frames collide. Identifiers must be unique."
          : shown <= loseAt
            ? `Stepped ${shown} of 11 bits; no difference yet.`
            : `At bit ${10 - loseAt} node ${loser} sent recessive (1) and read dominant (0): it loses and stops. Node ${loser === "A" ? "B" : "A"} (0x${(loser === "A" ? idb : ida).toString(16).toUpperCase().padStart(3, "0")}) continues with its frame untouched.`}
      </p>
    </div>
  );
}
