import type { Lesson } from "@/lib/content/schema";

export const diodesAndTransistorsAsSwitches: Lesson = {
  slug: "diodes-and-transistors-as-switches",
  moduleId: "fundamentals",
  prerequisites: ["circuit-laws-on-the-bench", "capacitors-inductors-rc-and-filters"],
  title: "Diodes and transistors as switches",
  summary: "Firmware drives LEDs, relays, motors and power rails through a handful of parts: a diode that steers current, a MOSFET or bipolar transistor that switches it. Learn the four numbers that make each one work, the flyback diode that saves the transistor, and why a 3.3 V pin cannot drive every MOSFET.",
  durationMinutes: 11,
  whyItMatters: "The first circuit a firmware engineer designs is usually 'switch this load from a GPIO'. Getting it wrong is a hot transistor, a dim LED or a dead pin, and interviewers ask about gate drive and flyback precisely because the mistakes are so common.",
  objectives: [
    "Use a diode's forward voltage and reverse limit to size an LED resistor, steer current, and clamp a flyback spike.",
    "Choose a MOSFET for a GPIO-driven switch from V_GS(th), R_DS(on) at the available gate voltage, V_DS, and current, and compute its dissipation.",
    "Size a bipolar transistor's base resistor for saturation with margin and know when a BJT beats a MOSFET.",
    "Draw the four standard switch circuits: low-side N-channel, high-side P-channel, BJT low-side, and the relay or motor with a flyback diode.",
  ],
  review: {
    status: "technically-reviewed",
    note: "Device behaviour per standard texts and datasheet conventions; the gate-threshold argument follows the way R_DS(on) is specified at test V_GS values in manufacturer datasheets. Part numbers are examples, not recommendations.",
  },
  references: [
    { title: "Horowitz and Hill, The Art of Electronics, 3rd edition, chapter 2 (Bipolar transistors) and chapter 3 (Field-effect transistors)", note: "Switch circuits, saturation, gate drive, logic-level MOSFETs." },
    { title: "Vishay/Infineon MOSFET datasheet conventions and application note on R_DS(on) versus V_GS", note: "Why V_GS(th) is not the voltage to drive the gate to; R_DS(on) is specified at 4.5 V or 10 V on most parts." },
    { title: "Lesson: Reading a power tree", note: "Dissipation and the half-rating rule, applied here to the switch." },
  ],
  steps: [
    {
      type: "scenario",
      title: "The MOSFET that was 'logic level'",
      body: `A 3.3 V microcontroller switches a 12 V, 1.5 A heater through an N-channel MOSFET. The datasheet's first page says V_GS(th) = 2 V, so a 3.3 V pin should turn it on. The heater runs lukewarm and the MOSFET reaches 110 °C in a minute.

The threshold is the gate voltage at which the device *starts* to conduct a quarter of a milliamp. Its on-resistance, 20 mΩ, is specified at V_GS = 10 V; at 3.3 V the same part is in a region the datasheet does not even plot, with an on-resistance of several ohms. 1.5 A through 3 Ω is 6.75 W. This lesson is the four numbers that would have caught it.`,
    },
    {
      type: "concept",
      title: "Diodes: a one-way valve with a toll",
      body: `A diode conducts when its anode is about 0.6 to 0.7 V above its cathode (silicon; 0.3 V for Schottky, 1.8 to 3.3 V for an LED depending on colour) and blocks the other way up to its **reverse breakdown voltage**. Four jobs:

- **Steering and protection.** A series diode blocks a reversed supply (at the cost of its forward drop and dissipation: 0.6 V × 1 A = 0.6 W); a Schottky halves the drop.
- **LED current.** An LED is a diode with a fixed forward voltage and *no* current limit of its own. From a 3.3 V pin through a resistor: R = (3.3 − V_f) / I. A red LED (V_f ≈ 2.0 V) at 5 mA needs (3.3 − 2.0) / 0.005 = 260 Ω; use 270 Ω. The GPIO's own current limit (typically 8 to 20 mA per pin on an STM32, with a total per port) is the other constraint.
- **Flyback (freewheeling).** When a transistor switching an inductive load (relay, solenoid, motor) turns off, the inductor's current must continue (V = L dI/dt). A diode across the load, cathode to the supply, gives it a path; without it the drain voltage spikes to tens or hundreds of volts and the transistor dies. A fast or Schottky diode rated above the load current.
- **Clamping.** Two diodes from a signal to the rails clamp it to within a diode drop of each; that is what most IC input protection is, and why forcing 5 V into a 3.3 V pin pushes current into the chip's supply through the top diode.

Diodes dissipate V_f × I; a 1 A rectifier at 0.7 V is 0.7 W and needs a package to match.`,
      deeper: {
        title: "Zener and TVS diodes",
        body: `A **Zener** is designed to conduct in reverse at a known voltage (the breakdown), giving a crude reference or clamp. A **TVS** (transient voltage suppressor) is a Zener-like device built to absorb short, large surges (ESD, inductive kicks) at a voltage just above the protected rail, and is the standard part on connectors and lines that leave the board. The protection lesson picks them.`,
      },
    },
    {
      type: "concept",
      title: "The MOSFET switch: four numbers, not one",
      body: `An N-channel MOSFET conducts between drain and source when its gate is pulled sufficiently above its source. As a switch it is read from four datasheet numbers:

1. **V_DS(max)**: the voltage it can block when off; take the supply plus any flyback allowance and leave 30 to 50 % margin.
2. **I_D(max)** and, more usefully, the current at the dissipation you can tolerate.
3. **R_DS(on) at your gate voltage.** This is the number the scenario missed. Datasheets specify it at V_GS = 10 V and often 4.5 V; a part usable from a 3.3 V pin must specify R_DS(on) at 2.5 V or 3.3 V (these are marketed as **logic-level** MOSFETs, and even then read the curve). V_GS(th) tells you only when it begins to leak.
4. **Q_g, the gate charge**: the gate is a capacitor (nanofarads for power parts). Charging it from a GPIO through its output resistance takes time and, at high switching frequency, current. For a switch that turns on a few times a second this is irrelevant; for PWM at 20 kHz it sets the switching loss and the need for a gate driver.

Dissipation when on: **P = I² × R_DS(on)**. The scenario's heater through a true logic-level part with 30 mΩ at 3.3 V: 1.5² × 0.03 = 68 mW, no heatsink. R_DS(on) rises with temperature (about 1.5 to 2× from 25 °C to 125 °C), so take the hot value.

**Low-side switching** (load between the supply and the drain, source to ground) is the simple case: the gate is driven relative to ground, where the GPIO lives. **High-side switching** (load between source and ground) with an N-channel needs the gate above the supply, which a GPIO cannot provide; use a **P-channel** MOSFET with its source at the supply and pull its gate low to turn on, with a small NPN or a second N-channel to pull the gate to ground from a 3.3 V pin when the supply is above the pin's limits. A gate **pull-down** (or pull-up for P-channel) keeps the switch off while the MCU is in reset and the pin is floating; forgetting it gives a load that runs during boot.`,
    },
    {
      type: "concept",
      title: "The bipolar switch, and when to use it",
      body: `An NPN transistor conducts collector to emitter when base current flows: I_C ≈ β × I_B in the linear region, but as a switch you drive it into **saturation**, where more base current changes nothing and V_CE falls to about 0.1 to 0.3 V. Design for saturation with margin: assume β of 10 (a **forced beta**), not the datasheet's 100 to 300, and size the base resistor for I_B = I_C / 10:

R_B = (V_pin − V_BE) / I_B, with V_BE ≈ 0.7 V.

A 100 mA relay from a 3.3 V pin: I_B = 10 mA, R_B = (3.3 − 0.7) / 0.01 = 260 Ω. Note the pin must source 10 mA, within an STM32's limit but not with much to spare; at 500 mA of load a BJT wants 50 mA of base, which no GPIO gives, and a MOSFET wins. Dissipation when on: V_CE(sat) × I_C ≈ 0.2 × 0.1 = 20 mW.

When a BJT is the right part: small loads from a low-voltage pin where a MOSFET's gate voltage would be marginal; driving a P-channel's gate from a 3.3 V pin on a 12 V rail (the BJT's collector swings the full 12 V); and when you need a defined voltage drop. When a MOSFET is: anything above a few hundred milliamps, anything switched fast, and anywhere the control pin's current budget matters. **Darlington** arrays (ULN2003) bundle seven BJT switches with flyback diodes for relays and steppers at the price of a 1 V saturation drop.`,
    },
    {
      type: "example",
      title: "Worked example: four switches on one board",
      body: `| Load | Circuit | Key numbers | Dissipation on | Notes |
|---|---|---|---|---|
| Status LED, 3.3 V pin | Pin → 270 Ω → LED → GND | V_f 2.0 V, I = 4.8 mA | 10 mW in R | Within the 8 mA per-pin budget; no transistor needed |
| 12 V relay coil, 80 mA | Low-side NPN, 330 Ω base, 1N4148 flyback across coil | I_B = 7.9 mA, forced β 10 | ≈ 16 mW | Pin sources 7.9 mA; diode cathode to +12 V |
| 12 V heater, 1.5 A, slow PWM | Low-side logic-level N-MOSFET, 100 kΩ gate pull-down, 100 Ω gate series | R_DS(on) 30 mΩ at 3.3 V (curve checked), V_DS 30 V | 68 mW | Pull-down keeps heater off during reset; series R limits gate current spike |
| 5 V sensor rail, 200 mA, switched off in sleep | High-side P-MOSFET, gate pulled to 5 V by 10 kΩ, pulled low through a small NPN from the pin | R_DS(on) 100 mΩ at V_GS = −4.5 V | 4 mW | NPN inverts: pin high = rail on; sensor ground stays at ground |

Two things a reviewer would check: the relay's flyback diode is present and oriented with its cathode to the positive supply, and the heater MOSFET's R_DS(on) is quoted at the gate voltage actually available, not at 10 V.`,
    },
    {
      type: "exercise",
      exercise: {
        kind: "numeric",
        id: "led-resistor",
        skill: "actives",
        objective: "Size an LED series resistor.",
        prompt: `A green LED with a forward voltage of 2.2 V is driven from a 5 V rail at 8 mA. What series resistance is needed, in ohms?`,
        unit: "Ω",
        answer: 350,
        tolerance: 5,
        solution: `R = (5 − 2.2) / 0.008 = 2.8 / 0.008 = **350 Ω**. The standard value 330 Ω gives 8.5 mA; 360 Ω gives 7.8 mA. Dissipation in the resistor: 2.8 V × 8 mA = 22 mW.`,
        solvedFeedback: `Right. The resistor sees the rail minus the LED's forward drop, never the whole rail.`,
        misconceptions: [
          { value: 625, tolerance: 5, feedback: `625 Ω is 5 V / 8 mA, ignoring the LED's 2.2 V. The LED takes its forward voltage first; the resistor drops the remainder, 2.8 V.` },
          { value: 275, tolerance: 5, feedback: `That is (5 − 2.2) / 0.0102, or a slip in the arithmetic. 2.8 V / 0.008 A = 350 Ω.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "single",
        id: "mosfet-gate",
        skill: "actives",
        objective: "Read the MOSFET datasheet number that matters for a GPIO-driven switch.",
        prompt: `A 3.3 V GPIO must switch a 2 A load through an N-channel MOSFET. Which datasheet entry decides whether the part will work without overheating?`,
        options: [
          { id: "a", text: "R_DS(on) specified at V_GS = 2.5 V or 3.3 V (and the R_DS(on) versus V_GS curve)", correct: true, feedback: `Yes. The on-resistance at the gate voltage you actually have sets the dissipation: I² × R_DS(on). A part specified only at 4.5 V and 10 V is not proven at 3.3 V.` },
          { id: "b", text: "V_GS(th), the gate threshold voltage", correct: false, feedback: `The threshold is where the channel begins to conduct microamps. A part with V_GS(th) = 2 V can still have ohms of on-resistance at 3.3 V, as in the scenario.` },
          { id: "c", text: "I_D(max) at 25 °C case temperature", correct: false, feedback: `That rating assumes a perfect heatsink and full gate drive. It says nothing about the drive you have.` },
          { id: "d", text: "The package size", correct: false, feedback: `Package sets how much heat you can remove; it does not change how much heat an under-driven gate produces.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "multi",
        id: "switch-circuits",
        skill: "actives",
        objective: "Check switch circuits for the standard mistakes.",
        prompt: `A low-side NPN switches a 12 V relay coil from a 3.3 V pin. Select **every** statement that is correct.`,
        options: [
          { id: "a", text: "A flyback diode across the coil, cathode to +12 V, is required to protect the transistor at turn-off.", correct: true, feedback: `The coil's current must continue when the transistor opens; without the diode the collector spikes far above 12 V.` },
          { id: "b", text: "The base resistor should be sized for about one tenth of the collector current, not for the datasheet's typical β.", correct: true, feedback: `Forced β of 10 guarantees saturation across temperature and part spread.` },
          { id: "c", text: "The relay coil's current flows through the GPIO pin.", correct: false, feedback: `Only the base current (a few milliamps) comes from the pin; the coil current flows from +12 V through the coil and the collector to ground.` },
          { id: "d", text: "Connecting the pin directly to the base with no resistor is fine because the transistor limits the current.", correct: false, feedback: `A base-emitter junction is a diode; without a resistor the pin drives it like a shorted LED and the pin or the transistor fails.` },
          { id: "e", text: "A MOSFET would need no base current and would be preferred at several amps.", correct: true, feedback: `Gate drive is voltage, not continuous current; above a few hundred milliamps a logic-level MOSFET is the usual choice.` },
        ],
        solvedFeedback: `Right. Flyback diode present and oriented, forced beta, pin current small, base resistor mandatory, MOSFET for bigger loads.`,
      },
    },
    {
      type: "interview",
      questionId: "gpio-switch-design",
      intro: `Name the load, pick the device, give the four numbers, then the flyback diode and the pull-down; end with the dissipation.`,
    },
    {
      type: "figure",
      title: "A low-side MOSFET switch, drawn",
      diagram: "mosfet-switch",
      alt: "An N-channel MOSFET switching a 12 volt load on the low side, driven from a 3.3 volt GPIO through a gate resistor, with a flyback diode across the load.",
      caption: `The load sits above the switch, so the GPIO's 3.3 V can drive a logic-level gate directly. The gate resistor limits the charging current; the flyback diode gives an inductive load somewhere to put its current when the switch opens.`,
    },
    {
      type: "recap",
      summary: `- Diode: conducts above V_f (0.3 Schottky, 0.7 silicon, 2 to 3 V LED), blocks to its reverse rating; LED resistor R = (V − V_f) / I; flyback diode across inductive loads, cathode to the supply.
- MOSFET switch: V_DS margin, current at acceptable dissipation, **R_DS(on) at your gate voltage** (not V_GS(th)), gate charge for fast switching; P = I² R_DS(on); gate pull-down for reset.
- BJT switch: saturate with forced β = 10, R_B = (V_pin − 0.7) / I_B; fine for tens of milliamps and for driving a P-channel gate from a low-voltage pin.
- Low-side N-channel for grounded loads; high-side P-channel (gate pulled low) when the load's ground must stay at ground.`,
      cards: [
        { id: "sw-1", front: "Why can a '2 V threshold' MOSFET overheat when driven from 3.3 V?", back: "V_GS(th) is where conduction begins (microamps). R_DS(on) is specified at 4.5 or 10 V; at 3.3 V an ordinary part may be ohms. P = I² × R_DS(on). Use a logic-level part with R_DS(on) quoted at 2.5 or 3.3 V." },
        { id: "sw-2", front: "LED series resistor from a 3.3 V pin, red LED, 5 mA?", back: "R = (3.3 − 2.0) / 0.005 = 260 Ω → 270 Ω. The resistor drops the rail minus V_f; stay inside the pin's current limit." },
        { id: "sw-3", front: "What does the flyback diode do and which way does it go?", back: "Gives the inductive load's current a path when the switch opens, clamping the spike. Across the load, cathode to the positive supply, rated above the load current; fast or Schottky." },
        { id: "sw-4", front: "Base resistor for an NPN switching 100 mA from 3.3 V?", back: "Forced β 10 → I_B = 10 mA; R_B = (3.3 − 0.7) / 0.01 = 260 Ω. Check the pin can source it; above a few hundred milliamps use a MOSFET." },
      ],
    },
  ],
};
