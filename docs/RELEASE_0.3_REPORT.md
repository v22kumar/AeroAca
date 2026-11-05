# Release 0.3 report: journey days 11–15

Branch `feat/release-0.3`, stacked on `feat/release-0.2` (PR #2). Block 3 of the 30-day journey: integration, verification and root-cause analysis.

## What was implemented

**Four lessons** (technically reviewed; references cited in each file; simulated readings labelled)
- *A board bring-up checklist that actually gets used* (integration): stage order from unpowered inspection to peripherals one at a time; current limit as a measurement; what makes a checklist line verifiable (measurement point, instrument, expected value with tolerance, recorded actual, stop rule). Exercises: stage ordering, pre-power short reading, checklist fields.
- *Writing a test case that a reviewer can trust* (verification): the elements of a test case, expected results an instrument can show, proving the method with a known failing case, traceability from hazard to requirement to test. Exercises: testable expected result, trace-matrix fault finding, bit-time tolerance arithmetic. Interactive **traceability matrix**: link requirements to tests; the visual reports gaps, orphans and links whose method does not measure what the requirement states.
- *Root-cause analysis and the five whys that matter* (instrumentation): symptom, cause, root cause; three tests for a root cause; evidence chain (reproduce with a measured rate, isolate, confirm in both directions, prevent); corrective versus preventive action; fault-tree thinking for intermittent faults. Exercises: root-cause selection in a CAN starvation chain, evidence-chain ordering, preventive-action classification.
- *Interface control documents and integration faults* (integration): what an ICD pins down; the six usual integration faults and their signatures; a passing CRC as evidence; byte-order arithmetic (0x09C4 → 25.00 °C; read little-endian → 501.85 °C); golden-frame and reference tests. Exercises: little-endian decode with the big-endian misreading named, CRC-as-evidence reasoning, ICD field completeness. The Mars Climate Orbiter units mismatch is cited from the public mishap report.

**Two missions**
- *The requirement nobody could test* (verification): an untestable "respond quickly" requirement on a safety-relevant alarm. Decisive evidence is the hazard analysis (2 s derived from process rise rate and alarm margin); the trap is deriving the limit from the bench measurement (340 ms → "≤ 400 ms"), which the mission judges wasteful and explains.
- *Two boards, one bus, no agreement* (integration): a sensor and controller that each pass their own tests; the logic-analyser capture against one line of the ICD locates a byte-order fault in the controller's parser. Traps: a fudge-factor scaling constant (risky) and asking the sender to change the contract (wasteful).

**Interview bank**: 19 questions (4 new: bring-up checklist design, test case for a timing requirement, intermittent-fault root cause, two-boards integration), 12 with cross-industry notes.

**Glossary**: 121 terms (22 new: ICD, byte order, signedness, scaling, CRC, golden frame, RS-485, requirement, test case, traceability, verification/validation, regression and test levels, fault injection, hazard analysis, root cause (merged with the 0.1 entry), five whys/fishbone, corrective and preventive action, fault tree, current limit, rail-to-ground resistance, first article).

**Journey**: days 11–15 now use published content only; days 1–15 are fully published, 12 of 30 days still reference planned lessons. Every day remains a 15–45 minute session (test-enforced). Day 15 rehearses three questions, one new.

**Skills**: four new skill labels for targeted review (bring-up process, verification, root-cause analysis, interfaces and integration).

**Accessibility fix**: the axe scan of the new traceability visual found that the light-mode success and warning text colours fell below 4.5:1 on their soft backgrounds (4.34 and 3.73). The tokens were darkened (`--c-ok` #276a43, `--c-amber` #8f4f0a; 5.6:1 and 5.5:1) and the fix applies to every status pill, mission log and exercise feedback in the app.

## Test and build evidence (local, Node 22)

| Check | Result |
|---|---|
| `npm run lint` | 0 errors, 0 warnings |
| `npm run typecheck` | clean |
| `npm test` | 7 files, 43 passed (journey tests now assert days 1–15 fully published; day 16 is the first planned day) |
| `npm run build` | 12 lessons and 6 missions prerendered; all routes static |
| `npm run test:e2e` | 76 passed (38 scenarios × Pixel 7 and Desktop Chrome). New: ICD endian exercise with misconception feedback, traceability matrix gaps/orphans/bad link/completion with axe scan, both missions through their traps to the outcome, journey day 11 playable with its interview focus set |

## Known gaps

- Days 16–30 reference planned content (blocks 4–6: startup code, RTOS, ISR handoff, bootloaders, Linux, Python/PyVISA, HIL, FMEA, standards, portfolio).
- The traceability interactive is a fixed five-test set; it is not generated from the lesson's requirements table.
- The portfolio track (STM32 sensor monitoring and fault detection) has not started.
- No second human technical review of block-3 content yet.
