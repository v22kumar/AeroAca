"use client";

import { useState } from "react";

/** STM32F4 clock-tree calculator: source, PLL dividers, bus prescalers, limits and the timer doubling rule. Illustrative. */
export function ClockTree() {
  const [source, setSource] = useState<"HSI" | "HSE">("HSI");
  const [hse, setHse] = useState(8);
  const [m, setM] = useState(16);
  const [n, setN] = useState(336);
  const [p, setP] = useState(4);
  const [ahb, setAhb] = useState(1);
  const [ppre1, setPpre1] = useState(2);
  const [ppre2, setPpre2] = useState(1);
  const [part, setPart] = useState<"F401" | "F407">("F401");
  const src = source === "HSI" ? 16 : hse;
  const vcoIn = src / m;
  const vco = vcoIn * n;
  const sysclk = vco / p;
  const maxSys = part === "F401" ? 84 : 168;
  const maxApb1 = 42;
  const maxApb2 = 84;
  const hclk = sysclk / ahb;
  const apb1 = hclk / ppre1;
  const apb2 = hclk / ppre2;
  const tim1 = ppre1 === 1 ? apb1 : apb1 * 2;
  const tim2 = ppre2 === 1 ? apb2 : apb2 * 2;
  const ok = (cond: boolean) => (cond ? "bg-ok-soft text-ok" : "bg-amber-soft text-amber");
  const f = (x: number) => (Number.isInteger(x) ? `${x}` : x.toFixed(2));
  const sel = (label: string, value: number, opts: number[], set: (v: number) => void, testId: string) => (
    <label className="flex flex-col gap-1 text-sm">
      <span>{label}</span>
      <select value={value} onChange={(e) => set(Number(e.target.value))} data-testid={testId} className="rounded-lg border border-line bg-surface px-2 py-1">
        {opts.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
  const boxes: [number, string][] = [
    [4, `${source} ${src}`],
    [64, "÷M ×N ÷P"],
    [136, `SYSCLK ${f(sysclk)}`],
    [214, `HCLK ${f(hclk)}`],
    [284, "APB1 / APB2"],
  ];
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <label className="flex flex-col gap-1 text-sm">
          <span>Part</span>
          <select value={part} onChange={(e) => setPart(e.target.value as "F401" | "F407")} data-testid="ct-part" className="rounded-lg border border-line bg-surface px-2 py-1">
            <option>F401</option>
            <option>F407</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>Source</span>
          <select value={source} onChange={(e) => setSource(e.target.value as "HSI" | "HSE")} data-testid="ct-source" className="rounded-lg border border-line bg-surface px-2 py-1">
            <option>HSI</option>
            <option>HSE</option>
          </select>
        </label>
        {source === "HSE" ? sel("HSE MHz", hse, [4, 8, 12, 16, 25], setHse, "ct-hse") : <p className="self-end text-xs text-ink-3">HSI = 16 MHz ± 1 %</p>}
        {sel("PLL M (÷)", m, [2, 4, 8, 12, 16, 25], setM, "ct-m")}
        {sel("PLL N (×)", n, [192, 200, 240, 288, 336, 360, 400, 432], setN, "ct-n")}
        {sel("PLL P (÷)", p, [2, 4, 6, 8], setP, "ct-p")}
        {sel("AHB (÷)", ahb, [1, 2, 4], setAhb, "ct-ahb")}
        {sel("APB1 (÷)", ppre1, [1, 2, 4, 8, 16], setPpre1, "ct-ppre1")}
        {sel("APB2 (÷)", ppre2, [1, 2, 4, 8, 16], setPpre2, "ct-ppre2")}
      </div>
      <svg viewBox="0 0 360 60" width="100%" role="img" aria-label="Clock tree: source, PLL, SYSCLK, HCLK, then APB1 and APB2 with timers" className="max-h-20 text-ink">
        {boxes.map(([x, label], i) => (
          <g key={label}>
            <rect x={x} y="18" width="68" height="24" rx="6" fill="none" stroke="currentColor" />
            <text x={x + 34} y="34" fontSize="9" textAnchor="middle" fill="currentColor">
              {label}
            </text>
            {i < 4 && <line x1={x + 68} y1="30" x2={x + 72} y2="30" stroke="var(--c-accent)" strokeWidth="2" />}
          </g>
        ))}
      </svg>
      <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        <p className={`rounded-lg px-3 py-2 ${ok(vcoIn >= 1 && vcoIn <= 2)}`} data-testid="ct-vcoin">
          VCO input {src} / {m} = <strong>{f(vcoIn)} MHz</strong> (must be 1 to 2)
        </p>
        <p className={`rounded-lg px-3 py-2 ${ok(vco >= 192 && vco <= 432)}`} data-testid="ct-vco">
          VCO {f(vcoIn)} × {n} = <strong>{f(vco)} MHz</strong> (must be 192 to 432)
        </p>
        <p className={`rounded-lg px-3 py-2 ${ok(sysclk <= maxSys)}`} data-testid="ct-sysclk">
          SYSCLK {f(vco)} / {p} = <strong>{f(sysclk)} MHz</strong> (≤ {maxSys} on the {part})
        </p>
        <p className="rounded-lg bg-surface-2 px-3 py-2" data-testid="ct-hclk">
          HCLK = SYSCLK / {ahb} = <strong>{f(hclk)} MHz</strong>; SysTick reload for 1 ms = {Math.round(hclk * 1000) - 1}
        </p>
        <p className={`rounded-lg px-3 py-2 ${ok(apb1 <= maxApb1)}`} data-testid="ct-apb1">
          APB1 = {f(hclk)} / {ppre1} = <strong>{f(apb1)} MHz</strong> (≤ {maxApb1}); USART2, I2C, TIM2 to TIM7
        </p>
        <p className={`rounded-lg px-3 py-2 ${ok(apb2 <= maxApb2)}`} data-testid="ct-apb2">
          APB2 = {f(hclk)} / {ppre2} = <strong>{f(apb2)} MHz</strong> (≤ {maxApb2}); USART1, SPI1, ADC, TIM1, TIM8
        </p>
        <p className="rounded-lg bg-accent-soft/60 px-3 py-2" data-testid="ct-tim1">
          Timers on APB1 run at <strong>{f(tim1)} MHz</strong> ({ppre1 === 1 ? "prescaler 1: same as the bus" : "prescaler not 1: twice the bus"})
        </p>
        <p className="rounded-lg bg-accent-soft/60 px-3 py-2" data-testid="ct-tim2">
          Timers on APB2 run at <strong>{f(tim2)} MHz</strong> ({ppre2 === 1 ? "prescaler 1: same as the bus" : "prescaler not 1: twice the bus"})
        </p>
      </div>
      <p className="text-xs text-ink-3">Illustrative calculator for the STM32F4 tree (TIMPRE = 0). Flash wait states must be raised before switching to a higher SYSCLK; USB needs PLL Q to give 48 MHz. Other families change the limits, not the structure.</p>
    </div>
  );
}
