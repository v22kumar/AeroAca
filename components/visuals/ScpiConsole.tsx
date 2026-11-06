"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

type Line = { dir: "tx" | "rx" | "note"; text: string };

/** A small simulated SCPI DMM: enough of one dialect to practise structure, queries, *OPC? and the error queue. */
export function ScpiConsole() {
  const [input, setInput] = useState("*IDN?");
  const [lines, setLines] = useState<Line[]>([{ dir: "note", text: "Simulated DMM connected (USB0::0x2A8D::0x1301::SIM00000001::INSTR). Readings are generated, not measured." }]);
  const [func, setFunc] = useState<"VOLT:DC" | "VOLT:AC" | "RES">("VOLT:DC");
  const [range, setRange] = useState(10);
  const [nplc, setNplc] = useState(1);
  const [errors, setErrors] = useState<string[]>([]);
  const [seed, setSeed] = useState(1);

  const rand = () => {
    // Deterministic pseudo-random so the console behaves the same for everyone.
    const x = Math.sin(seed * 9301 + 49297) * 233280;
    setSeed((s) => s + 1);
    return x - Math.floor(x);
  };
  const reading = () => {
    const base = func === "RES" ? 9985.2 : func === "VOLT:AC" ? 0.0123 : 3.2987;
    const noise = (func === "RES" ? 0.8 : 0.001) / Math.sqrt(nplc);
    const v = base + (rand() - 0.5) * 2 * noise;
    return func === "RES" ? v.toExponential(6).toUpperCase().replace("E+", "E+0") : `${v >= 0 ? "+" : ""}${v.toExponential(8).toUpperCase().replace("E+", "E+0")}`;
  };
  const send = () => {
    const raw = input.trim();
    if (!raw) return;
    const out: Line[] = [{ dir: "tx", text: raw }];
    const cmds = raw.split(";").map((c) => c.trim()).filter(Boolean);
    const newErrors: string[] = [];
    for (const c of cmds) {
      const up = c.toUpperCase();
      const isQuery = up.endsWith("?");
      const head = up.replace(/\?$/, "").split(/\s+/)[0] ?? "";
      const arg = up.replace(/\?$/, "").slice(head.length).trim();
      const norm = head.replace(/^CONFIGURE/, "CONF").replace(/^MEASURE/, "MEAS").replace(/^SENSE/, "SENS").replace(/VOLTAGE/, "VOLT").replace(/RESISTANCE/, "RES").replace(/^SYSTEM/, "SYST").replace(/ERROR/, "ERR");
      if (norm === "*IDN" && isQuery) out.push({ dir: "rx", text: "AeroAca,SIM-DMM,SIM00000001,1.0 (simulated)" });
      else if (norm === "*RST" && !isQuery) { setFunc("VOLT:DC"); setRange(10); setNplc(1); }
      else if (norm === "*CLS" && !isQuery) { setErrors([]); }
      else if (norm === "*OPC" && isQuery) out.push({ dir: "rx", text: "1" });
      else if ((norm === "CONF:VOLT:DC" || norm === "CONF:VOLT:AC" || norm === "CONF:RES") && !isQuery) {
        setFunc(norm.slice(5) as "VOLT:DC");
        const r = Number(arg.split(",")[0]);
        if (arg && (Number.isNaN(r) || r <= 0)) newErrors.push('-222,"Data out of range"');
        else if (arg) setRange(r);
      } else if (norm === "CONF" && isQuery) out.push({ dir: "rx", text: `"${func} ${range.toExponential(2).toUpperCase()},${(range / 1e4).toExponential(2).toUpperCase()}"` });
      else if ((norm === "MEAS:VOLT:DC" || norm === "MEAS:VOLT:AC" || norm === "MEAS:RES") && isQuery) { setFunc(norm.slice(5) as "VOLT:DC"); out.push({ dir: "rx", text: reading() }); out.push({ dir: "note", text: `(reply after ${(nplc * 20).toFixed(0)} ms: NPLC ${nplc} at 50 Hz)` }); }
      else if (norm === "READ" && isQuery) { out.push({ dir: "rx", text: reading() }); out.push({ dir: "note", text: `(reply after ${(nplc * 20).toFixed(0)} ms: NPLC ${nplc} at 50 Hz)` }); }
      else if ((norm === "SENS:VOLT:DC:NPLC" || norm === "SENS:RES:NPLC") && !isQuery) {
        const n = Number(arg);
        if ([0.02, 0.2, 1, 10, 100].includes(n)) setNplc(n);
        else newErrors.push('-222,"Data out of range"');
      } else if ((norm === "SENS:VOLT:DC:NPLC" || norm === "SENS:RES:NPLC") && isQuery) out.push({ dir: "rx", text: `+${nplc.toExponential(8).toUpperCase().replace("E+", "E+0")}` });
      else if (norm === "SYST:ERR" && isQuery) {
        const e = errors[0];
        if (e) { out.push({ dir: "rx", text: e }); setErrors((prev) => prev.slice(1)); } else out.push({ dir: "rx", text: '+0,"No error"' });
      } else if (isQuery && !norm.startsWith("*") && (norm.startsWith("CONF") || norm.startsWith("SENS") || norm.startsWith("MEAS") || norm.startsWith("READ"))) newErrors.push('-113,"Undefined header"');
      else newErrors.push('-113,"Undefined header"');
    }
    if (newErrors.length) {
      setErrors((prev) => [...prev, ...newErrors]);
      out.push({ dir: "note", text: `(no reply; ${newErrors.length} entr${newErrors.length > 1 ? "ies" : "y"} added to the error queue; send SYST:ERR? to read)` });
    }
    setLines((prev) => [...prev, ...out].slice(-40));
    setInput("");
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="h-56 overflow-y-auto rounded-lg border border-line bg-surface p-2 font-mono text-xs" data-testid="scpi-log" role="log" aria-label="Instrument transcript" tabIndex={0}>
        {lines.map((l, i) => (
          <div key={i} className={l.dir === "tx" ? "text-accent" : l.dir === "rx" ? "text-ink" : "text-ink-3"}>
            {l.dir === "tx" ? "> " : l.dir === "rx" ? "< " : "  "}
            {l.text}
          </div>
        ))}
      </div>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          aria-label="SCPI command"
          data-testid="scpi-input"
          spellCheck={false}
          autoCapitalize="off"
          className="min-h-11 flex-1 rounded-lg border border-line bg-surface px-3 font-mono text-sm"
        />
        <Button type="submit" size="sm" data-testid="scpi-send">
          Send
        </Button>
      </form>
      <div className="flex flex-wrap gap-1">
        {["*IDN?", "*RST", "CONF:VOLT:DC 10,0.001", "SENS:VOLT:DC:NPLC 10", "READ?", "MEAS:RES?", "SYST:ERR?"].map((c) => (
          <button key={c} type="button" onClick={() => setInput(c)} className="rounded-md border border-line bg-surface-2 px-2 py-1 font-mono text-[11px] text-ink-2 hover:border-accent">
            {c}
          </button>
        ))}
      </div>
      <p className="text-xs text-ink-3" data-testid="scpi-state">
        State: {func}, range {range}, NPLC {nplc}, error queue {errors.length}. Simulation.
      </p>
    </div>
  );
}
