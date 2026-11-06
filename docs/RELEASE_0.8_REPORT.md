# Release 0.8 report: curriculum depth

Branch `feat/release-0.8`, stacked on `feat/release-0.7` (PR #7). The remaining planned lessons across the 16 modules, two missions and four interactives. With this release every module meets or exceeds its roadmap lesson target except one deliberately planned lesson (low-power modes) kept so the "coming soon" path stays exercised.

## What was implemented

**Eleven lessons** (technically reviewed; references cited; numbers illustrative where stated)
- Module 1, fundamentals: *Reading a power tree* (regulator types, headroom, dissipation, I × R sag, decoupling vs bulk); *Op-amp sanity checks on the bench* (supplies and headroom, operating point, virtual short, oscillation); *ADC resolution, reference and noise* (LSB arithmetic, reference errors, SAR sample time, averaging limits) with the **ADC quantisation** calculator.
- Module 2, schematics and PCB: *Reading a schematic like a reviewer* (bring-up-order walk, boundary checks, finding format); *Datasheet triage* (three sections, three columns, the five numbers, thermal arithmetic).
- Module 3, MCU: *Interrupts and NVIC priorities without surprises* (numbering, grouping, states, the HAL_Delay deadlock, RTOS syscall limit, GPIO-and-scope measurement) with the **NVIC priorities** table.
- Module 4, interfaces: *CAN: arbitration, error frames and bus-off* (dominant/recessive, bitwise arbitration, frame fields, counters and states, the three measurements) with the **CAN arbitration** stepper.
- Module 5, embedded C: *Pointers to hardware: structs over memory maps* (overlay rules, volatile, reserved members, access types, host-testable seam).
- Module 6, embedded C++: *RAII for peripherals and critical sections* (guards, the embedded subset, what to switch off, static constructors).
- Module 7, firmware architecture: *Polling, interrupts and DMA* (the three-question decision, per-model costs, DMA traps) with the **PWM timer** calculator.
- Module 10, instrumentation: *Logic analysers: decoding a bus you did not design* (setup rules, first-principles identification, captures as evidence).

**Two missions**: *The rail that sags* (fundamentals: scope at the load, path resistance, bulk capacitance; setpoint raise and regulator swap judged) and *The schematic that almost shipped* (PCB: boot strap and I2C boundary findings with datasheet evidence; assumption and over-prescription judged).

**Interview bank**: 42 questions (11 new, one per lesson), 35 with cross-industry notes. **Glossary**: 211 terms (32 new). **Skills**: 11 new labels for targeted review.

**Journey**: unchanged; the 30-day path is the fast track. The journey test now asserts that the path covers at least 26 lessons and 8 missions and that every extra lesson is reachable from its curriculum module.

## Test and build evidence (local, Node 22)

| Check | Result |
|---|---|
| `npm run lint` | 0 errors, 0 warnings |
| `npm run typecheck` | clean |
| `npm test` | 8 files, 46 passed |
| `npm run build` | 37 lessons and 10 missions prerendered; all routes static |
| `npm run test:e2e` | 124 passed (62 scenarios × Pixel 7 and Desktop Chrome). New: ADC calculator and averaging with axe scan; CAN arbitration stepper and the termination misconception; NVIC grouping and kernel-call rule with axe scan; PWM calculator and the non-integer prescaler exercise; both missions through their traps; curriculum shows the new lessons and one remaining planned item |

One content defect was caught by the unit tests before this PR: a duplicated glossary id between a 0.2-era term and a new one; renamed.

## Known gaps

- One planned lesson remains (low-power modes and wake-up sources), kept deliberately.
- The 30-day path does not schedule the depth lessons; 0.9's prerequisite recommendations will surface them from wrong answers and weak skills.
- No second human technical review of this block; the CAN and NVIC numbers in particular should be checked against the reader's own parts.
