import type { Lesson } from "@/lib/content/schema";

export const raiiForPeripherals: Lesson = {
  slug: "raii-for-peripherals",
  moduleId: "embedded-cpp",
  prerequisites: ["pointers-to-hardware", "interrupts-and-nvic-priorities"],
  title: "RAII for peripherals and critical sections",
  summary: "C++ on a microcontroller is not about classes everywhere; it is about one idea, RAII, that makes a chip-select pin, an interrupt mask or a mutex impossible to leave in the wrong state. Learn the guard pattern, the subset of C++ that embedded teams actually use, and what to switch off.",
  durationMinutes: 10,
  whyItMatters: "Many firmware teams have moved to C++ for exactly the safety RAII brings, and 'what C++ features do you use on a microcontroller, and which do you avoid?' is a common interview question. A guard that releases a critical section on every exit path is a concrete answer.",
  objectives: [
    "Write a RAII guard for a critical section, a chip-select line and a mutex, and explain why it is safer than paired calls.",
    "List the C++ subset commonly used in firmware (constexpr, templates for register access, std::array, enum class, references) and the features commonly disabled (exceptions, RTTI, dynamic allocation).",
    "Relate static constructors and global objects to the startup sequence.",
  ],
  review: {
    status: "technically-reviewed",
    note: "Reflects common embedded C++ practice (e.g. as described in the C++ Core Guidelines' embedded-relevant sections and in vendor C++ support for Cortex-M). Compiler flags named are GCC/Clang.",
  },
  references: [
    { title: "C++ Core Guidelines: RAII (R.1) and resource management", note: "The general principle." },
    { title: "GCC flags -fno-exceptions -fno-rtti -fno-threadsafe-statics", note: "The usual embedded configuration and why." },
    { title: "Lesson: From reset vector to main()", note: "Where static constructors run." },
  ],
  steps: [
    {
      type: "scenario",
      title: "The early return that left interrupts off",
      body: `A C function disables interrupts, reads two shared variables, and re-enables interrupts. A later edit adds an early \`return\` for an error case between the disable and the enable. From then on, one error path leaves the system with interrupts masked for ever: the UART stops, the watchdog resets the board, and the log shows nothing because the logger was waiting on an interrupt.

In C++ the mask is released by a destructor that runs on every exit path, including the one the edit added. That is the whole of RAII, and it is worth the language.`,
    },
    {
      type: "concept",
      title: "RAII: acquire in the constructor, release in the destructor",
      body: `**Resource acquisition is initialisation**: an object acquires a resource when constructed and releases it when destroyed, and C++ guarantees the destructor runs when the object goes out of scope, on every path: normal exit, early return, break, or exception if enabled.

\`\`\`cpp
class CriticalSection {
public:
    CriticalSection() : saved_(__get_PRIMASK()) { __disable_irq(); }
    ~CriticalSection() { __set_PRIMASK(saved_); }     // restores, never blindly enables
    CriticalSection(const CriticalSection&) = delete;
    CriticalSection& operator=(const CriticalSection&) = delete;
private:
    uint32_t saved_;
};

int read_pair(volatile int& a, volatile int& b) {
    CriticalSection cs;          // interrupts masked from here
    if (a < 0) return -1;        // destructor restores PRIMASK on this path too
    return a + b;
}                                // and here
\`\`\`

Saving and restoring PRIMASK rather than enabling unconditionally means the guard nests correctly: a critical section inside a critical section does not re-enable interrupts early.

The same shape covers every paired operation in firmware:

- **Chip select**: \`SpiTransaction\` asserts CS in the constructor and deasserts in the destructor; a function with five exit paths cannot leave a device selected.
- **Mutex**: \`LockGuard\` takes in the constructor, gives in the destructor; the priority-inversion lesson's lock is released on every path.
- **Peripheral clock or power**: enable on construction, disable on destruction, for a sensor that must be powered only while read.

Copying is deleted so a guard cannot be duplicated and released twice; a guard that must be moved (returned from a factory) implements move and leaves the source empty. These are small classes, a dozen lines each, and they remove an entire category of bug.`,
      deeper: {
        title: "Guards in C",
        body: `C has no destructors; the nearest equivalent is the \`goto cleanup\` pattern with a single exit label, which works but depends on every edit respecting it. GCC's \`__attribute__((cleanup))\` gives scope-exit functions in C, used by some Linux-kernel-style codebases. Neither is enforced by the language; RAII is.`,
      },
    },
    {
      type: "concept",
      title: "The embedded C++ subset",
      body: `What firmware teams typically use:

- **constexpr** for compile-time constants and tables (a CRC table computed at compile time, a baud-rate divisor checked at compile time).
- **enum class** for register fields and states: no implicit conversion to int, no accidental mixing of two enums.
- **Templates for register access**: a \`Register<0x40020014>\` type whose \`set(bit)\` compiles to the same single store as the C macro, with the address checked at compile time; or a \`Gpio<Port, Pin>\` class with zero run-time cost.
- **std::array** instead of C arrays (bounds known, no decay), **std::span** for buffers, references instead of pointers where null is not meaningful.
- **Static polymorphism** (templates, CRTP) where a C codebase would use function pointers; virtual functions where a run-time choice is genuinely needed, with the vtable cost understood.
- **RAII guards**, above.

What is usually switched off, with the compiler flags that do it: **exceptions** (\`-fno-exceptions\`: unwinding tables cost flash and the timing is unbounded; errors are returned as values or \`std::expected\`-style types), **RTTI** (\`-fno-rtti\`: \`dynamic_cast\` and \`typeid\` are rarely wanted and cost flash), **dynamic allocation** after start-up (no \`new\` in the steady state; fixed pools if needed; fragmentation and unbounded time are the reasons), and **thread-safe statics** (\`-fno-threadsafe-statics\` when the guard would need an RTOS primitive before the kernel runs).

**Static objects and startup**: a global object with a constructor is constructed by \`__libc_init_array\` before \`main\` (day 16). The order across translation units is unspecified, so a global that depends on another global at construction is a bug waiting for a link order change; use function-local statics or explicit init calls from \`main\` for anything that touches hardware, and keep constructors of globals trivial.`,
    },
    {
      type: "example",
      title: "Worked example: an SPI transaction guard",
      body: `\`\`\`cpp
class SpiTransaction {
public:
    explicit SpiTransaction(Spi& spi, Gpio& cs) : spi_(spi), cs_(cs) { cs_.low(); }
    ~SpiTransaction() { while (spi_.busy()) {} cs_.high(); }   // never leave CS asserted
    SpiTransaction(const SpiTransaction&) = delete;
    SpiTransaction& operator=(const SpiTransaction&) = delete;
    uint8_t transfer(uint8_t b) { return spi_.transfer(b); }
private:
    Spi& spi_;
    Gpio& cs_;
};

std::optional<uint16_t> read_sensor_id(Spi& spi, Gpio& cs) {
    SpiTransaction t(spi, cs);
    if (t.transfer(0x9F) != 0x00) return std::nullopt;   // CS released here
    uint16_t id = t.transfer(0) << 8;
    id |= t.transfer(0);
    return id;                                            // and here
}
\`\`\`

Compiled with \`-O2 -fno-exceptions -fno-rtti\`, this produces the same instructions as the hand-written C with explicit CS calls, minus the possibility of forgetting one. The destructor waits for the bus to be idle before releasing CS, which is the day-4 rule about framing a transaction; the rule is now enforced by the type rather than by review.`,
    },
    {
      type: "exercise",
      exercise: {
        kind: "single",
        id: "raii-benefit",
        skill: "cpp",
        objective: "State what RAII guarantees.",
        prompt: `What does a RAII critical-section guard guarantee that a pair of disable/enable calls does not?`,
        options: [
          { id: "a", text: "The mask is restored on every exit path from the scope, including early returns added later, because the destructor always runs.", correct: true, feedback: `Yes. The language runs the destructor; a paired call depends on every future edit remembering it.` },
          { id: "b", text: "Interrupts are disabled faster.", correct: false, feedback: `Same instructions; the gain is correctness, not speed.` },
          { id: "c", text: "The critical section can be longer without affecting latency.", correct: false, feedback: `Length still matters; RAII changes nothing about the latency budget.` },
          { id: "d", text: "Other tasks can enter the section while it is held.", correct: false, feedback: `A critical section excludes by definition; RAII only guarantees the release.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "multi",
        id: "embedded-cpp-subset",
        skill: "cpp",
        objective: "Know the subset and the switches.",
        prompt: `Select **every** statement that matches common embedded C++ practice.`,
        options: [
          { id: "a", text: "Exceptions and RTTI are usually disabled; errors are returned as values.", correct: true, feedback: `-fno-exceptions -fno-rtti: flash cost and unbounded timing.` },
          { id: "b", text: "Dynamic allocation is avoided after start-up; fixed pools if needed.", correct: true, feedback: `Fragmentation and unbounded allocation time.` },
          { id: "c", text: "Global objects with non-trivial constructors that touch hardware are good practice.", correct: false, feedback: `Construction order across translation units is unspecified and runs before main; keep global constructors trivial and initialise hardware explicitly.` },
          { id: "d", text: "constexpr, enum class, std::array and templates for register access cost nothing at run time when used well.", correct: true, feedback: `The compile-time subset is the value proposition.` },
          { id: "e", text: "Virtual functions must never be used in firmware.", correct: false, feedback: `They are used where a run-time choice is genuine, with the vtable and indirect-call cost understood; the rule is to know the cost, not to ban the feature.` },
        ],
        solvedFeedback: `Right. Off: exceptions, RTTI, heap in steady state, hardware in global constructors. On: the compile-time subset and RAII, with virtuals where justified.`,
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "order",
        id: "guard-design-order",
        skill: "cpp",
        objective: "Design a guard correctly.",
        prompt: `Order the steps of designing a RAII guard for a chip-select line.`,
        items: [
          { id: "acquire", text: "Assert CS in the constructor", why: "Acquisition is initialisation." },
          { id: "release", text: "Wait for the bus to be idle, then deassert CS in the destructor", why: "Release on every exit path, with the framing rule enforced." },
          { id: "copy", text: "Delete the copy constructor and assignment", why: "A guard must not be duplicated and released twice." },
          { id: "api", text: "Expose only the operations valid while selected (transfer)", why: "The type models the transaction." },
          { id: "test", text: "Test on the host with a fake SPI and GPIO that record the CS sequence", why: "Proves the release happens on early returns." },
        ],
        correctOrder: ["acquire", "release", "copy", "api", "test"],
        solvedFeedback: `Correct. Acquire, release, forbid copies, model the valid operations, and prove it with a host test.`,
      },
    },
    {
      type: "interview",
      questionId: "raii-critical-section",
      intro: `Show the critical-section guard with PRIMASK save and restore, explain why it beats paired calls, then list the subset you use and the three things you switch off and why.`,
    },
    {
      type: "recap",
      summary: `- RAII: acquire in the constructor, release in the destructor; the destructor runs on every exit path. Guards for critical sections (save and restore PRIMASK), chip select, mutexes, peripheral power.
- Delete copying; implement move only when a guard must be transferred.
- Embedded subset: constexpr, enum class, templates for register access, std::array/span, references, static polymorphism, virtuals where justified.
- Usually off: exceptions, RTTI, heap after start-up, thread-safe statics; global constructors kept trivial because order is unspecified and they run before main.`,
      cards: [
        { id: "raii-1", front: "What is RAII and why does it matter in firmware?", back: "Acquire a resource in a constructor, release it in the destructor, which runs on every exit path. It makes forgetting to release a critical section, a chip select or a mutex impossible." },
        { id: "raii-2", front: "Why save and restore PRIMASK in a critical-section guard?", back: "So nested guards work: the inner one restores the previous state instead of enabling interrupts while the outer section is still active." },
        { id: "raii-3", front: "Which C++ features are usually disabled on microcontrollers and why?", back: "Exceptions (flash and unbounded timing), RTTI (flash, rarely needed), dynamic allocation after start-up (fragmentation, unbounded time), thread-safe statics (need kernel primitives before the kernel runs)." },
        { id: "raii-4", front: "Why keep global constructors trivial?", back: "They run before main via __libc_init_array in unspecified order across translation units; a global that depends on another, or touches hardware before clocks are set, breaks on a link-order change." },
      ],
    },
  ],
};
