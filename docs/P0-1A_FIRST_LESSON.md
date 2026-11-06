# P0-1a: the first lesson to implement after pilot acceptance

Specification only. Nothing here is built; building starts when the pilot findings are recorded in `PILOT.md` and the teaching template has been adjusted. This document exists so that the first implementation slice is agreed before it is written, and so that it is judged by what the learner can do afterwards rather than by its existence.

## The component

**A bounded frame parser in C**: `frame.h` / `frame.c`, a function that is fed bytes one at a time from a serial link and emits complete, checked frames. Frame layout (synthetic, documented in the lesson): start byte `0x7E`, one length byte (payload length 1 to 64), payload, CRC-8 over length and payload. The parser is a small state machine with a fixed buffer, no dynamic allocation, no blocking, and a clear contract: it never writes past its buffer, never emits a frame whose CRC failed, and resynchronises after garbage.

Why this component: it is the smallest thing that is **independently buildable** (one `.c`, one `.h`, one test file, one Makefile), **debuggable** (a wrong length byte produces a reproducible, inspectable failure), **testable** (every rule in the contract is one test), and **realistic** (every telemetry, bus-monitor and test-bench tool she will ever touch has one of these inside). It reuses what the open PRs already teach (state machines, ring buffers, fixed-width integers, bit masks, the CRC-16 lab) without repeating them.

## Lesson: "Build it, break it, prove it: a frame parser under test"

Module 5 (Embedded C), `format: "arc"`, prerequisites `c-foundations-for-firmware`, `fixed-width-integers-overflow-shifts`, `state-machines-that-survive-review`. Rows ENG-041, ENG-042, ENG-048, ENG-062, ENG-074. Pathways A, B, D. About 18 minutes on the phone plus a 40-minute laptop session.

| Stage | Content | Depth |
|---|---|---|
| Why | A bench tool shows "CRC error" on one frame in a thousand, and once a day it crashes. The parser that nobody tested. | all |
| Intuition | A parser is a person reading a letter from a noisy telephone line: wait for "hello", write down how many words are coming, write them down, check the final digit, and if anything is wrong, say nothing and wait for the next "hello". No code, no terms. | Understand |
| How | The frame drawn byte by byte; the state machine as a diagram with four states and the arrows labelled by the byte that causes each one. | Understand |
| Theory 1 | The contract, stated as five sentences a test can check: start-byte resync; length bounds; no overflow; CRC gate; one callback per good frame. | Understand |
| Theory 2 | What a unit test for C looks like without a framework: a tiny `CHECK` macro, a counter, a non-zero exit code on failure, and why that is enough for a first project. | Apply |
| Example | `frame.c` walked through line by line (walkthrough step), then `test_frame.c` with its first three tests and their expected output. | Understand (code), Apply (tests) |
| Practise, guided | Lab `c-frame`: `make test` builds and runs; expected output reproduced by CI. Guided exercise with hints: which test would catch a parser that accepts length 0? | Understand |
| Practise, independent | Exercise without hints: predict the parser's state sequence for a given byte stream containing a corrupted length byte. | Apply |
| Complexity | **The realistic fault.** `make test FAULT=1` builds the version from the bench tool: the length check is `if (len > 64)` where the buffer is 64 bytes and the index runs 0 to `len`, so a length of exactly 64 writes one byte past the end. On a PC it corrupts the next variable; on the target it corrupts the stack and crashes once a day. The lesson shows the failing test output, then the GDB session that finds the line (watchpoint on the byte after the buffer), then the fix and the passing output. The negative test is kept: the harness must fail on the faulty build or it proves nothing. | Master |
| Check | Independent debugging task with **no hints and no worked twin**: a second faulty build, `FAULT=2`, contains a fault the lesson has not shown (the CRC is computed over the payload only, so a corrupted length byte that still lands in range passes). The learner must find it from the test output and the code, name the line, and write the one test that would have caught it. Self-checked against a hidden model answer with a five-point rubric; recorded as a brief. | Master |
| Interview | "Walk me through how you would test a serial frame parser, and how you would find an off-by-one that only crashes on the target." | Master |
| Work | Embedded development (every driver has a parser); aerospace and UAV (bus monitors, telemetry decoders, the 1553 lesson's words); R&D and design (the contract is the ICD's software half); verification and interviews (a negative test that catches a known fault is the evidence a reviewer asks for). | all |

## Lab files (`labs/c/frame/`)

`frame.h`, `frame.c`, `test_frame.c`, `Makefile` (targets `test`, `test FAULT=1`, `test FAULT=2`, `clean`; `-std=c11 -Wall -Wextra -Werror`; the two faults selected by `-DFAULT=n`). Expected outputs for the clean build and the `FAULT=1` build are both recorded in `lib/labs/generated.ts` and reproduced by `tests/labs.test.ts`, so CI proves the harness detects the defect, as the implementation plan's lab gate requires. The `FAULT=2` output is deliberately **not** shown in the lesson; CI still verifies it.

## What the learner must be able to do afterwards (the acceptance test for the slice)

1. Build the component from a clean checkout with one command and state the compiler and version used.
2. Explain the contract in her own words and say which test checks each sentence of it.
3. Predict the state sequence for an unseen byte stream (independent exercise, zero hints).
4. Given the `FAULT=2` build, find the fault from the evidence, name the line, and write the missing test (independent brief, no worked twin). This is the item that distinguishes understanding from following along.
5. Retain the evidence: source, Makefile, test log before and after, GDB transcript for `FAULT=1`.

## Checks before merge

Content schema, teaching-format rules, labs rebuilt in CI with the negative case, unit tests, lint, typecheck, build, pilot and lesson browser specs with axe on both profiles, `CONTENT_REVIEW.md` row, second technical reader requested. Progress store unchanged.

## What it does not claim

Running the parser on a PC is not running it on an STM32; the lesson says so and the board path is a separate, optional lab. Passing the tests shows the component meets the stated contract, not that the learner is a firmware engineer.
