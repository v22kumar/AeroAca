# Release 0.4 report: journey days 16–20

Branch `feat/release-0.4`, stacked on `feat/release-0.3` (PR #3). Block 4 of the 30-day journey: firmware architecture, RTOS and embedded Linux.

## What was implemented

**Five lessons** (technically reviewed; references cited in each file; simulated readings labelled)
- *From reset vector to main(): what startup code does* (firmware architecture): vector table (initial MSP, reset vector, Thumb bit, VTOR), the reset handler in order (.data copy, .bss zero, SystemInit, constructors, main), the three pre-main faults and the correct bootloader jump. Interactive **startup sequence** visual steps through the flash/RAM map. Exercises: startup ordering, garbage-global diagnosis, safe-jump checklist.
- *Why the high-priority task starved: priority inversion* (RTOS): bounded vs unbounded inversion, priority inheritance and ceiling, which FreeRTOS primitives inherit, bounding worst-case blocking. Interactive **priority inversion** timeline with an inheritance toggle and adjustable medium-task length. Exercises: blocking-bound arithmetic with the "with inheritance" misconception named, inheriting primitive, remedies.
- *Queues vs shared buffers in ISR-to-task handoff* (RTOS): torn reads and lost samples, queue copy semantics, stream buffers, DMA double buffers, task notifications, the FromISR rules, queue sizing from rates. Exercises: torn-read recognition, queue sizing (byte-count misconception named), ISR rules.
- *Bootloaders, images and recovery paths* (firmware architecture): what a bootloader checks, A/B slots, header and boot flag written last, confirm-or-fallback with the watchdog, forced entry and the ROM bootloader. Exercises: power-loss-safe update ordering, bricked-at-97 % design fault, bootloader invariants.
- *Boot chain and device tree, from bootloader to login* (embedded Linux): ROM → SPL → U-Boot → kernel + DTB → init; device tree status/compatible/reg/pinctrl; kernel vs user space; the four-command diagnosis for a missing I2C device. Exercises: boot ordering, first check for a missing device, kernel vs user space.

**One mission**: *The task that never runs* (RTOS). Task-state snapshot, kernel trace and the lock's creation call isolate unbounded priority inversion through a binary semaphore; the mutex swap confirms by fix. Traps: raising the waiter's priority (wasteful) and adding delays to the medium tasks (risky).

**Interview bank**: 24 questions (5 new: startup before main, priority inversion, ISR-to-task handoff, power-loss-safe update, Linux boot chain and device tree), 17 with cross-industry notes.

**Glossary**: 140 terms (19 new: reset handler, .data/.bss, VTOR, SystemInit, priority inversion, priority inheritance, mutex, semaphore, queue, torn read, FromISR, stream and double buffers, task notification, stack high-water mark, image header and boot flag, device tree, U-Boot, kernel and user space, i2cdetect). Four candidate terms already existed from 0.1 to 0.3 and were not duplicated.

**Journey**: days 16–20 now use published content only; days 1–20 are fully published, 7 of 30 days still reference planned lessons. Every day remains a 15–45 minute session (test-enforced).

**Skills**: four new skill labels for targeted review (startup, RTOS, bootloader, embedded Linux). Curriculum: modules 7 (firmware architecture), 8 (RTOS) and 9 (embedded Linux) now have published lessons; module 8 has its mission.

## Test and build evidence (local, Node 22)

| Check | Result |
|---|---|
| `npm run lint` | 0 errors, 0 warnings |
| `npm run typecheck` | clean |
| `npm test` | 7 files, 43 passed (journey tests now assert days 1–20 fully published; day 21 is the first planned day) |
| `npm run build` | 17 lessons and 7 missions prerendered; all routes static |
| `npm run test:e2e` | 86 passed (43 scenarios × Pixel 7 and Desktop Chrome). New: startup-sequence visual with axe scan, priority-inversion visual and bound exercise with misconception feedback, queue-sizing misconception, RTOS mission through its traps with the mutex swap gated on reading the lock code, journey days 16–20 playable |

## Known gaps

- Days 21–30 reference planned content (blocks 5–6: PyVISA, serial automation, HIL, FMEA, standards, portfolio, mock interviews).
- The priority-inversion and startup visuals are illustrative models, not kernel traces; both are labelled as such.
- The portfolio track (STM32 sensor monitoring and fault detection) has not started.
- No second human technical review of block-4 content yet.
