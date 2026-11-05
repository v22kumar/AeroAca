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
];
