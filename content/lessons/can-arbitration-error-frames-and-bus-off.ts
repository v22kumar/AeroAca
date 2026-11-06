import type { Lesson } from "@/lib/content/schema";

export const canArbitrationErrorFramesAndBusOff: Lesson = {
  slug: "can-arbitration-error-frames-and-bus-off",
  moduleId: "interfaces",
  prerequisites: ["uart-framing-and-baud", "logic-analysers-decoding-a-bus"],
  title: "CAN: arbitration, error frames and bus-off",
  summary: "CAN resolves collisions bit by bit, confines faulty nodes automatically, and tells you exactly why a node fell silent if you know where to look. Learn dominant and recessive, how arbitration picks a winner, the frame fields, bit stuffing, the error counters that lead to bus-off, and the three measurements that diagnose a dead bus.",
  durationMinutes: 10,
  whyItMatters: "CAN runs cars, aircraft subsystems, industrial machines and medical carts. 'Why did this node go bus-off?' is asked in automotive interviews the way 'why is this I2C device not acknowledging?' is asked in embedded ones, and the answers have the same shape: a measurement and a counter.",
  objectives: [
    "Explain dominant and recessive levels, bitwise arbitration and why a lower identifier wins.",
    "Name the frame fields and the roles of bit stuffing, the CRC and the acknowledge slot.",
    "Explain error counters, error-active, error-passive and bus-off, the recovery rule, and diagnose a silent node with three measurements.",
  ],
  review: {
    status: "technically-reviewed",
    note: "Per ISO 11898-1 (data link) and ISO 11898-2 (high-speed physical layer): error counter thresholds 128 and 256, recovery after 128 occurrences of 11 recessive bits, 120 Ω termination at both ends. Sample-point guidance follows CiA recommendations.",
  },
  references: [
    { title: "ISO 11898-1:2015 Road vehicles, CAN data link layer and physical signalling", note: "Frame format, arbitration, error signalling, fault confinement." },
    { title: "ISO 11898-2 High-speed physical layer", note: "Differential levels, termination." },
    { title: "Bosch CAN Specification 2.0 (1991)", note: "The original; error counters and bus-off rules unchanged in substance." },
    { title: "STM32 bxCAN chapter", id: "RM0090", note: "Error status register (ESR): TEC, REC, bus-off flag; bit-timing register." },
  ],
  steps: [
    {
      type: "scenario",
      title: "The node that fell silent after a cold start",
      body: `A dashboard node transmits a status frame every 100 ms. On cold mornings it stops after a few seconds and stays silent until power is cycled. The analyser shows its last frames with error flags after each, and then nothing. Its error status register, read over the debugger, says bus-off with a transmit error counter at 256.

A loose terminator on the far end of the harness turned the bus into a reflective line at low temperature; every frame the node sent was corrupted at the sample point; the node did what the standard tells it to do after 32 consecutive failures: it left. This lesson is why, and how to see it coming.`,
    },
    {
      type: "concept",
      title: "Levels, arbitration and the frame",
      body: `CAN is a differential bus with two states: **dominant** (a logical 0; CAN_H driven high, CAN_L low, about 2 V between them) and **recessive** (a logical 1; both lines float to about 2.5 V, 0 V between them). Any node driving dominant wins over all nodes driving recessive, which is a wired-AND.

**Arbitration** uses that property. Every node that wants to transmit starts the frame together and sends its **identifier** one bit at a time, most significant first, while reading the bus. A node that sends recessive but reads dominant has lost: it stops and becomes a receiver. The frame with the **lowest identifier** always wins, without destroying any data, which is why identifiers are assigned by priority and why a chatty high-priority message can starve a low one. Standard frames use an 11-bit identifier; extended frames add 18 bits (29 total) and always lose to a standard frame with the same base.

**Frame fields**, in order: start of frame (one dominant bit), identifier, RTR bit (remote request), control (IDE, DLC: data length 0 to 8 bytes in Classical CAN), data, **CRC** (15 bits plus delimiter), **ACK slot** (the transmitter sends recessive; every receiver that got a valid CRC drives dominant, so a lone node with nobody to acknowledge sees an ACK error), end of frame (7 recessive), intermission (3 recessive). **Bit stuffing**: after five identical bits the transmitter inserts one of the opposite polarity so receivers can keep their clocks synchronised; six identical bits in a row is a **stuff error** and the definition of an error flag.

**Bit timing**: each bit is divided into time quanta; the **sample point** (typically 75 to 87.5 % of the bit) and the synchronisation jump width are set per node, and all nodes on a bus must agree on bit rate and should agree on sample point. A node with a wrong bit rate corrupts every frame it touches, including other nodes'.`,
      deeper: {
        title: "Why the lowest ID wins, exactly",
        body: `Two nodes send IDs 0x100 (binary 001 0000 0000) and 0x0A0 (000 1010 0000). Bits 10 and 9 are both 0 (dominant) for both nodes; at bit 8 node A sends 1 (recessive) and node B sends 0 (dominant); A reads dominant while sending recessive and drops out. B continues; the bus carries B's frame without a single corrupted bit. This is non-destructive arbitration, and it costs nothing but the rule that identifiers are unique.`,
      },
    },
    {
      type: "visual",
      title: "Two identifiers on one bus",
      visual: "can-arbitration",
      body: `Enter two identifiers and step through the arbitration field bit by bit; the diagram shows the bus level and the moment the loser drops out.`,
      caption: `Illustrative, 11-bit identifiers, no stuffing shown.`,
    },
    {
      type: "concept",
      title: "Error frames, counters and bus-off",
      body: `Every node keeps a **transmit error counter (TEC)** and a **receive error counter (REC)**. A transmitter that detects an error (bit, stuff, CRC, form, ACK) adds 8 to TEC; a receiver adds 1 to REC; a successful frame subtracts 1. Any node that detects an error sends an **error frame** (six dominant bits, deliberately violating stuffing so everyone sees it, then a delimiter), which destroys the frame on the bus and causes a retransmission.

Three states follow from the counters:

- **Error active** (both counters below 128): normal; sends active (dominant) error flags.
- **Error passive** (either counter ≥ 128): the node still works but sends passive (recessive) error flags that cannot disturb others, and waits extra bits before transmitting. A warning that this node, or its wiring, is the problem.
- **Bus-off** (TEC > 255): the node disconnects itself from the bus. It returns to error active only after it has observed **128 occurrences of 11 consecutive recessive bits** (bus idle), and on most controllers only if software requests recovery (STM32: the ABOM bit for automatic, or clearing INRQ). A node that goes bus-off and has no recovery code stays silent until power cycle, which is the scenario.

Why 32 frames: 256 ÷ 8. A transmitter whose every frame fails reaches bus-off in 32 attempts, which at 100 ms is about three seconds. The diagnosis order for a silent node: (1) read its ESR: TEC, REC, bus-off flag; (2) measure the bus: 60 Ω between CAN_H and CAN_L with power off (two 120 Ω terminators in parallel; 120 Ω means one missing, 40 Ω means three); (3) scope a frame against the bit rate: level, bit time, ringing at the sample point. The error counters say *that* it failed and *who*; the resistance and the scope say *why*.`,
    },
    {
      type: "example",
      title: "Worked example: the silent dashboard node",
      body: `1. **ESR over the debugger:** TEC 256, REC 0, BOFF set. The node is bus-off because *its own transmissions* failed; nobody else's frames were the problem (REC is 0).
2. **Termination, power off:** 118 Ω between CAN_H and CAN_L. One terminator, not two. The far-end terminator's connector pin had backed out.
3. **Scope at 500 kbit/s:** bit time 2 µs; the first bits after each edge ring for 600 ns, which at the 75 % sample point (1.5 µs) is settled at room temperature and not settled when the cable's impedance drifted at −10 °C. Bit errors at the sample point, error frames from every receiver, +8 on the node's TEC per attempt.
4. **Fix:** reseat and lock the terminator; verify 60 Ω; add automatic bus-off recovery in the firmware with a logged counter, so a future harness fault degrades to a logged event instead of a dead dashboard.
5. **Prevention:** a termination check in the production test and a bus-health counter (TEC, REC, bus-off count) in the node's diagnostics.`,
    },
    {
      type: "exercise",
      exercise: {
        kind: "single",
        id: "arbitration-winner",
        skill: "can",
        objective: "Predict an arbitration result.",
        prompt: `Nodes A (ID 0x120) and B (ID 0x11F) start transmitting at the same instant. Which frame appears on the bus, and what happens to the other?`,
        options: [
          { id: "a", text: "B's frame (0x11F) is transmitted intact; A reads a dominant bit where it sent recessive, stops, and retries after B's frame.", correct: true, feedback: `Yes. 0x11F < 0x120; the first differing bit is where A sends 1 and B sends 0. Non-destructive: B's frame is unharmed.` },
          { id: "b", text: "Both frames are corrupted and both nodes retry after a random back-off.", correct: false, feedback: `That is Ethernet's old collision scheme. CAN arbitration is bitwise and non-destructive.` },
          { id: "c", text: "A's frame wins because 0x120 is larger.", correct: false, feedback: `The lower identifier wins: dominant (0) beats recessive (1).` },
          { id: "d", text: "The bus goes into an error state and both nodes increment TEC.", correct: false, feedback: `Arbitration is not an error; no counters change.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "numeric",
        id: "termination-reading",
        skill: "can",
        objective: "Interpret the termination measurement.",
        prompt: `With all nodes powered off, you measure the resistance between CAN_H and CAN_L on a correctly terminated high-speed CAN bus. What value do you expect, in ohms?`,
        unit: "Ω",
        answer: 60,
        tolerance: 2,
        solution: `Two 120 Ω terminators, one at each end, in parallel: **60 Ω**. About 120 Ω means one terminator is missing; about 40 Ω means a third one has been added; an open or a short is a wiring fault.`,
        solvedFeedback: `Correct: 60 Ω. The first measurement on any CAN bus that misbehaves.`,
        misconceptions: [
          { value: 120, tolerance: 2, feedback: `120 Ω is one terminator alone, which means the other is missing: exactly the scenario's fault. A healthy bus reads 60 Ω.` },
          { value: 240, tolerance: 2, feedback: `Terminators are in parallel across the pair, not in series: 120 ∥ 120 = 60 Ω.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "multi",
        id: "bus-off-facts",
        skill: "can",
        objective: "Know the fault-confinement rules.",
        prompt: `Select **every** true statement about CAN error handling.`,
        options: [
          { id: "a", text: "A transmit error adds 8 to TEC; a receive error adds 1 to REC; a successful frame subtracts 1.", correct: true, feedback: `Which is why transmitters with a bad line reach bus-off in 32 frames.` },
          { id: "b", text: "A node goes bus-off when TEC exceeds 255 and leaves the bus until it has seen 128 × 11 recessive bits (and software permits recovery).", correct: true, feedback: `Nodes without recovery code stay silent until power cycle.` },
          { id: "c", text: "An error-passive node cannot receive frames.", correct: false, feedback: `It still sends and receives; it only signals errors passively and waits longer before transmitting.` },
          { id: "d", text: "A node whose bit rate differs from the others corrupts frames for everyone, not just itself.", correct: true, feedback: `It drives error frames at the wrong times; the whole bus suffers.` },
          { id: "e", text: "An ACK error means the CRC was wrong.", correct: false, feedback: `An ACK error means no receiver drove the ACK slot dominant: no other node is on the bus or none received a valid frame. A CRC error is reported separately.` },
        ],
        solvedFeedback: `Right. +8/+1/−1, bus-off at 256 with the 128 × 11 recovery, passive still works, a wrong bit rate hurts everyone, and ACK is about having a listener.`,
      },
    },
    {
      type: "interview",
      questionId: "can-bus-off",
      intro: `Tell the dashboard story: ESR first, then termination, then the scope at the sample point. Then explain why bus-off exists and why recovery must be designed in.`,
    },
    {
      type: "figure",
      title: "A classic CAN data frame",
      diagram: "can-frame",
      alt: "Classic CAN data frame fields from start of frame through identifier, control, data, CRC, acknowledge and end of frame.",
      caption: `The identifier is sent first and decides arbitration bit by bit; the data length code says how many bytes follow; the CRC is checked by every receiver; the acknowledge slot is where another node says it heard a valid frame.`,
    },
    {
      type: "recap",
      summary: `- Dominant (0) beats recessive (1): wired-AND; arbitration is bitwise and non-destructive; the lowest identifier wins.
- Frame: SOF, identifier, RTR, control (DLC), data 0–8, CRC, ACK slot, EOF, intermission; stuffing after five identical bits; all nodes share bit rate and should share the sample point.
- TEC +8 / REC +1 per error, −1 per success; error active < 128, passive ≥ 128, bus-off at TEC > 255; recovery after 128 × 11 recessive bits and, usually, software permission.
- Silent node: read ESR (TEC, REC, bus-off), measure 60 Ω across the pair with power off, scope a frame at the sample point.`,
      cards: [
        { id: "can-1", front: "Why does the lowest CAN identifier win arbitration?", back: "Dominant (0) overrides recessive (1) on the wired-AND bus; the first node to send recessive while another sends dominant drops out. The winner's frame is untouched." },
        { id: "can-2", front: "How does a node reach bus-off, and how does it recover?", back: "Each transmit error adds 8 to TEC; bus-off when TEC exceeds 255 (32 consecutive failed frames). Recovery after 128 occurrences of 11 recessive bits and, on most controllers, a software request." },
        { id: "can-3", front: "Three measurements for a silent CAN node?", back: "Read its error status register (TEC, REC, bus-off); measure about 60 Ω between CAN_H and CAN_L with power off; scope a frame against the bit rate at the sample point." },
        { id: "can-4", front: "What does an ACK error mean?", back: "No receiver drove the ACK slot dominant: no other active node on the bus, or no node received a valid frame. Not the same as a CRC error." },
      ],
    },
  ],
};
