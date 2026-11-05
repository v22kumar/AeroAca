import type { Lesson } from "@/lib/content/schema";

export const fixedWidthIntegersOverflowShifts: Lesson = {
  slug: "fixed-width-integers-overflow-shifts",
  moduleId: "embedded-c",
  title: "Fixed-width integers, overflow and shifts",
  summary: "Embedded C is arithmetic on bits with sharp edges. Learn how fixed-width types wrap, where the compiler silently promotes to int, which shifts are undefined, and how to measure elapsed time correctly across a timer wrap.",
  durationMinutes: 9,
  whyItMatters: "Integer promotion and overflow bugs pass every test on the bench and fail at 49.7 days, at 65 536 ticks, or on the one build with a different optimisation level. Interviewers use short snippets about them to test whether you really know C or only know syntax.",
  objectives: [
    "Predict the result of arithmetic on uint8_t, uint16_t and uint32_t values, including wrap-around and integer promotion.",
    "State which shift and overflow operations are undefined behaviour and write masks and shifts that are not.",
    "Write a timer-elapsed comparison that stays correct when the counter wraps.",
  ],
  review: {
    status: "technically-reviewed",
    note: "Semantics follow ISO C (C99/C11): integer promotions, unsigned wrap-around (defined), signed overflow and out-of-range shifts (undefined). Type sizes assume the 32-bit Arm EABI used by Cortex-M toolchains: int is 32 bits, char is unsigned by default in GCC for Arm.",
  },
  references: [
    {
      title: "ISO/IEC 9899 (C standard): integer promotions (6.3.1.1), unsigned arithmetic (6.2.5), bitwise shift operators (6.5.7)",
      note: "The authoritative text on which operations are defined, implementation-defined and undefined.",
    },
    {
      title: "Arm Procedure Call Standard for the Arm Architecture (AAPCS32) and GCC Arm options",
      note: "int is 32 bits on Cortex-M; GCC for Arm treats plain char as unsigned unless -fsigned-char is given.",
      url: "https://github.com/ARM-software/abi-aa",
    },
  ],
  steps: [
    {
      type: "scenario",
      title: "Fine for 49 days",
      body: `A field unit logs a sensor every 100 ms, driven by this check:

\`\`\`c
if (HAL_GetTick() > next_sample) {
    log_sample();
    next_sample = HAL_GetTick() + 100;
}
\`\`\`

It passes every test. After 49.7 days of uptime the logging stops and never resumes. Nobody can reproduce it on the bench.

HAL_GetTick() returns a 32-bit millisecond counter. 2³² ms is 49.71 days. When it wrapped to zero, \`next_sample\` was still near 4 294 967 295, and the comparison became false for another 49 days. One expression, one unit returned from the field. The fix is one line, and understanding why it works is this lesson.`,
    },
    {
      type: "concept",
      title: "Widths, wrap-around and promotion",
      body: `Use the **fixed-width types** from \`<stdint.h>\`: \`uint8_t\`, \`int16_t\`, \`uint32_t\` and so on. They say exactly how many bits you have, which \`int\` and \`long\` do not.

**Unsigned arithmetic wraps**, by definition, modulo 2ᴺ. For a \`uint8_t\`, 250 + 10 = 260 mod 256 = 4, and 3 − 5 = 254. This is not a bug in the language; it is the rule, and you can rely on it.

**Signed overflow is undefined behaviour.** \`int32_t x = INT32_MAX; x + 1\` has no defined result; the compiler may assume it never happens and optimise accordingly, which produces loops that never end or checks that vanish. Never rely on signed wrap.

**Integer promotion** is the quiet one. In any arithmetic expression, operands narrower than \`int\` are first converted to \`int\` (32 bits on Cortex-M). So:

\`\`\`c
uint8_t a = 200, b = 100;
uint8_t c = a + b;        /* a + b is computed as int 300; storing truncates to 44 */
if (a + b > 255) { ... }  /* TRUE: the comparison sees 300, not 44 */
\`\`\`

The expression and the variable do not agree. Whether that is what you wanted depends on the line, which is why reviewers ask "what width is this computed in?" about every narrow-type expression.`,
      deeper: {
        title: "Signed versus unsigned in one expression",
        body: `When a signed and an unsigned operand of the same width meet, the signed one is converted to unsigned. \`-1 < 1u\` is **false**, because −1 becomes 4 294 967 295. A loop such as \`for (int i = 0; i < sizeof(buf) - 1; i++)\` with an empty buffer compares against \`SIZE_MAX\` and runs forever.

Compilers warn about this with \`-Wsign-compare\` (part of \`-Wall -Wextra\`). Treat those warnings as errors in embedded code.`,
      },
    },
    {
      type: "concept",
      title: "Shifts with sharp edges",
      body: `Shifts are how masks are built, so their rules matter:

- **Shifting by the width or more is undefined.** \`x << 32\` for a 32-bit \`x\` has no defined result, and on Cortex-M the hardware shifts by the count modulo 32 while the compiler may do something else entirely. Guard variable shift counts.
- **Shifting a 1 into or past the sign bit of a signed type is undefined.** \`1 << 31\` is undefined because \`1\` is an \`int\`. Write \`1u << 31\` or \`UINT32_C(1) << 31\`.
- **Right-shifting a negative value is implementation-defined.** GCC for Arm does an arithmetic shift (sign bits fill in), but your code should not need to know that. Shift unsigned values.
- **Promotion applies to shifts too.** \`uint8_t x = 0x80; x << 1\` is \`int\` 256; storing it in a \`uint8_t\` gives 0, and \`(x << 1) & 0x100\` is non-zero even though "a uint8_t cannot hold bit 8".

The safe habit: do bit manipulation in \`uint32_t\` with unsigned literals, and narrow at the end with an explicit cast.`,
    },
    {
      type: "example",
      title: "Worked example: elapsed time that survives the wrap",
      body: `The fix for the opening bug is to compare *differences*, not absolute values:

\`\`\`c
uint32_t now = HAL_GetTick();
if ((uint32_t)(now - last_sample) >= 100u) {
    log_sample();
    last_sample = now;
}
\`\`\`

Why this works: unsigned subtraction wraps. If \`last_sample\` is 4 294 967 200 and \`now\` has wrapped to 50, then \`now − last_sample\` = 50 − 4 294 967 200 mod 2³² = **146**. The elapsed time is correct straight through the wrap, with no special case. The same pattern works for 16-bit timer counters: \`(uint16_t)(now - start)\`.

Two rules fall out of it:

1. Store a *timestamp* and compare the *difference* to the interval. Never store a future deadline and compare with \`>\`.
2. Intervals must be shorter than half the counter range if you ever need to tell "late" from "early" using a signed difference: \`(int32_t)(now - deadline) >= 0\`.`,
    },
    {
      type: "exercise",
      exercise: {
        kind: "single",
        id: "uint8-wrap",
        skill: "integers",
        objective: "Predict unsigned wrap-around and promotion.",
        prompt: `On a Cortex-M, what does this print?

\`\`\`c
uint8_t a = 250, b = 10;
uint8_t c = a + b;
printf("%u %u\\n", (unsigned)c, (unsigned)(a + b));
\`\`\``,
        options: [
          { id: "a", text: "4 260", correct: true, feedback: `Correct. \`a + b\` is computed as \`int\` 260 (promotion). Storing into \`c\` wraps modulo 256 → 4. Printing the expression directly shows the promoted 260.` },
          { id: "b", text: "4 4", correct: false, feedback: `The second value is the expression \`a + b\`, which is an \`int\` (260) because both operands were promoted. Only the store into the \`uint8_t\` wraps.` },
          { id: "c", text: "260 260", correct: false, feedback: `\`c\` is a \`uint8_t\`; it cannot hold 260. The store wraps to 260 − 256 = 4.` },
          { id: "d", text: "Undefined behaviour", correct: false, feedback: `Unsigned wrap-around is fully defined by the C standard. Undefined behaviour is for *signed* overflow and out-of-range shifts.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "multi",
        id: "shift-ub",
        skill: "integers",
        objective: "Identify undefined and implementation-defined operations.",
        prompt: `\`uint32_t u = 1; int32_t s = -8; unsigned n = 32;\` Select **every** expression whose result is undefined (not merely implementation-defined) in C.`,
        options: [
          { id: "a", text: "`1 << 31`", correct: true, feedback: `Undefined: \`1\` is a signed \`int\`, and shifting a 1 into the sign bit is undefined. Write \`1u << 31\`.` },
          { id: "b", text: "`u << n` (n = 32)", correct: true, feedback: `Undefined: shifting a 32-bit value by 32 or more. The hardware may give 0 or \`u\`; the compiler may give anything.` },
          { id: "c", text: "`s >> 1`", correct: false, feedback: `Implementation-defined, not undefined: the standard lets the compiler choose arithmetic or logical shift for negative values. GCC for Arm does arithmetic (−4). Avoid relying on it, but it is not UB.` },
          { id: "d", text: "`u << 31`", correct: false, feedback: `Defined: \`u\` is unsigned, and the result is 0x80000000.` },
          { id: "e", text: "`INT32_MAX + 1`", correct: true, feedback: `Undefined: signed overflow. The compiler may assume it never happens.` },
        ],
        solvedFeedback: `Right. The undefined ones are the signed shift into the sign bit, the shift by the full width, and signed overflow. The negative right shift is implementation-defined, which is still a reason to shift unsigned values only.`,
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "single",
        id: "elapsed-time-wrap",
        skill: "integers",
        objective: "Write a wrap-safe elapsed-time test.",
        prompt: `A 16-bit free-running timer \`TIM->CNT\` wraps every 65 536 ticks. Which test correctly detects that at least 1 000 ticks have passed since \`start\`, including across a wrap?`,
        options: [
          { id: "a", text: "`if (TIM->CNT > start + 1000)`", correct: false, feedback: `Fails at the wrap: when \`start\` is 65 000, \`start + 1000\` becomes 464 (in \`uint16_t\`) or 66 000 (if promoted), and the comparison is wrong either way for part of the cycle.` },
          { id: "b", text: "`if ((uint16_t)(TIM->CNT - start) >= 1000u)`", correct: true, feedback: `Correct. The unsigned difference wraps modulo 65 536, so it equals the true elapsed ticks as long as fewer than 65 536 have passed. No special case needed.` },
          { id: "c", text: "`if (TIM->CNT - start >= 1000)`", correct: false, feedback: `Close, but without the cast the subtraction is done in \`int\` after promotion: 50 − 65 000 = −64 950, which is not ≥ 1000. The cast back to \`uint16_t\` is what makes the wrap work.` },
          { id: "d", text: "`if (abs(TIM->CNT - start) >= 1000)`", correct: false, feedback: `The absolute value hides direction and still fails at the wrap: 50 − 65 000 gives 64 950, which looks like a huge elapsed time instead of 586 ticks.` },
        ],
      },
    },
    {
      type: "interview",
      questionId: "overflow-elapsed-time",
      intro: `A favourite snippet question. Your answer should mention the width of the counter, unsigned wrap, the difference-not-deadline pattern and the half-range limit.`,
    },
    {
      type: "recap",
      summary: `- Use fixed-width types; unsigned arithmetic wraps modulo 2ᴺ by definition; signed overflow is undefined.
- Narrower-than-int operands are promoted to int in expressions; the expression and the stored variable can disagree.
- Undefined: shifting into the sign bit of a signed type, shifting by the width or more, signed overflow. Shift unsigned values with unsigned literals.
- Signed meets unsigned → signed converts to unsigned; −1 < 1u is false.
- Elapsed time: store a timestamp and compare the unsigned difference; never compare against a stored deadline with >.`,
      cards: [
        { id: "int-1", front: "uint8_t a = 250, b = 10; uint8_t c = a + b; value of c, and of the expression a + b?", back: "c = 4 (wraps mod 256). The expression a + b is an int 260 because both operands are promoted to int first." },
        { id: "int-2", front: "Which integer operations are undefined behaviour?", back: "Signed overflow; shifting a 1 into or past a signed type's sign bit (1 << 31); shifting by the type's width or more. Right-shifting negatives is implementation-defined." },
        { id: "int-3", front: "Wrap-safe elapsed-time check with a 32-bit tick counter?", back: "if ((uint32_t)(now - last) >= interval) { ... last = now; }. Compare the unsigned difference, never a stored future deadline with >." },
        { id: "int-4", front: "Why is -1 < 1u false?", back: "With signed and unsigned operands of the same width, the signed one converts to unsigned: −1 becomes 4 294 967 295. Enable -Wsign-compare and treat it as an error." },
      ],
    },
  ],
};
