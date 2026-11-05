# Release 0.7 report: the portfolio track

Branch `feat/release-0.7`, stacked on `feat/release-0.6` (PR #6). The STM32 sensor-monitoring and fault-detection project, usable end to end with a simulation path and an optional hardware path that are recorded separately.

## What was implemented

**Project content** (`content/projects/stm32-sensor-monitor.ts`): seven stages, each with a goal, guidance grounded in the academy's lessons, and deliverables tagged by path.

| Stage | Deliverables | Paths |
|---|---|---|
| 1 Requirements | R1–R7 with quantities and methods; rationale for the 2.0 s alarm limit (hazard-style, explicitly not a standard) | written |
| 2 Architecture | Block diagram and three decisions with reasons; timing budget table | written |
| 3 Interfaces | ICD for the UART log line and the ALARM output; TMP102 register summary with golden pairs | written |
| 4 Firmware and sensor model | Detection logic as a pure function (sim and hw, separately); Python sensor model with fault injection (sim); TMP102 driver, logger, alarm, banner (hw); watchdog from the timing budget (hw) | sim, hw, both |
| 5 Tests and traceability | Unit tests with golden pairs and a known-failing case (sim); TC-01–TC-07 traced to R1–R7 with a matrix (written); execution records (sim and hw, separately) | sim, written, both |
| 6 Fault injection | Simulator injection with latency per fault (sim); logic-analyser injection on the board (hw); watchdog reset with cause logged (hw); FMEA rows before and after (written) | sim, hw, written |
| 7 Report | One-page outline in six headings; a 90-second debugging story | written |

**In-browser sensor-monitor lab** (`sensor-monitor-lab` visual, shown in stage 6): a deterministic model of the monitor's 10 Hz loop with the firmware's detection rules (NACK, range, jump > 5 °C, stuck for 5 s). Inject one of five faults at a chosen time and read the detection latency and the ICD-format log. It reports NACK, range and jump within the 2.0 s requirement, STUCK at 5 s as outside it, and slow drift as a known gap for the FMEA row. Labelled as a simulation in the UI; counts as evidence only when the learner ticks the simulation deliverable.

**Portfolio page** (`/portfolio`): simulation and hardware notes, the stages as disclosures with the current stage open, per-path tick boxes per deliverable, grounding links to lessons and missions, and the **evidence table** (written / simulation / hardware per deliverable) derived only from ticks, with the honest summary sentence for an empty or partial hardware column. Linked from the curriculum header and from journey day 28's career action, which now carries an in-app link.

**Progress model**: ticks stored under `applyDone` with `project:` keys (no schema migration; export/import carry them); `lib/progress/portfolio.ts` derives stage state, per-path counts and the evidence table. ADR-12 records the decision that the app never verifies or infers portfolio evidence.

**Schema**: `projectSchema` and friends; journey apply items accept an optional `href`; `Disclosure` accepts `defaultOpen`.

## Test and build evidence (local, Node 22)

| Check | Result |
|---|---|
| `npm run lint` | 0 errors, 0 warnings |
| `npm run typecheck` | clean |
| `npm test` | 8 files, 46 passed (new: project validity and grounding; simulation and hardware recorded separately; evidence table derived from ticks only; whole-project completion and export/import round trip) |
| `npm run build` | `/portfolio` added; all routes static |
| `npm run test:e2e` | 110 passed (55 scenarios × Pixel 7 and Desktop Chrome). New: stages render with the current stage open, a simulation-only tick persists across reload and shows as done/not done in the evidence table with the hardware column untouched, axe WCAG 2.0 A/AA scan of the page; the lab detects NACK within the limit, reports STUCK outside it and drift as a gap; day 28 and the curriculum link to the track |

## Known gaps

- One project only; the schema supports more.
- The lab models the detection rules, not the I2C driver, the watchdog or the real alarm output; the page says so.
- No learner has yet completed the track; the 1.0 gate for real-learner feedback remains open.
