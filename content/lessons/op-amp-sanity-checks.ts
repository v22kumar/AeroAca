import type { Lesson } from "@/lib/content/schema";

export const opAmpSanityChecks: Lesson = {
  slug: "op-amp-sanity-checks",
  moduleId: "fundamentals",
  prerequisites: ["reading-a-power-tree"],
  title: "Op-amp sanity checks on the bench",
  summary: "Four checks that find most op-amp faults in ten minutes: are the rails and headroom right, is the output stuck at a rail, is the virtual short holding, and is it oscillating. Learn why each fault looks the way it does and what the datasheet numbers that cause them mean.",
  durationMinutes: 10,
  whyItMatters: "Sensor front ends, current-sense amplifiers and filters are all op-amps, and a wrong reading from any of them looks like a sensor fault until someone probes the amplifier. The sanity checks here are what a senior engineer does before touching a schematic.",
  objectives: [
    "Check an op-amp stage in order: supplies and headroom, DC operating point, virtual short, oscillation.",
    "Explain output saturation, input common-mode limits, bias and offset, gain-bandwidth and slew-rate effects.",
    "Recognise instability from capacitive loads and know the standard remedies.",
  ],
  review: {
    status: "technically-reviewed",
    note: "Follows standard op-amp application material (TI Op Amps for Everyone, Analog Devices Op Amp Applications Handbook). Numbers are illustrative of common parts.",
  },
  references: [
    { title: "Texas Instruments: Op Amps for Everyone (SLOD006)", note: "Ideal and real op-amp behaviour, stability, single-supply design." },
    { title: "Analog Devices: Op Amp Applications Handbook", note: "Input common-mode range, rail-to-rail outputs, capacitive load compensation." },
  ],
  steps: [
    {
      type: "scenario",
      title: "The thermistor that read 3.29 V whatever the temperature",
      body: `A thermistor front end feeds an ADC through a non-inverting amplifier with a gain of 3. The ADC reads 3.29 V at room temperature, in the freezer and on a hot plate. The thermistor is fine on a multimeter. The amplifier's output is at its positive rail, which is 3.3 V, because the gain of 3 on a 1.5 V input asks for 4.5 V from an amplifier that cannot give more than 3.2 V.

The circuit was simulated with an ideal op-amp on ±15 V. The board has one rail of 3.3 V. The four checks below find this in two minutes, and the other faults that look like it.`,
    },
    {
      type: "concept",
      title: "Checks one and two: supplies, headroom, operating point",
      body: `**Check one: supplies and headroom.** Measure V+ and V− at the op-amp pins. Then compare what the circuit asks of the output with what the part can deliver: a rail-to-rail output swings to within tens of millivolts of each rail; a classic part needs 1 to 2 V of headroom. And the **input common-mode range**: many parts cannot sense inputs near one rail; a non-rail-to-rail-input part on a single 3.3 V supply may stop working below 1 V or above 2.3 V at its inputs. The datasheet's "input common-mode voltage range" and "output voltage swing" lines are the two to read first.

**Check two: the DC operating point.** With the input at a known value, compute the expected output and measure it. An output sitting **at a rail** means saturation: the circuit asks for more than the rail allows (the scenario), the feedback is open (a broken resistor, a wrong footprint), or the inputs are outside common-mode range. An output at the right value but **offset** by millivolts is **input offset voltage** (a few millivolts on a cheap part, microvolts on a precision one) multiplied by the noise gain, plus **input bias current** flowing through the source resistance; a 1 nA bias through a 1 MΩ thermistor divider is 1 mV before the gain.

Single-supply circuits need a **bias point**: an AC-coupled signal into a single-rail amplifier must be referenced to mid-rail or it clips on every negative half-cycle. A stage that "works for positive signals only" is a missing bias.`,
      deeper: {
        title: "Gain-bandwidth and slew rate",
        body: `An op-amp with a gain-bandwidth product of 1 MHz at a closed-loop gain of 100 has a bandwidth of 10 kHz; a 50 kHz signal comes out attenuated and phase-shifted, which looks like a sensor that reads low at speed. Slew rate limits how fast the output can move: a 0.5 V/µs part cannot produce a 3 V, 100 kHz sine (which needs about 1.9 V/µs), so the output becomes a triangle. Both are datasheet numbers and both are visible on a scope in one minute.`,
      },
    },
    {
      type: "concept",
      title: "Checks three and four: the virtual short, and oscillation",
      body: `**Check three: the virtual short.** With negative feedback and an unsaturated output, the two inputs sit within millivolts of each other. Measure V+ and V− of the op-amp inputs: if they differ by volts, either the output is saturated (check two) or the feedback path is broken. This one measurement distinguishes "the amplifier is working but asked the impossible" from "the amplifier is not in control".

**Check four: oscillation.** Scope the output on a fast timebase with a short ground lead (day 6). A fuzzy trace, a clean sine at hundreds of kilohertz, or an output that reads differently on a multimeter and a scope: the stage is oscillating. The usual causes:

- a **capacitive load** (a long cable, an ADC input, a filter capacitor straight on the output) adding phase lag inside the loop; remedy: a small series resistor (10 to 100 Ω) between the output and the load, or the snubber the datasheet recommends;
- **missing decoupling** on the op-amp's supply pins;
- too much gain-bandwidth for the layout, with feedback traces running next to the output;
- a unity-gain-unstable part used at gain 1.

An oscillating amplifier produces a DC-looking wrong reading on a multimeter, which is why the scope is part of the check and not an afterthought.`,
    },
    {
      type: "example",
      title: "Worked example: the four checks on the thermistor stage",
      body: `1. **Supplies:** V+ = 3.30 V, V− = 0 V. Part is rail-to-rail output (swing to within 50 mV), input common-mode range 0 to 2.0 V on this supply.
2. **Operating point:** input 1.50 V, gain 3, expected 4.50 V: impossible on a 3.3 V rail. Output measures 3.25 V, saturated. Diagnosis made. Also: the 1.5 V input is inside the common-mode range, so the inputs are fine.
3. **Virtual short:** V− input at 1.08 V (3.25 V ÷ 3) against V+ at 1.50 V: 0.42 V apart. Consistent with saturation, not with an open loop.
4. **Oscillation:** none; a clean DC line on the scope.

Fix: gain of 2 and a thermistor divider that spans 0.3 to 1.5 V, giving 0.6 to 3.0 V at the output with 0.25 V of headroom; or an ADC reference and divider chosen so no gain is needed at all. The simulation is re-run with the real part's model on a single 3.3 V supply.`,
    },
    {
      type: "exercise",
      exercise: {
        kind: "single",
        id: "output-at-rail",
        skill: "analog",
        objective: "Diagnose an output stuck at a rail.",
        prompt: `A non-inverting stage with gain 10 on a single 3.3 V supply has its output at 3.27 V with the input at 0.5 V. The op-amp's inputs measure 0.50 V and 0.33 V. What is wrong?`,
        options: [
          { id: "a", text: "The circuit asks for 5 V from a 3.3 V rail; the output is saturated and the virtual short is broken because of it.", correct: true, feedback: `Yes. 0.5 V × 10 = 5 V is impossible; the output sits at the rail and V− (output ÷ 10 = 0.33 V) cannot follow V+. Reduce the gain or the input range.` },
          { id: "b", text: "The op-amp is oscillating.", correct: false, feedback: `An oscillating stage shows AC on the scope; a steady 3.27 V at the rail with the arithmetic matching saturation is saturation.` },
          { id: "c", text: "The feedback resistor is open.", correct: false, feedback: `With open feedback the output would still slam to a rail, but V− would not be sitting at exactly output ÷ 10; the numbers here match an intact divider.` },
          { id: "d", text: "Input bias current is too high.", correct: false, feedback: `Bias current produces millivolt offsets, not a rail-stuck output.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "order",
        id: "opamp-check-order",
        skill: "analog",
        objective: "Order the sanity checks.",
        prompt: `Order the four op-amp sanity checks as you would run them on the bench.`,
        items: [
          { id: "supplies", text: "Measure the supply pins and compare the required output swing and input range with the datasheet", why: "Everything else depends on the rails being right." },
          { id: "dc", text: "Compute and measure the DC operating point; look for an output at a rail or offset", why: "Saturation and offset faults show here." },
          { id: "vshort", text: "Measure both inputs: the virtual short holds only with feedback and no saturation", why: "Separates 'asked the impossible' from 'loop broken'." },
          { id: "osc", text: "Scope the output for oscillation with a short ground lead", why: "A multimeter cannot see it; it corrupts every other reading." },
        ],
        correctOrder: ["supplies", "dc", "vshort", "osc"],
        solvedFeedback: `Correct. Rails, DC point, virtual short, scope for oscillation.`,
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "multi",
        id: "oscillation-causes",
        skill: "analog",
        objective: "Know the causes of op-amp instability.",
        prompt: `Select **every** likely cause of an op-amp stage oscillating.`,
        options: [
          { id: "a", text: "A capacitive load (long cable, ADC input, filter capacitor) directly on the output.", correct: true, feedback: `Adds phase lag inside the loop; a small series resistor or the datasheet's snubber fixes it.` },
          { id: "b", text: "No decoupling capacitor on the op-amp supply pins.", correct: true, feedback: `The supply becomes part of the feedback path through its impedance.` },
          { id: "c", text: "Input offset voltage of 2 mV.", correct: false, feedback: `Offset shifts the output; it does not cause oscillation.` },
          { id: "d", text: "A part that is not unity-gain stable used as a follower.", correct: true, feedback: `Decompensated parts need a minimum closed-loop gain.` },
          { id: "e", text: "Using a 1 % feedback resistor instead of 0.1 %.", correct: false, feedback: `Tolerance affects gain accuracy, not stability.` },
        ],
        solvedFeedback: `Right. Capacitive load, missing decoupling and a decompensated part at low gain are the usual three; offset and tolerance affect accuracy, not stability.`,
      },
    },
    {
      type: "interview",
      questionId: "opamp-sanity",
      intro: `Give the four checks in order and one fault each finds. Mention the single-supply headroom trap; it is the one most candidates have personally hit.`,
    },
    {
      type: "recap",
      summary: `- Check one: supplies, output swing, input common-mode range against the datasheet.
- Check two: DC operating point; an output at a rail is saturation, open feedback or inputs outside range; millivolt errors are offset and bias current through source resistance.
- Check three: virtual short holds only with feedback and no saturation; inputs volts apart means the loop is not in control.
- Check four: scope for oscillation; capacitive loads, missing decoupling and decompensated parts are the usual causes; a series resistor is the usual fix.
- Single-supply circuits need a bias point and headroom; gain-bandwidth and slew rate limit speed.`,
      cards: [
        { id: "oa-1", front: "Four op-amp sanity checks in order?", back: "Supplies and headroom against the datasheet; DC operating point (rail-stuck or offset); virtual short between inputs; scope for oscillation." },
        { id: "oa-2", front: "Output stuck at a rail: three causes?", back: "The circuit asks for more swing than the rail allows; the feedback path is open; the inputs are outside the common-mode range." },
        { id: "oa-3", front: "Why scope an op-amp that reads a steady wrong DC value?", back: "An oscillating stage averages to a DC-looking wrong reading on a multimeter; only the scope shows the oscillation." },
        { id: "oa-4", front: "Standard fix for a capacitive load making an op-amp oscillate?", back: "A small series resistor (10 to 100 Ω) between the output and the load, or the snubber network the datasheet recommends." },
      ],
    },
  ],
};
