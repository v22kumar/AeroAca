"use client";

import { useState } from "react";

/** LSB, code and noise calculator for an N-bit ADC. Illustrative noise model: white ADC noise vs reference-correlated ripple. */
export function AdcQuantisation() {
  const [bits, setBits] = useState(12);
  const [vref, setVref] = useState(3.3);
  const [vin, setVin] = useState(1.0);
  const [white, setWhite] = useState(1.0); // LSB rms
  const [ripple, setRipple] = useState(2.5); // LSB p-p correlated
  const [n, setN] = useState(16);
  const codes = 2 ** bits;
  const lsb = vref / codes;
  const code = Math.min(codes - 1, Math.max(0, Math.round(vin / lsb)));
  const qn = 1 / Math.sqrt(12);
  const whiteAvg = Math.sqrt(qn * qn + white * white) / Math.sqrt(n);
  const total = Math.sqrt(whiteAvg * whiteAvg + (ripple / 2.83) ** 2); // ripple p-p → rms, not reduced by averaging
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm"><span>Resolution: {bits} bits</span><input type="range" min={8} max={16} value={bits} onChange={(e) => setBits(Number(e.target.value))} data-testid="adc-bits" className="accent-accent" /></label>
        <label className="flex flex-col gap-1 text-sm"><span>Reference: {vref.toFixed(2)} V</span><input type="range" min={1} max={5} step={0.05} value={vref} onChange={(e) => setVref(Number(e.target.value))} data-testid="adc-vref" className="accent-accent" /></label>
        <label className="flex flex-col gap-1 text-sm"><span>Input: {vin.toFixed(3)} V</span><input type="range" min={0} max={5} step={0.005} value={vin} onChange={(e) => setVin(Number(e.target.value))} data-testid="adc-vin" className="accent-accent" /></label>
        <label className="flex flex-col gap-1 text-sm"><span>ADC white noise: {white.toFixed(1)} LSB rms</span><input type="range" min={0} max={4} step={0.1} value={white} onChange={(e) => setWhite(Number(e.target.value))} className="accent-accent" /></label>
        <label className="flex flex-col gap-1 text-sm"><span>Reference ripple: {ripple.toFixed(1)} LSB p-p</span><input type="range" min={0} max={8} step={0.1} value={ripple} onChange={(e) => setRipple(Number(e.target.value))} data-testid="adc-ripple" className="accent-accent" /></label>
        <label className="flex flex-col gap-1 text-sm"><span>Samples averaged: {n}</span><input type="range" min={1} max={256} step={1} value={n} onChange={(e) => setN(Number(e.target.value))} data-testid="adc-n" className="accent-accent" /></label>
      </div>
      <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        <p className="rounded-lg bg-surface-2 px-3 py-2" data-testid="adc-lsb">1 LSB = {vref.toFixed(3)} V ÷ {codes} = <strong>{(lsb * 1000).toFixed(3)} mV</strong></p>
        <p className="rounded-lg bg-surface-2 px-3 py-2" data-testid="adc-code">{vin.toFixed(3)} V → code <strong>{code}</strong> {vin > vref ? "(clipped: input above reference)" : ""}</p>
        <p className="rounded-lg bg-surface-2 px-3 py-2">Quantisation noise: {qn.toFixed(2)} LSB rms (LSB ÷ √12)</p>
        <p className="rounded-lg bg-surface-2 px-3 py-2" data-testid="adc-noise">After averaging {n}: white part {whiteAvg.toFixed(2)} LSB, ripple part {(ripple / 2.83).toFixed(2)} LSB (unchanged), total ≈ <strong>{total.toFixed(2)} LSB rms</strong></p>
      </div>
      <p className="text-xs text-ink-3">Averaging divides the uncorrelated part by √n and leaves reference-correlated ripple untouched. Illustrative model.</p>
    </div>
  );
}
