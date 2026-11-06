import type { Lesson } from "@/lib/content/schema";

export const groundingProtectionAndTheFirstThingThatBreaks: Lesson = {
  slug: "grounding-protection-and-the-first-thing-that-breaks",
  moduleId: "fundamentals",
  prerequisites: ["circuit-laws-on-the-bench", "diodes-and-transistors-as-switches"],
  title: "Grounding, protection and the first thing that breaks",
  summary: "Ground is a conductor with resistance and inductance, not a magic zero. Learn how return currents shift references, how to route and share grounds, and the five protection parts (TVS, series resistor, Schottky, PTC, reverse-polarity FET) that stand between a connector and a dead board.",
  durationMinutes: 11,
  whyItMatters: "Boards die at their connectors and lie through their grounds. A sensor that reads 0.2 V high when the motor runs, an input that dies after a winter of static, a reversed battery: these are the field returns, and an interviewer asking 'what protects this input?' wants the parts and the numbers, not 'a TVS somewhere'.",
  objectives: [
    "Explain why a shared ground return shifts a sensor's reference, compute the shift, and route returns so it does not matter.",
    "Describe the ground plane, star grounding, and the one place where analogue and digital grounds should meet.",
    "Choose protection for a connector pin: TVS clamp voltage and the rail it protects, series resistance against injection, Schottky for reverse current, PTC or fuse for overcurrent.",
    "Protect a supply input against reverse polarity with a diode or a P-channel MOSFET and state the cost of each.",
  ],
  review: {
    status: "technically-reviewed",
    note: "Grounding guidance follows standard mixed-signal layout references (Analog Devices tutorials, Ott). Protection parts and their selection rules follow manufacturer application notes on TVS and ESD protection (Littelfuse, Nexperia, TI). Numbers in examples are illustrative.",
  },
  references: [
    { title: "Analog Devices MT-031: Grounding data converters and solving the mystery of AGND and DGND", note: "Ground planes, where analogue and digital grounds meet, return currents." },
    { title: "Henry Ott, Electromagnetic Compatibility Engineering, chapters on grounding and cabling", note: "Common-impedance coupling, single-point versus multipoint grounding." },
    { title: "Littelfuse / Nexperia application notes on TVS diode selection for ESD and surge (IEC 61000-4-2, 61000-4-5)", note: "Reverse stand-off voltage, clamping voltage, peak pulse current." },
    { title: "Texas Instruments SLVA139: Reverse current/battery protection circuits", note: "Diode, Schottky and P-channel MOSFET reverse-polarity protection." },
  ],
  steps: [
    {
      type: "scenario",
      title: "The thermistor that followed the motor",
      body: `A temperature reading on a small controller jumps by 2 °C every time a pump motor on the same board starts. The thermistor is a 10 kΩ divider to the ADC; nothing is near the motor driver. Scoping the thermistor's ground pin against the regulator's ground pin shows 180 mV during the motor's start-up current. The ADC measures the thermistor against *its* ground, which is 180 mV away from the divider's ground, because 1.5 A of motor return current flows through the 0.12 Ω of shared ground trace between them.

The thermistor is fine. The ADC is fine. The ground is a resistor, and Kirchhoff's voltage law does not stop at the word "ground".`,
    },
    {
      type: "concept",
      title: "Ground is a conductor, and currents choose their own path",
      body: `Every current that leaves a supply returns to it, and the return path has resistance (milliohms per centimetre of thin trace) and inductance (about 1 nH per millimetre). Two things follow.

**Common-impedance coupling.** If a sensor's reference and a motor's return share a trace, the motor current times the trace resistance appears as a voltage on the sensor's reference: the scenario's 1.5 A × 0.12 Ω = 180 mV. At higher frequencies the inductance dominates: a 1 A edge in 10 ns through 10 nH is 1 V. The fix is **separate returns** that meet only at the supply (a **star** at low frequency), or a **ground plane** (a whole copper layer), which has so little resistance and so many parallel paths that the shared impedance collapses.

**Return currents follow the signal.** On a board with a ground plane, the return current of a fast signal flows in the plane *directly under the trace*, because that is the path of least inductance. Cut a slot in the plane under the trace and the return detours round it, forming a loop antenna that radiates and picks up noise. This is the reason the layout lesson insists on an unbroken plane under every fast signal, and why "split ground planes" cause more problems than they solve.

**Analogue and digital grounds** are not two separate nets; they are two regions of one plane, and the rule is to keep the digital return currents out of the analogue region by component placement, then join them in one place, at the converter (the ADC's AGND and DGND pins, per its datasheet). A separate star-connected analogue ground is an older technique that works at audio frequencies and fails at megahertz.

The habit on the bench: when a reading moves with some other load, **scope the two grounds against each other** before suspecting the sensor.`,
      deeper: {
        title: "Ground loops with cables",
        body: `Two boxes each earthed through their own mains lead and joined by a signal cable form a loop; mains leakage and magnetic pickup drive current round it, and the cable's shield or ground wire drops that current as a voltage between the two "grounds". Fixes: a single earth point, a differential interface (RS-485, the interfaces module) that measures the signal against itself rather than against ground, or isolation (opto, transformer, digital isolator).`,
      },
    },
    {
      type: "concept",
      title: "What breaks first: the pins that leave the board",
      body: `Inside the board the designer controls every voltage. At a connector the outside world arrives: static discharge from a hand (ESD, several kilovolts for nanoseconds), inductive kicks from cables (surges, hundreds of volts for microseconds), reversed plugs, shorts to the supply. Protection is placed **at the connector**, before anything delicate, and chosen from five parts:

- **TVS diode** (transient voltage suppressor): clamps a surge or ESD pulse to a voltage above the normal signal but below the protected part's absolute maximum. Three numbers: **reverse stand-off voltage** V_RWM (at or above the normal signal, so it does nothing in operation), **clamping voltage** V_C at the rated pulse current (what the protected pin actually sees during the event), and **peak pulse power or current**. A 3.3 V line gets a 5 V stand-off part clamping at around 9 to 10 V at 1 A; the pin's series resistor takes the rest. Low-capacitance TVS parts exist for fast signals.
- **Series resistor** (tens to hundreds of ohms): limits the current into a chip's clamp diodes during a transient and during the 5 V-into-3.3 V mistake from the logic-levels lesson; with the pin's capacitance it also forms a low-pass that slows ESD edges. Costs a little speed and a voltage drop at DC into low-impedance inputs.
- **Schottky to the rail and ground**: a faster, lower-voltage clamp than the chip's own diodes, so the current goes into the external part rather than into the chip.
- **PTC resettable fuse or fuse** on supply inputs: limits a sustained overcurrent (a short) to what the connector and traces survive; a PTC heats, goes high-resistance, and recovers. Rated holding current above the normal maximum, trip current below what the upstream supply and the traces can tolerate.
- **Reverse-polarity protection** on a battery or barrel-jack input: a **series diode** is simplest (cost: a 0.3 to 0.7 V drop and V_f × I of heat; a 1 A board loses 0.7 W and headroom); a **P-channel MOSFET** in the supply path with its gate to ground conducts with a few milliohms when the polarity is right and blocks when reversed (cost: a part and a gate resistor; gain: nearly zero drop). An ideal-diode controller IC does the same with an N-channel.

Every one of these is sized by the same two questions: what is the normal maximum (so the part stays out of the way) and what is the fault (so the part survives it and clamps below the damage threshold of what follows).`,
    },
    {
      type: "example",
      title: "Worked example: protecting three pins",
      body: `A board exposes a 12 V barrel-jack input, a 3.3 V RS-232-level-translated serial line, and a 3.3 V digital input from an external switch on a 2 m cable.

| Pin | Threat | Parts | Numbers |
|---|---|---|---|
| 12 V input, 1 A | Reverse plug; shorted downstream; surge from an unregulated adapter | P-MOSFET reverse protection; 1.5 A-hold PTC; 18 V stand-off TVS | MOSFET R_DS(on) 20 mΩ → 20 mV drop (a diode would drop 0.7 V and 0.7 W); PTC trips at ~3 A; TVS clamps at ~29 V at 10 A, below the 36 V regulator input rating |
| Serial line (translator input, 5 V-tolerant) | ESD from the connector; cable surge | 5 V stand-off low-capacitance TVS at the connector; 100 Ω series | Clamps ESD to ~10 V; 100 Ω limits translator-pin current to under 100 mA for the microsecond that remains |
| Switch input (MCU pin, not 5 V-tolerant) | ESD; cable pickup; the switch's long wire acting as an antenna | 10 kΩ pull-up; 1 kΩ series; 100 nF to ground; 3.3 V-rail Schottky clamp | RC 100 µs debounce and ESD slowing; 1 kΩ keeps injection under the 3 mA limit even at 6 V; Schottky steers the first pulse away from the chip |

Note what is **not** on the list: nothing on the internal I2C bus, the SPI flash or the ADC's thermistor divider. They never leave the board, and protection parts add capacitance and cost where there is no threat.`,
    },
    {
      type: "exercise",
      exercise: {
        kind: "numeric",
        id: "ground-shift",
        skill: "protection",
        objective: "Compute a ground shift from shared return current.",
        prompt: `A sensor's ground pin and a motor driver's return share 8 cm of trace with a resistance of 15 mΩ per centimetre. The motor draws 2.5 A at start-up. By how many millivolts does the sensor's reference move?`,
        unit: "mV",
        answer: 300,
        tolerance: 5,
        solution: `R = 8 × 15 mΩ = 0.12 Ω. Shift = 2.5 A × 0.12 Ω = 0.3 V = **300 mV**. On a 3.3 V, 12-bit ADC that is 372 counts of error, and it comes and goes with the motor. Fix: a separate return for the motor driver, or a ground plane.`,
        solvedFeedback: `Right. The ground is a resistor in Kirchhoff's loop; the sensor is measured against a moving reference.`,
        misconceptions: [
          { value: 37.5, tolerance: 1, feedback: `37.5 mV is 2.5 A × 15 mΩ, one centimetre's worth. The shared length is 8 cm: 0.12 Ω.` },
          { value: 30, tolerance: 1, feedback: `Check units: 2.5 A × 0.12 Ω = 0.30 V, which is 300 mV, not 30.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "single",
        id: "tvs-selection",
        skill: "protection",
        objective: "Choose a TVS stand-off voltage.",
        prompt: `A 3.3 V digital line to a connector needs ESD protection. The protected input's absolute maximum is 6 V. Which TVS is the right choice?`,
        options: [
          { id: "a", text: "A low-capacitance TVS with a reverse stand-off voltage of about 5 V, with a series resistor between the TVS and the pin", correct: true, feedback: `Stand-off above the 3.3 V signal so it stays out of the way, clamping typically near 9 to 10 V under the ESD pulse, with the series resistor limiting what reaches the pin for the remaining nanoseconds.` },
          { id: "b", text: "A TVS with a stand-off voltage of 3.0 V so it clamps as close to 3.3 V as possible", correct: false, feedback: `Below the signal's high level the TVS conducts in normal operation, loading the line and heating itself.` },
          { id: "c", text: "A 24 V stand-off TVS, because a higher rating is safer", correct: false, feedback: `A 24 V part clamps at 35 to 40 V, far above the input's 6 V absolute maximum. It protects nothing here.` },
          { id: "d", text: "No TVS; the chip's own clamp diodes are enough", correct: false, feedback: `Internal diodes handle a few milliamps of injection, not the amperes of an ESD or surge event.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "multi",
        id: "grounding-rules",
        skill: "protection",
        objective: "Apply grounding and protection rules.",
        prompt: `Select **every** correct statement.`,
        options: [
          { id: "a", text: "On a board with a ground plane, a fast signal's return current flows in the plane directly beneath the trace.", correct: true, feedback: `Least inductance. A slot under the trace forces a detour and makes a loop antenna.` },
          { id: "b", text: "Analogue and digital grounds should be separate nets joined nowhere.", correct: false, feedback: `They must be joined, in one place, at the converter; otherwise the ADC's two grounds float apart and every signal that crosses becomes a problem.` },
          { id: "c", text: "A P-channel MOSFET gives reverse-polarity protection with far less voltage drop and heat than a series diode.", correct: true, feedback: `Milliohms versus 0.3 to 0.7 V; at 1 A the diode wastes 0.7 W and headroom.` },
          { id: "d", text: "Protection parts belong at the connector, before anything delicate, and only on lines that leave the board.", correct: true, feedback: `Place them where the threat enters; internal buses gain only capacitance and cost.` },
          { id: "e", text: "A PTC resettable fuse protects against ESD.", correct: false, feedback: `A PTC reacts in milliseconds to sustained overcurrent; ESD is nanoseconds and kilovolts. That is the TVS's job.` },
        ],
        solvedFeedback: `Right. Returns follow the signal, grounds meet once at the converter, the FET beats the diode, protection goes at the edge, and each part matches a threat's time scale.`,
      },
    },
    {
      type: "interview",
      questionId: "ground-shift-protection",
      intro: `Start with the scope measurement between the two grounds, give the I × R number, then the routing fix; finish with what protects the connector pins and why each part.`,
    },
    {
      type: "recap",
      summary: `- Ground has resistance and inductance; shared returns shift references by I × R (and L × dI/dt). Separate returns meeting at the supply, or a ground plane; scope ground against ground when a reading moves with a load.
- Return currents flow under their signal on a plane; never slot the plane under a fast trace. Analogue and digital ground regions meet once, at the converter.
- Protection at the connector, matched to the threat: TVS (stand-off above the signal, clamp below the pin's maximum) for ESD and surge; series R to limit injection; Schottky clamps; PTC or fuse for sustained overcurrent; P-MOSFET (or diode) for reverse polarity.
- Nothing on internal buses; every part sized by normal maximum and fault level.`,
      cards: [
        { id: "gnd-1", front: "Why did the thermistor reading follow the motor?", back: "Shared ground return: the motor's 1.5 A through 0.12 Ω of common trace lifted the sensor's reference by 180 mV. Fix: separate returns to the supply or a ground plane; verify by scoping the two grounds against each other." },
        { id: "gnd-2", front: "Where should analogue and digital grounds join?", back: "In one place, at the converter (AGND/DGND per its datasheet), on a single plane whose regions are kept apart by placement. Separate unjoined nets or multiple joins create loops." },
        { id: "gnd-3", front: "Three TVS numbers?", back: "Reverse stand-off (at or above the normal signal, so it is inactive in operation), clamping voltage at the rated pulse current (what the pin sees during the event, must be below its absolute maximum), peak pulse power or current." },
        { id: "gnd-4", front: "Reverse-polarity protection: diode or MOSFET?", back: "Series diode: simple, 0.3 to 0.7 V drop, V_f × I of heat. P-channel MOSFET with gate to ground: milliohms, nearly no drop; a gate resistor and a part more. Use the FET above a few hundred milliamps or when headroom is tight." },
      ],
    },
  ],
};
