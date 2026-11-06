import type { Lesson } from "@/lib/content/schema";

export const theDmmAndTheBenchSupply: Lesson = {
  slug: "the-dmm-and-the-bench-supply",
  moduleId: "instrumentation",
  prerequisites: [],
  title: "The multimeter and the bench supply: the two instruments you touch first",
  summary: "Before the oscilloscope comes out, a multimeter and a current-limited bench supply answer most questions. Learn what each range really measures, the three ways a meter lies (burden, loading, averaging), how to power an unknown board without burning it, and what the supply's current readout tells you.",
  durationMinutes: 10,
  whyItMatters: "Every bring-up checklist, every mission in this academy and every first day on a new board starts with these two instruments. Interviewers ask 'how would you measure that?' and expect the connection, the range and the thing that could go wrong, not the word 'multimeter'.",
  objectives: [
    "Measure voltage, current, resistance and continuity correctly: where the meter goes, which range, and what the reading means.",
    "Explain burden voltage, input impedance and averaging, and recognise when each has fooled a measurement.",
    "Set up a bench supply for an unknown or new board: voltage, current limit, sense, sequencing, and how to read the current it reports.",
    "Use the pre-power resistance check and the current-limited first power-up to turn a possible short into a measurement.",
  ],
  review: {
    status: "technically-reviewed",
    note: "Instrument behaviour follows manufacturer handbooks (Keysight, Fluke) and typical specifications for handheld and bench meters and linear/switching bench supplies. Specific numbers (input impedance, burden, resolution) are typical and illustrative; read your own instrument's manual.",
  },
  references: [
    { title: "Keysight Technologies, Practical Temperature Measurements and Multimeter Measurement Tutorial (application notes)", note: "Burden voltage, input impedance, true-RMS versus average-responding, ranging." },
    { title: "Fluke: ABCs of multimeter safety and measurement basics", note: "Connection for voltage, current and resistance; CAT ratings; fused current inputs." },
    { title: "Lesson: A board bring-up checklist that actually gets used", note: "Where the pre-power resistance check and the current-limited first power-up are used as checklist lines." },
  ],
  steps: [
    {
      type: "scenario",
      title: "The 3.3 V rail that read 2.8 V",
      body: `A new board draws 400 mA. The engineer wants the current, so she puts the meter in series with the 3.3 V rail on its 400 mA range and reads 0.398 A, then measures the rail downstream of the meter: 2.8 V. Panic about a sagging regulator follows, until someone measures across the meter itself: 0.5 V. The meter's current range has about 1.2 Ω of shunt and lead resistance, and 0.4 A through 1.2 Ω is the missing half volt.

The meter was telling the truth about the current and quietly changing the circuit to do it. This is **burden voltage**, and it is one of three ways the simplest instrument on the bench misleads.`,
    },
    {
      type: "concept",
      title: "Four measurements, four connections",
      body: `**Voltage** is measured **across** two points, in parallel with the circuit, with the meter's black lead on your reference (usually ground). The meter's input impedance (10 MΩ on most, 1 GΩ or more on high-impedance modes) is a load on the node, which matters only for high-impedance nodes (the circuit-laws lesson: a 1 MΩ divider reads 9 % low on a 10 MΩ meter). DC and AC are different ranges; on AC, cheap meters are **average-responding** and only read correctly for sine waves, while **true-RMS** meters read any waveform, within their bandwidth, which is usually a few kilohertz. A meter on DC averages anything faster than a few readings per second: a 20 ms dip, a 1 kHz PWM, a ripple are all invisible, which is why the power-tree lesson says "scope the load".

**Current** is measured **in series**: break the circuit and route the current through the meter's current jacks on a current range. The meter inserts a shunt resistor and measures the voltage across it; that shunt drops the **burden voltage** of the scenario (up to a few hundred millivolts on milliamp ranges, more with thin leads). Rules: start on the highest current range; never connect the current jacks across a voltage source (the shunt is nearly a short, and the fuse, if there is one, blows); switch the leads back to the voltage jacks before measuring voltage again. For microamp sleep currents use a meter with a µA range, accept that the burden is large, or measure the voltage across a known series resistor instead.

**Resistance** is measured with the meter driving a small current through the part and reading the voltage, **with the circuit unpowered** and the part ideally out of circuit: parallel paths (other components, your fingers) read low, and a charged capacitor or a live rail gives nonsense and can damage the meter. Readings on an unpowered board are still useful as comparisons ("this rail reads 0.3 Ω to ground; the identical rail on the good board reads 8 kΩ").

**Continuity** is a resistance measurement with a beeper and a threshold of a few tens of ohms: good for finding shorts, broken traces and which connector pin is which. The **diode test** drives about 1 mA and shows the forward voltage: 0.6 V for silicon, 0.3 V for Schottky, 1.8 V and up for LEDs, and an open or 0 V in reverse for a good diode; it also tells you whether a chip's input is still alive (its clamp diodes measure like diodes to the rails) or dead (open or short).`,
      deeper: {
        title: "Resolution, accuracy and ranging",
        body: `A "4½-digit" meter displays 19 999 counts; on a 2 V range that is 100 µV of resolution. Accuracy is quoted as ± (percentage of reading + counts): 0.5 % + 2 counts on a reading of 3.300 V is ± 0.0165 V ± 0.0002 V. Resolution is not accuracy, and auto-ranging picks the range for you but may switch mid-measurement; use manual ranging when watching a value settle. The meter's own reading is a measurement with uncertainty, and a reviewer wants the uncertainty on the test record.`,
      },
    },
    {
      type: "concept",
      title: "The bench supply as an instrument",
      body: `A bench supply is a voltage source with an adjustable **current limit**, and the limit is what makes it an instrument rather than a hazard. Set the voltage, then set the limit to a little above the board's expected draw (or, for the first power-up of an unknown board, to a few tens of milliamps). When the load tries to draw more, the supply drops its voltage to hold the current at the limit (**constant-current** mode, usually shown by a CC indicator). A short therefore produces a reading, not smoke: the supply sits in CC at your limit with its voltage collapsed, and the current readout is the fact you record.

The current **readout** is the second instrument: a board that should draw 60 mA and draws 140 mA has something wrong; one that draws 2 mA has a rail not turned on or a chip in reset; one whose current creeps upward over minutes has something getting hot. Note the readout's resolution (a 10 mA resolution display cannot see a 2 mA sleep current; use the meter) and its averaging (bursts are invisible; use a scope across a shunt).

**Remote sense**: on supplies with sense terminals, separate wires let the supply regulate at the load rather than at its own terminals, cancelling the lead resistance (the power-tree lesson's I × R again). Without sense, long thin leads at 2 A can lose a few hundred millivolts.

**Sequencing and multiple rails**: boards with more than one rail often require an order (core before I/O, or all within a few milliseconds); two independent channels switched on by hand do not meet it, so use the supply's tracking or output-enable features, or power the board's own regulators from one input. **Output enable** switches the output without disturbing the settings, and a supply left on while you move leads is how boards get a brief 12 V on a 3.3 V pin.

**Noise**: a linear bench supply is quiet; a switching one has ripple at tens of kilohertz that will appear in analogue measurements. Know which one you have.`,
    },
    {
      type: "example",
      title: "Worked example: first power-up of an unknown board",
      body: `A board arrives with no documentation beyond "5 V in".

1. **Unpowered resistance check.** Meter on resistance, probes on the 5 V input and ground: 1.8 kΩ, settling upward as capacitors charge from the meter. A short would read under 10 Ω and stay there. Repeat for each visible regulator output to ground: 3.3 V rail 4.2 kΩ, 1.8 V rail 900 Ω. Record all three.
2. **Supply set-up.** 5.00 V, current limit 50 mA, output off. Leads to the board, polarity checked twice against the silkscreen.
3. **Output on.** Supply goes into CC at 50 mA with its voltage at 1.1 V: the board wants more than 50 mA at start-up (inrush into the bulk capacitors, plus the regulators). Not a fault yet. Raise the limit in steps: at 150 mA the voltage reaches 5.00 V and the current settles at 84 mA. Record 84 mA at 5.00 V.
4. **Meter on voltage.** 3.3 V rail: 3.29 V; 1.8 V rail: 1.81 V, both at the chip pins, not the regulator (the power-tree lesson). The board is alive at a known cost.
5. **Current as a signal.** Pressing the reset button drops the current to 61 mA then back to 84 mA: the MCU runs and does something after reset. Shorting a jumper labelled BOOT raises it to 90 mA: the bootloader is awake. All of this came from the supply's readout before any debugger was connected.

Had step 1 read 2 Ω, step 3 would have been skipped and the search for the short would have started with the meter, at the current limit, with nothing damaged.`,
    },
    {
      type: "exercise",
      exercise: {
        kind: "numeric",
        id: "burden-voltage",
        skill: "dmm",
        objective: "Compute burden voltage.",
        prompt: `A meter's 400 mA current range has a total shunt and lead resistance of 1.2 Ω. The circuit draws 350 mA. How much voltage does the meter steal from the circuit, in volts?`,
        unit: "V",
        answer: 0.42,
        tolerance: 0.01,
        solution: `Burden = I × R = 0.35 A × 1.2 Ω = **0.42 V**. A 3.3 V rail downstream of the meter is now 2.88 V, which can reset the board you are measuring. Use a lower-resistance range, a shunt and the voltage range, or the bench supply's readout.`,
        solvedFeedback: `Right. The meter measures the current honestly and changes the circuit to do it.`,
        misconceptions: [
          { value: 3.43, tolerance: 0.05, feedback: `That divides instead of multiplying. The voltage across the shunt is I × R: 0.35 × 1.2.` },
          { value: 420, tolerance: 5, feedback: `0.42 V, not 420 V: 350 mA is 0.35 A.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "single",
        id: "supply-cc",
        skill: "dmm",
        objective: "Interpret a bench supply in constant-current mode.",
        prompt: `You power a new board for the first time with the supply set to 3.3 V and a 30 mA limit. The supply's CC light comes on and its voltage display reads 0.4 V. What do you know, and what next?`,
        options: [
          { id: "a", text: "The board is trying to draw more than 30 mA; it may be a short or normal inrush. Raise the limit in small steps and watch whether the voltage recovers; if it stays collapsed at a modest limit, look for the short with the meter.", correct: true, feedback: `Yes. Constant-current mode is the supply holding your limit; the collapsed voltage is the consequence. Stepping the limit separates inrush from a real short without risking the board.` },
          { id: "b", text: "The supply is faulty; swap it.", correct: false, feedback: `The supply is doing exactly what the current limit asked. The information is in the CC light and the voltage.` },
          { id: "c", text: "Turn the limit to maximum so the board gets full voltage.", correct: false, feedback: `If there is a short, maximum current is how traces and connectors burn. The limit is the protection; raise it gradually.` },
          { id: "d", text: "The board's regulator is in dropout.", correct: false, feedback: `The supply, not the board, has dropped the voltage. Read the instrument's indicators before reasoning about the board.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "multi",
        id: "meter-connections",
        skill: "dmm",
        objective: "Connect and read a multimeter correctly.",
        prompt: `Select **every** correct statement.`,
        options: [
          { id: "a", text: "Current is measured in series on a current range; connecting the current jacks across a supply shorts it through the meter's shunt.", correct: true, feedback: `The shunt is nearly a short; the fuse (if fitted) is the only thing between you and a damaged meter or supply.` },
          { id: "b", text: "Resistance and continuity are measured with the circuit unpowered, and other components in parallel make the reading lower than the part alone.", correct: true, feedback: `The meter drives its own small current; power or parallel paths corrupt the reading.` },
          { id: "c", text: "A DC voltage reading faithfully shows a 20 ms dip on a rail.", correct: false, feedback: `A meter averages over tens to hundreds of milliseconds; dips, PWM and ripple need a scope.` },
          { id: "d", text: "The diode test on a chip's input pin to its supply and ground shows roughly 0.5 to 0.7 V in one direction for a healthy input, and an open or a short for a damaged one.", correct: true, feedback: `The input's clamp diodes measure like diodes; it is the quickest check for a pin that took 5 V.` },
          { id: "e", text: "A 10 MΩ meter has no effect on any node on a board.", correct: false, feedback: `On a high-impedance node (a 1 MΩ divider, a reference, an unbuffered sensor) the meter's load is visible; compute the Thévenin resistance first.` },
        ],
        solvedFeedback: `Right. Series for current and never across a source; unpowered for ohms; a meter averages; the diode test finds dead pins; a meter is a load.`,
      },
    },
    {
      type: "interview",
      questionId: "first-power-up",
      intro: `Describe the unpowered resistance check, the current-limited first power-up with the CC behaviour, and what the current readout told you; name the burden trap.`,
    },
    {
      type: "recap",
      summary: `- Voltage across (parallel), current in series (break the circuit, highest range first, never across a source), resistance and continuity unpowered, diode test for V_f and for dead inputs.
- Three ways a meter misleads: burden voltage on current ranges (I × shunt), loading of high-impedance nodes (10 MΩ is a load), averaging (dips, PWM and ripple invisible; use a scope).
- Bench supply: set voltage, then a current limit a little above expected (tens of milliamps for an unknown board); CC mode means the limit is holding and the voltage has collapsed; step the limit to separate inrush from a short.
- The current readout is a signal: too high, too low, creeping, changing with reset or boot pins. Remote sense cancels lead drop; mind sequencing and output enable.`,
      cards: [
        { id: "dmm-1", front: "What is burden voltage?", back: "The voltage a meter's current shunt drops when measuring current: I × R_shunt (0.35 A × 1.2 Ω = 0.42 V). It can sag the rail you are measuring and reset the board. Use a lower-resistance range or a shunt plus the voltage range." },
        { id: "dmm-2", front: "First power-up of an unknown board?", back: "Unpowered resistance from each rail to ground (a short reads ohms and stays there); supply at the right voltage with a small current limit; output on; if CC, step the limit and watch the voltage recover; record the settled current; then rails at the chip pins." },
        { id: "dmm-3", front: "Why does a DC meter miss the fault?", back: "It averages over tens to hundreds of milliseconds, so a 20 ms dip, PWM or ripple reads as a steady value. Anything that varies needs the oscilloscope." },
        { id: "dmm-4", front: "Diode test as a damage check?", back: "A healthy input measures about 0.5 to 0.7 V to its rails through its clamp diodes in one direction and open in the other; an open both ways or a short means the pin is dead." },
      ],
    },
  ],
};
