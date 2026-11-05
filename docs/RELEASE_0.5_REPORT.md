# Release 0.5 report: journey days 21–25

Branch `feat/release-0.5`, stacked on `feat/release-0.4` (PR #4). Block 5 of the 30-day journey: Python test automation, hardware-in-the-loop and reliability.

## What was implemented

**Four lessons** (technically reviewed; references cited in each file; simulations labelled)
- *Talking to a bench instrument with PyVISA* (Python and test automation): VISA and SCPI structure, the four PyVISA calls, common commands, the error queue, *OPC? synchronisation, timeouts from NPLC arithmetic, and a warm-up logging script whose columns a reviewer can trust. Interactive **SCPI console**: a simulated DMM that answers *IDN?, *RST, CONF, SENS:...:NPLC, READ?, MEAS?, SYST:ERR?, reports the reply time from NPLC and queues −113 for unknown headers. Exercises: code reading (timeout shorter than a 100-PLC reading), NPLC arithmetic with the 60 Hz misconception, log contents.
- *Serial communication and test logs in Python* (Python and test automation): pyserial calls, bytes versus text, timeout semantics, stale input buffers, and a request-reply helper with flush, deadline, complete-line check and tag matching. Exercises: one-command-late diagnosis, request-reply ordering, pyserial facts.
- *SIL, HIL and what each one proves* (verification): MIL, SIL, PIL and HIL by what is real at each level, what a HIL rig contains, fault insertion, the lowest level that catches each bug class, and the plant-model fidelity caveat. Exercises: lowest level for an I/O mapping fault, rig components, level ordering.
- *FMEA for a small embedded product* (verification): the row, severity-occurrence-detection scoring, RPN and its replacement by action-priority tables, single points of failure, actions that lower O or D but never S, and the traced test. Interactive **FMEA worksheet**: score the heater's open-thermistor row and watch which number each action moves. Exercises: RPN after an action (with the "lowered severity" misconception named), SPOF identification, which score each action changes.

**One mission**: *The flaky automated test* (Python and test automation). The log's timestamps show a late reply consumed as the next command's answer; the helper shows why; the protocol fix confirms with 5 000 clean cycles. Traps: a fixed sleep (risky), a defect ticket against the firmware (wasteful), a blanket long timeout (covers the tail, leaves matching unfixed).

**Interview bank**: 28 questions (4 new: automate a measurement, flaky-test diagnosis, SIL vs HIL, FMEA walkthrough), 21 with cross-industry notes.

**Glossary**: 157 terms (17 new: SCPI, VISA/PyVISA, NPLC, error queue, pyserial, stale reply, request-reply protocol, flaky test, HIL, SIL/MIL/PIL, fault-insertion unit, plant model, FMEA, severity-occurrence-detection, RPN and action priority, single point of failure, plausibility check).

**Journey**: days 21–25 now use published content only; days 1–25 are fully published, 3 of 30 days (26–28) still reference planned lessons. Day 25 rehearses four questions including the new flaky-test one.

**Skills**: two new skill labels for targeted review (Python test automation, reliability and FMEA). Curriculum: module 13 (Python and test automation) now has two lessons and a mission; module 12 (verification) has three lessons and a mission.

## Test and build evidence (local, Node 22)

| Check | Result |
|---|---|
| `npm run lint` | 0 errors, 0 warnings |
| `npm run typecheck` | clean |
| `npm test` | 7 files, 43 passed (journey tests now assert days 1–25 fully published; day 26 is the first planned day) |
| `npm run build` | 21 lessons and 8 missions prerendered; all routes static |
| `npm run test:e2e` | 96 passed (48 scenarios × Pixel 7 and Desktop Chrome). New: SCPI console identity, NPLC, reading time, unknown header and error queue with axe WCAG 2.0 A/AA scan; NPLC arithmetic misconception; FMEA worksheet actions and the severity misconception; flaky-test mission through its traps with the fix gated on reading the helper; journey days 21–25 playable |

Two defects were caught by the new tests before this PR: the SCPI transcript was a scrollable region without keyboard focus (axe, mobile viewport), and the FMEA action-priority banding rated a rare, detected safety row as high. Both fixed.

## Known gaps

- Days 26–28 reference planned content (block 6: standards, cross-industry transfer, debugging-story telling).
- The SCPI console models one DMM dialect and a handful of commands; it is labelled as a simulation.
- No real instrument or serial device is exercised; the lessons say so and the interview sample answers model honest phrasing about simulated practice.
- The portfolio track (STM32 sensor monitoring and fault detection) has not started.
