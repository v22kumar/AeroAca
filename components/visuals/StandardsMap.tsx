"use client";

import { useState } from "react";

const industries = [
  {
    id: "avionics",
    label: "Avionics",
    rows: [
      { std: "ARP4754A", governs: "Aircraft and system development process", produces: "System requirements allocated to items; development plans" },
      { std: "ARP4761", governs: "Safety assessment (FHA, PSSA, SSA, FTA, FMEA); source of the DAL", produces: "Failure-condition classification; FMEA inputs" },
      { std: "DO-178C", governs: "Software objectives by DAL A–E; requirements-based verification; structural coverage (statement C, decision B, MC/DC A)", produces: "Test cases and procedures traced to requirements; results; coverage analysis; reviews; problem reports" },
      { std: "DO-254", governs: "Complex electronic hardware (FPGA, ASIC, boards) by DAL", produces: "Hardware verification cases and results; elemental analysis at high DAL" },
      { std: "DO-160", governs: "Environmental qualification: temperature, altitude, vibration, power, lightning, EMC", produces: "Section-by-section test procedures and records" },
    ],
    level: "DAL A (catastrophic) to E (no effect), from failure-condition severity.",
    honest: "'I executed requirements-based tests on a DAL C item and recorded results against the trace matrix.' Nobody is 'DO-178C certified'.",
  },
  {
    id: "automotive",
    label: "Automotive",
    rows: [
      { std: "ISO 26262", governs: "Functional safety of road-vehicle E/E systems; HARA → ASIL → safety goals; verification rigour and hardware metrics by ASIL", produces: "Test specs traced to safety requirements; HIL fault-injection results; diagnostic-coverage evidence; confirmation reviews" },
      { std: "ASPICE", governs: "Process capability (levels 0–5): requirements, design, test, configuration management; not safety", produces: "Plans, traceability, review records, metrics" },
      { std: "AUTOSAR", governs: "Software architecture and interfaces (Classic and Adaptive); not a safety or process standard", produces: "Component and interface descriptions; integration tests against the RTE" },
      { std: "ISO/SAE 21434", governs: "Cybersecurity engineering for road vehicles", produces: "Threat analysis and risk assessment; security test evidence" },
    ],
    level: "ASIL QM, A, B, C, D from severity, exposure and controllability in the HARA.",
    honest: "'I have not worked on an ISO 26262 programme; I know how ASIL is derived and what fault-injection evidence a safety mechanism needs.'",
  },
  {
    id: "medical",
    label: "Medical",
    rows: [
      { std: "ISO 13485", governs: "Quality management system for medical devices; holds the design history file", produces: "Controlled records; verification protocols and reports in the DHF" },
      { std: "ISO 14971", governs: "Risk management through the device's life; source of safety-requirement limits", produces: "Risk analysis, risk controls, risk management file" },
      { std: "IEC 62304", governs: "Software life cycle; safety classes A, B, C from harm", produces: "Unit, integration and system test records at the class's rigour; problem resolution" },
      { std: "IEC 60601-1 / -1-2", governs: "Electrical basic safety and essential performance; EMC emissions and immunity", produces: "Leakage, dielectric, creepage records; EMC plans naming essential performance" },
    ],
    level: "Software class A, B, C from the harm a failure could cause; essential performance from risk.",
    honest: "'I wrote test procedures with measured expected results traced to requirements; in your terms, verification protocols for the DHF traced to risk controls.'",
  },
  {
    id: "industrial",
    label: "Industrial",
    rows: [
      { std: "IEC 61508", governs: "Functional safety of E/E/PE safety-related systems; SIL 1–4 from required risk reduction; PFD/PFH, hardware fault tolerance, systematic capability", produces: "FMEDA inputs; proof-test procedures; fault-injection evidence for diagnostic coverage; verification against the SRS" },
      { std: "IEC 61511", governs: "Safety instrumented systems in the process industry", produces: "SIL verification for safety instrumented functions" },
      { std: "ISO 13849 / IEC 62061", governs: "Machinery safety; performance levels a–e", produces: "Category and PL calculations; validation records" },
      { std: "IEC 62443", governs: "Industrial automation cybersecurity; security levels for zones and conduits", produces: "Security requirements and test evidence" },
    ],
    level: "SIL 1 to 4 (safety integrity level, not software-in-the-loop) from required risk reduction; PL a–e for machinery.",
    honest: "'I have written fault-injection tests that prove a monitor detects an open sensor within its time limit; in your terms, the evidence behind diagnostic coverage.'",
  },
  {
    id: "consumer",
    label: "Consumer",
    rows: [
      { std: "CE / FCC / UKCA marking", governs: "Regulatory conformity: EMC, radio, electrical safety (IEC 62368-1 for AV/ICT equipment)", produces: "Test reports from accredited labs; declaration of conformity; technical file" },
      { std: "IEC 61000 series", governs: "EMC emissions and immunity test methods", produces: "Pre-compliance and compliance EMC records" },
      { std: "RoHS / REACH", governs: "Hazardous substances in materials", produces: "Supplier declarations; material compliance records" },
    ],
    level: "No criticality ladder; cost, volume, EMC and regulatory conformity dominate.",
    honest: "'I design tests that ask what the cheapest sufficient evidence is, and I have root-caused field-style faults with a measured rate before and after.'",
  },
];

export function StandardsMap() {
  const [id, setId] = useState("avionics");
  const ind = industries.find((i) => i.id === id)!;
  return (
    <div className="flex flex-col gap-3">
      <div role="tablist" aria-label="Industry" className="flex flex-wrap gap-2">
        {industries.map((i) => (
          <button key={i.id} role="tab" aria-selected={id === i.id} onClick={() => setId(i.id)} data-testid={`standards-tab-${i.id}`} className={`min-h-9 rounded-full border px-3 text-sm font-semibold ${id === i.id ? "border-accent bg-accent-soft text-accent" : "border-line bg-surface text-ink-2"}`}>
            {i.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" data-testid="standards-panel" className="flex flex-col gap-2">
        <p className="rounded-lg bg-surface-2 px-3 py-2 text-sm"><strong>Criticality:</strong> {ind.level}</p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className="border border-line bg-surface-2 p-2 text-left font-semibold">Standard</th>
                <th className="border border-line bg-surface-2 p-2 text-left font-semibold">Governs</th>
                <th className="border border-line bg-surface-2 p-2 text-left font-semibold">What a test or hardware engineer produces</th>
              </tr>
            </thead>
            <tbody>
              {ind.rows.map((r) => (
                <tr key={r.std}>
                  <th scope="row" className="border border-line p-2 text-left font-semibold whitespace-nowrap">{r.std}</th>
                  <td className="border border-line p-2 text-ink-2">{r.governs}</td>
                  <td className="border border-line p-2 text-ink-2">{r.produces}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="rounded-lg border border-accent/30 bg-accent-soft/40 px-3 py-2 text-sm" data-testid="standards-honest"><strong>Honest phrasing:</strong> {ind.honest}</p>
      </div>
    </div>
  );
}
