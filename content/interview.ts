import type { InterviewQuestion } from "@/lib/content/schema";

/**
 * Interview practice bank. Each question probes reasoning, not slogans.
 * Rubrics list what a strong answer covers and what weak answers tend to do.
 */
export const interviewQuestions: InterviewQuestion[] = [
  {
    id: "mcu-no-boot-walkthrough",
    moduleId: "mcu",
    topic: "Board bring-up",
    question: `A new board arrives, the power LED is on, nothing else happens and the debugger cannot connect. Walk me through what you do in the first fifteen minutes.`,
    probes: [
      "What does 'no target connected' rule out?",
      "Why do you measure at the MCU pins rather than at the regulator?",
      "When would you first touch the firmware?",
    ],
    rubric: {
      strong: [
        "Starts with power at the chip pins (VDD, VDDA, VCAP) and current draw, then reset (NRST level, then waveform), then boot configuration, then the debugger.",
        "States that SWD needs power and a released reset but not the crystal or valid firmware.",
        "Explains that each step is chosen because it is cheap and eliminates a large group of causes.",
        "Mentions reading reset-cause flags or halting the core once the debugger attaches.",
      ],
      weak: [
        "Jumps to reflashing or rebuilding the firmware.",
        "Blames the crystal for a debugger connection failure.",
        "Lists every possible fault with no order or reasoning.",
      ],
    },
    sampleAnswer: `I'd measure before I change anything. First power, at the MCU pins, not at the regulator: VDD, VDDA, and on an F4 the VCAP pins, because if the core regulator isn't at about 1.2 V the chip isn't alive. I'd glance at supply current for a short or a dead board. Then NRST with a meter: with power present, "no target" is very often a held reset. If NRST reads near zero I'd scope it to see if it's continuous or pulsing, and go after whatever drives it: supervisor, debugger, a shorted cap. If reset is released I'd check BOOT0 and then connect the debugger and halt the core to read the program counter. I'd only look at the firmware once the core is proven to run, because the debugger attaches from the internal oscillator without any valid flash contents, so a connection failure can't be a firmware problem.`,
    relatedLesson: "mcu-board-does-not-boot",
    industries: [
      { sector: "avionics", note: "Bring-up of a line-replaceable unit follows the same order, with the added step of recording every measurement in the test log for certification evidence." },
      { sector: "automotive", note: "ECU boards add a system-basis chip that supplies, supervises and resets the MCU; its state register is read before NRST, because it is usually the thing holding reset." },
      { sector: "medical", note: "Power and reset checks are formal test steps in device verification; the same measurements become documented acceptance criteria." },
    ],
  },
  {
    id: "i2c-nack-systematic",
    moduleId: "interfaces",
    topic: "I2C diagnosis",
    question: `An I2C sensor returns NACK on every transaction. How do you find out why, and in what order?`,
    probes: [
      "What does the address byte look like on the wire for 7-bit address 0x48?",
      "How does a missing pull-up show up differently from a wrong address?",
      "What would a bus scan tell you that a scope capture does not?",
    ],
    rubric: {
      strong: [
        "Defines a NACK precisely: no powered, functioning device recognised that address.",
        "Checks idle levels and sensor supply/ground first to clear the physical layer.",
        "Captures one transaction to confirm the master drives correctly and to read the actual address byte, then runs a bus scan.",
        "Knows the 7-bit shift convention and that STM32 HAL expects the shifted form.",
      ],
      weak: [
        "Starts by swapping the sensor or changing pull-up values.",
        "Cannot distinguish idle-level faults from transaction faults.",
        "Says 'the HAL is weird' without being able to state the convention.",
      ],
    },
    sampleAnswer: `A NACK after the address byte means nothing on the bus recognised that address, so I split the causes into physical, addressing and timing. Physical first because it's fastest: both lines should idle at VDD, and the sensor needs its supply and ground at its own pins. Then one logic-analyser capture of the failing transaction: it shows whether the master is actually driving the bus, what first byte goes out, and whether the edges are clean. For a TMP102 at 0x48 I expect 0x90 for a write. If the wire shows the right byte and still gets a NACK, I run a bus scan to see who does answer. A device at 0x49 means the address pin is strapped differently from what the firmware assumes, and the datasheet table settles it. I'd only consider bus speed or pull-up values if the capture showed slow edges.`,
    relatedLesson: "i2c-sensor-not-acknowledging",
    industries: [
      { sector: "automotive", note: "Sensor clusters on long harnesses push I2C capacitance over its limit; the same symptoms appear and the answer is often a different bus (LIN, CAN) rather than stronger pull-ups." },
      { sector: "industrial", note: "I2C across cables in a cabinet is a classic failure; the idle-level and capture checks are the first things a field engineer does." },
    ],
  },
  {
    id: "volatile-rmw-explained",
    moduleId: "embedded-c",
    topic: "Embedded C",
    question: `What does \`volatile\` do, and why is \`GPIOA->ODR |= (1u << 5)\` still not safe if an interrupt also writes ODR?`,
    probes: [
      "What does the compiler generate for that compound assignment?",
      "Name a register-level alternative on STM32.",
      "Does volatile help with a variable shared between main and an ISR?",
    ],
    rubric: {
      strong: [
        "Volatile forces every access to be performed as written: no caching, no elimination, no reordering of volatile accesses relative to each other.",
        "Explains the load-modify-store sequence and the lost-update window.",
        "Offers BSRR-style set/reset registers, critical sections, or LDREX/STREX as fixes.",
        "Distinguishes atomicity from visibility.",
      ],
      weak: [
        "Claims volatile makes operations atomic or thread-safe.",
        "Says volatile 'disables optimisation' with no further precision.",
      ],
    },
    sampleAnswer: `Volatile tells the compiler the value can change outside its view, so it must perform every read and write exactly as the source says: it can't keep the value in a register, drop a write, or hoist a read out of a loop. That's visibility, not atomicity. The OR-assignment still compiles to load, OR, store. If an interrupt changes ODR between the load and the store, the store writes back the old value and the interrupt's change is lost. On STM32 I'd use BSRR, which sets or resets pins with a single write and no read, so there's nothing to interrupt. Where no such register exists, I'd wrap the sequence in a critical section or use LDREX/STREX.`,
    relatedLesson: "embedded-c-register-bit-masks",
    industries: [
      { sector: "avionics", note: "Coding standards for certified software forbid relying on undefined or implementation-defined behaviour; interrupt-safe register access is reviewed explicitly." },
      { sector: "automotive", note: "MISRA C rules on volatile access and atomicity make this question a routine part of automotive firmware interviews." },
    ],
  },
  {
    id: "reset-loop-cause",
    moduleId: "mcu",
    topic: "Board bring-up",
    question: `A board resets itself about once a second. How would you tell whether it is the watchdog, a brown-out, or a firmware fault?`,
    probes: ["Which register tells you the reset cause on STM32?", "What would you look at on the scope?"],
    rubric: {
      strong: [
        "Reads the reset-cause flags (RCC_CSR on STM32) early in startup and logs them, or inspects them with the debugger.",
        "Scopes VDD and NRST together to catch supply dips that trigger BOR.",
        "Halts in the fault handler or checks for a hard fault leading to a software reset.",
      ],
      weak: ["Disables the watchdog to make the symptom go away.", "Has no way to distinguish the causes."],
    },
    sampleAnswer: `The chip records why it last reset. On STM32 that's the RCC_CSR flags: independent watchdog, window watchdog, brown-out, pin reset, software reset. I'd log them on startup or read them with the debugger. If it's the watchdog, something in the main loop isn't refreshing it in time, so I'd look for a blocking call. If it's brown-out, I'd scope VDD at the pin during the event, because a supply that dips under load will reset a perfectly good firmware. If it's a software reset, I'd check whether the hard-fault handler ends in a reset and halt there to read the stacked program counter.`,
    relatedLesson: "mcu-board-does-not-boot",
  },
  {
    id: "i2c-pullup-sizing",
    moduleId: "interfaces",
    topic: "I2C design",
    question: `How do you choose an I2C pull-up value, and what goes wrong at each extreme?`,
    probes: ["What limits the maximum value?", "What limits the minimum?", "What happens when three modules each bring their own pull-ups?"],
    rubric: {
      strong: [
        "Rise time against the spec limit (1000 ns standard mode, 300 ns fast mode) sets the maximum resistance given bus capacitance.",
        "Device sink capability (3 mA guaranteed) sets the minimum resistance.",
        "Parallel pull-ups from multiple modules reduce the total and can exceed the sink limit.",
      ],
      weak: ["Quotes 4.7 kΩ as a universal answer without the reasoning.", "Cannot name either limit."],
    },
    sampleAnswer: `Two limits. Too large and the RC rise time exceeds the specification, 1 µs in standard mode or 300 ns in fast mode, and the receiver may sample a bit before it has risen; that shows as slow curved edges on a scope. Too small and a device pulling low has to sink more than the 3 mA the specification guarantees, and VOL creeps up. So I'd estimate the bus capacitance, pick a value that meets rise time with margin, and check the sink current at VDD divided by the parallel total of every pull-up on the bus, because modules often bring their own.`,
    relatedLesson: "i2c-sensor-not-acknowledging",
  },
  {
    id: "bit-field-write",
    moduleId: "embedded-c",
    topic: "Embedded C",
    question: `Write, in C, how you set a 2-bit field at bit position 10 of a 32-bit register to the value 2 without affecting the other bits. Explain each part.`,
    probes: ["Why mask the shifted value?", "Why unsigned literals?", "When would you not do it this way?"],
    rubric: {
      strong: [
        "Clears the field with AND-NOT of the mask, then ORs in the shifted and masked value.",
        "Uses unsigned literals and explains undefined behaviour of shifting into the sign bit.",
        "Notes the read-modify-write is not atomic and where that matters.",
      ],
      weak: ["Writes the whole register with a constant.", "Uses |= alone and cannot explain why the field may end up wrong."],
    },
    sampleAnswer: `reg = (reg & ~(0x3u << 10)) | ((2u << 10) & (0x3u << 10)). The AND-NOT clears just the two bits of the field; the OR inserts the new value; masking the shifted value stops an out-of-range variable spilling into the neighbouring field. The u suffix keeps the shifts in unsigned arithmetic, because shifting a signed int into bit 31 is undefined. It's a read-modify-write, so it belongs in initialisation or inside a critical section if an interrupt could modify the same register.`,
    relatedLesson: "embedded-c-register-bit-masks",
  },
  {
    id: "debugging-story",
    moduleId: "interviews",
    topic: "Engineering communication",
    question: `Tell me about a bug that took you a long time to find. What would you do differently now?`,
    probes: ["What evidence changed your mind?", "What did you try that turned out to be a dead end, and why?"],
    rubric: {
      strong: [
        "Structures the story as symptom, hypotheses, discriminating measurement, evidence, fix, prevention.",
        "Is honest about dead ends and what they taught.",
        "Names the specific measurement that resolved it and why it was decisive.",
        "Keeps to what they personally did, without inflating their role.",
      ],
      weak: ["Tells a story with no measurements in it.", "Claims to have been right from the start.", "Describes team work as personal work."],
    },
    sampleAnswer: `Pick a real example from your own work and tell it in this shape: what the symptom was, what you first believed and why, which measurement proved you wrong, what you measured next, what the evidence finally showed, and what you changed so it would not happen again. Keep to your own actions. Interviewers are listening for how you reason under uncertainty, not for a heroic ending.`,
  },
  {
    id: "swd-vs-crystal",
    moduleId: "mcu",
    topic: "Board bring-up",
    question: `Does an STM32 need its external crystal to be running for the debugger to connect? Why or why not?`,
    probes: ["What clock does the chip start from?", "What would a dead crystal actually look like in firmware?"],
    rubric: {
      strong: [
        "No: the chip starts from the internal HSI and the debug port works from it.",
        "A dead HSE shows up as firmware hanging while waiting for HSERDY, with the debugger still attaching.",
      ],
      weak: ["Yes, with no further reasoning.", "Confuses 'no clock' with 'no crystal'."],
    },
    sampleAnswer: `No. The part comes out of reset on the internal RC oscillator, and the debug access port runs from the core clock, so SWD attaches without any external crystal and without valid firmware. A dead crystal only matters once firmware enables HSE and waits for the ready flag, and then the symptom is a halted core spinning in that loop, which the debugger shows you directly.`,
    relatedLesson: "mcu-board-does-not-boot",
  },
  {
    id: "i2c-stuck-bus",
    moduleId: "interfaces",
    topic: "I2C diagnosis",
    question: `After a reset mid-transaction, SDA is stuck low and the master cannot generate a START. What happened and how do you recover?`,
    probes: ["Why nine clocks?", "How would you prevent it in firmware?"],
    rubric: {
      strong: [
        "A slave was interrupted mid-byte and is still driving SDA low waiting for clocks.",
        "Recovery: drive SCL as GPIO for up to nine pulses with SDA released, then issue a STOP, then re-initialise the peripheral.",
        "Mentions doing this check at startup as a bus-recovery routine.",
      ],
      weak: ["Suggests a power cycle as the only fix.", "Cannot explain why SDA is low."],
    },
    sampleAnswer: `A slave was in the middle of sending a byte when the master reset, so it is still holding SDA low for a bit it never got to finish. The master cannot start because START needs SDA to fall while high. Recovery is to take SCL over as a GPIO and clock it up to nine times with SDA released; the slave finishes its byte, sees a NACK and lets go. Then generate a STOP manually and re-initialise the I2C peripheral. I'd put that in the startup path, because resets during transfers happen in the field.`,
    relatedLesson: "i2c-sensor-not-acknowledging",
  },
  {
    id: "honest-experience",
    moduleId: "interviews",
    topic: "Engineering communication",
    question: `You have studied embedded C and done exercises but your professional work has been mostly testing and integration. How do you present that honestly to an interviewer?`,
    probes: ["What can you claim as professional experience?", "How do you describe study projects?"],
    rubric: {
      strong: [
        "Separates professional responsibilities, coursework and portfolio projects clearly, and labels each.",
        "Describes testing and integration work in engineering terms: evidence, root cause, interfaces, reviews.",
        "Shows that study is recent and deliberate, with concrete examples, without claiming years of firmware experience.",
      ],
      weak: ["Blurs study into experience.", "Undersells real integration and test work as 'just testing'."],
    },
    sampleAnswer: `Say what you did professionally and own it: testing and integration is engineering, with measurements, failure analysis and interfaces. Then say what you have been building deliberately on top: embedded C, register-level work, protocol debugging, with specific exercises or a portfolio project you can talk through in detail. Interviewers trust a clearly labelled gap far more than a vague claim, and the ability to explain a bug you found says more than a line on a CV.`,
  },
  {
    id: "watchdog-strategy",
    moduleId: "mcu",
    topic: "Board bring-up",
    question: `How would you design the watchdog strategy for a product that must recover from firmware hangs in the field? Be specific about the clock, the timeout and where the refresh lives.`,
    probes: ["Why not refresh it from a timer interrupt?", "How do you choose the timeout given the LSI tolerance?", "What do you do with the reset-cause flags?"],
    rubric: {
      strong: [
        "Uses the independent watchdog on its own LSI clock so it survives a main-clock failure, and notes it cannot be stopped once started.",
        "Sizes the timeout from prescaler × (reload + 1) ÷ f_LSI with margin for the 17 to 47 kHz LSI range.",
        "Refreshes in exactly one place reached only by a complete healthy main-loop cycle, ideally gated on subsystem 'alive' flags; never from an interrupt.",
        "Reads, logs and clears RCC_CSR at startup so field resets are explainable.",
      ],
      weak: ["Suggests refreshing from a timer interrupt or scattering refreshes through drivers.", "Proposes lengthening the timeout whenever something trips it.", "Cannot name the clock source or the formula."],
    },
    sampleAnswer: `I'd use the independent watchdog because it runs from the LSI and keeps going even if the main clock or the PLL fails, and once it's started nothing but a reset stops it. The timeout comes from prescaler times reload plus one over the LSI frequency, and I'd size it with margin because the LSI is specified from 17 to 47 kHz; if the main loop should complete in 200 ms I might set about 1 s. The refresh goes in one place at the end of the main loop, and I'd only reach it if every subsystem has set its alive flag that cycle, so a stalled subsystem also causes a reset. Never from a timer interrupt, because that keeps refreshing while the application is dead. On boot I'd read RCC_CSR, log the reset cause and clear it, so when a field unit reboots we know whether it was the watchdog, brown-out or something else.`,
    relatedLesson: "watchdogs-and-reset-loops",
    industries: [
      { sector: "avionics", note: "Watchdog behaviour and reset recovery are part of the safety argument; the reset-cause log is evidence for incident analysis under DO-178C processes." },
      { sector: "automotive", note: "ECUs commonly pair the MCU watchdog with an external watchdog in the system-basis chip, with windowed timing, to meet ISO 26262 fault-tolerant time intervals." },
      { sector: "medical", note: "IEC 62304 expects documented behaviour on software failure; a watchdog that restarts into a safe state, with the cause logged, is a typical control." },
      { sector: "industrial", note: "PLC-style controllers must fail to a safe output state; the watchdog reset path must leave outputs de-energised rather than frozen." },
    ],
  },
  {
    id: "uart-garbage-diagnosis",
    moduleId: "interfaces",
    topic: "UART diagnosis",
    question: `A new board prints garbage on its debug console. How do you find the cause, and in what order?`,
    probes: ["What does one bit measured on the scope tell you?", "How would a missing ground look different from a baud mismatch?", "What else would be wrong if the clock configuration were wrong?"],
    rubric: {
      strong: [
        "Checks terminal settings first, then scopes the TX pin to confirm levels and measure one bit time.",
        "Converts bit time into actual baud and compares with the configured rate; a clean ratio points at the clock configuration.",
        "Distinguishes symptoms: silence (path or pins), rhythmic garbage (rate), intermittent garbage (ground), RS-232 versus logic levels.",
        "Verifies the fix on a second timed behaviour such as an LED period or MCO.",
      ],
      weak: ["Starts by trying random baud rates until something is readable.", "Cannot explain why a wrong crystal value scales every timed behaviour.", "Swaps hardware before measuring."],
    },
    sampleAnswer: `I'd check the terminal's port and 115200 8N1 first because it's the commonest mistake and takes a minute. Then I'd put a scope on the board's TX pin. If it's silent the problem is the path, maybe TX and RX swapped or the pins not in alternate-function mode. If it toggles I'd measure the shortest pulse, which is one bit time, and compute the real baud. If it's 8.7 microseconds the board is at 115200 and the terminal is wrong. If it's off by a clean ratio, say 3.125, the board's clock configuration assumes the wrong crystal, and I'd expect the heartbeat LED to be fast by the same ratio. Intermittent garbage that changes when I touch the cable is a ground problem. I'd fix the clock constant, not the terminal, and re-verify the bit time and the LED.`,
    relatedLesson: "uart-framing-and-baud",
    industries: [
      { sector: "automotive", note: "The same reasoning applies to LIN and to UART-based diagnostic links; a 2 to 3 % baud tolerance is also the LIN requirement for nodes without a crystal." },
      { sector: "medical", note: "Instrument-to-PC serial links often cross an isolation barrier; a missing isolated ground reference produces exactly the intermittent symptoms described." },
      { sector: "industrial", note: "RS-485 Modbus links add termination and biasing to the list, but the first step, measuring one bit on the wire, is identical." },
    ],
  },
  {
    id: "spi-first-byte-shifted",
    moduleId: "interfaces",
    topic: "SPI diagnosis",
    question: `You read a sensor's ID register over SPI and get 0x7E instead of the documented 0x3F, every time. What do you check?`,
    probes: ["What would you see on the scope?", "How do CPOL and CPHA map to the datasheet's wording?", "What would 0xFF have told you instead?"],
    rubric: {
      strong: [
        "Notices 0x7E is 0x3F shifted by one bit and names clock polarity/phase mismatch as the prime suspect.",
        "Explains the datasheet translation: idle level to CPOL, sampling edge to CPHA.",
        "Describes the scope check: where MISO changes relative to SCK edges and where the master samples.",
        "Contrasts with 0xFF (no MISO path or no chip select) and with speed-dependent corruption.",
      ],
      weak: ["Suggests the sensor is faulty.", "Does not recognise the one-bit shift.", "Cannot define CPOL or CPHA."],
    },
    sampleAnswer: `0x7E is 0x3F shifted left by one, so the data is real but sampled one position off: a clock phase or polarity mismatch. I'd read the datasheet's timing statement, idle level gives CPOL and the latching edge gives CPHA, and compare with SPI_CR1. On the scope I'd expect MISO to change on the edge the master is sampling on, which is exactly how you capture a bit late. If I'd read 0xFF instead I'd suspect MISO not connected or chip select never asserted, and if the value changed with clock speed I'd look at the maximum SCK frequency. After setting the right mode I'd read the ID again and expect 0x3F.`,
    relatedLesson: "spi-modes-and-chip-select",
    industries: [
      { sector: "avionics", note: "Inertial sensors on flight controllers are nearly all SPI; a one-bit shift in an accelerometer frame corrupts every sample silently, which is why ID checks at boot are mandatory." },
      { sector: "consumer", note: "Displays and flash memories are the usual SPI devices; the first-byte-garbage symptom with CS framing errors is the same investigation." },
    ],
  },
  {
    id: "overflow-elapsed-time",
    moduleId: "embedded-c",
    topic: "Embedded C",
    question: `This code logs every 100 ms: \`if (HAL_GetTick() > next) { log(); next = HAL_GetTick() + 100; }\`. It stops working after about 49 days. Why, and how do you fix it?`,
    probes: ["What is special about 49.7 days?", "Why does subtracting unsigned values fix it?", "What is the limit on interval length for this pattern?"],
    rubric: {
      strong: [
        "Identifies the 32-bit millisecond counter wrapping at 2^32 ms ≈ 49.7 days.",
        "Explains that after the wrap the stored deadline is huge and the comparison stays false.",
        "Gives the fix: store a timestamp and compare the unsigned difference, (uint32_t)(now - last) >= 100, which wraps correctly.",
        "Mentions the half-range limit if a signed difference is used to detect lateness.",
      ],
      weak: ["Proposes a 64-bit counter as the only answer.", "Cannot explain why unsigned subtraction wraps correctly.", "Suggests resetting the tick counter."],
    },
    sampleAnswer: `HAL_GetTick is a 32-bit millisecond counter and 2 to the 32 milliseconds is about 49.7 days. When it wraps to zero, next is still close to the maximum, so now greater than next is false until the counter climbs back up, another 49 days. The fix is to store the last timestamp and compare the elapsed time as an unsigned difference: if now minus last, cast to uint32_t, is at least 100, log and set last to now. Unsigned subtraction wraps modulo 2 to the 32, so the difference is correct across the wrap. The only constraint is that intervals must be well under the counter range, and if you ever need to know whether you are early or late you compare a signed difference, which limits you to half the range.`,
    relatedLesson: "fixed-width-integers-overflow-shifts",
    industries: [
      { sector: "avionics", note: "Long-uptime systems hit every counter wrap; the Boeing 787 power-down advisory after 248 days of uptime was a widely reported counter-overflow case." },
      { sector: "industrial", note: "PLCs and gateways run for years; wrap-safe timing is a standard code-review item in those teams." },
    ],
  },
  {
    id: "probe-loading",
    moduleId: "instrumentation",
    topic: "Instrumentation",
    question: `Why might attaching an oscilloscope probe change a circuit's behaviour, and what do you do about it?`,
    probes: ["What does a 10× probe present to the node?", "Why does the ground lead matter?", "When would you reach for a differential or active probe?"],
    rubric: {
      strong: [
        "Names probe capacitance (about 10 to 15 pF for 10×, around 100 pF for 1×) and gives an example such as a crystal pin or a high-impedance node.",
        "Explains ground-lead inductance resonating with tip capacitance and the spring ground fix.",
        "Mentions compensation and the calibration square wave.",
        "Knows the ground clip is mains earth and when a differential or active probe is required.",
      ],
      weak: ["Says probes are high impedance so they never load anything.", "Cannot explain ringing on edges.", "Has never compensated a probe."],
    },
    sampleAnswer: `The probe is a circuit element: a 10× passive probe adds about 10 to 15 picofarads and a 1× probe around 100, so on a crystal pin it can shift the frequency or stop a marginal oscillator, and on a 10 kΩ node it forms a low-pass filter. The long alligator ground lead is an inductor that resonates with that capacitance near 100 MHz, so fast edges ring on the screen but not in the circuit; I'd use the spring ground tip. I'd also compensate the probe on the calibration square wave so edges aren't distorted. And the ground clip is mains earth, so for anything not at ground potential I'd use a differential probe. For fast or sensitive nodes an active probe with a picofarad or two is the right tool.`,
    relatedLesson: "oscilloscope-probing",
    industries: [
      { sector: "medical", note: "Patient-connected circuits are isolated; a grounded scope probe breaks the isolation, so differential or isolated probes are mandatory on those nodes." },
      { sector: "industrial", note: "Motor drives and mains-referenced power stages are where a mis-clipped ground lead destroys equipment; high-voltage differential probes are standard." },
    ],
  },
];
