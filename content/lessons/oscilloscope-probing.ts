import type { Lesson } from "@/lib/content/schema";

export const oscilloscopeProbing: Lesson = {
  slug: "oscilloscope-probing",
  moduleId: "instrumentation",
  prerequisites: [],
  title: "Oscilloscope probing without lying to yourself",
  summary: "The probe is part of the circuit. Learn how bandwidth, sample rate, probe loading and the ground lead change what you see, so a measurement proves something instead of creating a new fault.",
  durationMinutes: 10,
  whyItMatters: "Every diagnosis in this academy ends with 'look at it on the scope'. Engineers who know what the probe adds, and what the scope cannot show, are trusted with the hard faults; interviewers probe this with questions about ringing, loading and aliasing.",
  objectives: [
    "Explain what a 10× passive probe is, why it must be compensated, and what it loads a node with.",
    "Relate scope bandwidth to the fastest edge it can show, and sample rate to aliasing.",
    "Recognise artefacts that the measurement itself creates: ringing from the ground lead, a stopped oscillator, a false low-frequency waveform.",
  ],
  review: {
    status: "technically-reviewed",
    note: "Figures are standard instrument-engineering values: 10× probe division and capacitance, the 0.35 ÷ bandwidth rise-time estimate for a Gaussian response, and the Nyquist criterion. Specific numbers for a given probe or scope come from its datasheet. The aliasing visual is a simulation.",
  },
  references: [
    {
      title: "Oscilloscope and probe manufacturer application notes on probing (any major vendor)",
      note: "Probe compensation, input capacitance, ground-lead inductance and bandwidth derating are described in every vendor's 'ABCs of probes'-style guide.",
    },
    {
      title: "Rise time and bandwidth relationship",
      note: "t_r ≈ 0.35 ÷ BW for a Gaussian-response oscilloscope; many modern scopes with flatter responses use 0.4 to 0.45. Check your scope's datasheet.",
    },
  ],
  steps: [
    {
      type: "scenario",
      title: "The ringing that was not there",
      body: `A colleague shows you a scope screen: every clock edge on a board rings violently, overshooting by 40 %. The conclusion on the whiteboard is "signal integrity problem, respin the PCB".

You pick up the probe. It has the long alligator ground lead clipped to a header pin twenty centimetres away. You swap it for the short spring ground tip. The ringing drops to a small, clean overshoot.

Nothing on the board changed. The measurement did. This lesson is about telling the two apart.`,
    },
    {
      type: "concept",
      title: "The probe is a circuit element",
      body: `A standard **10× passive probe** has a 9 MΩ resistor in its tip. Together with the scope's 1 MΩ input it forms a 10:1 divider, which is why the scope must be told the probe factor. In exchange for the attenuation it presents a light load: about 10 MΩ and, more importantly, only **10 to 15 pF** of capacitance. A 1× probe presents around **100 pF**, enough to disturb fast or high-impedance nodes.

That capacitance is the load that matters. Ten picofarads on a crystal pin adds to the load capacitance and can shift the frequency or stop a marginal oscillator. On a 10 kΩ pull-up node it forms a low-pass filter with a corner near 1.5 MHz, so a fast edge looks slow. The honest question before every measurement is: *what does my probe add here?*

**Compensation.** The probe's divider only divides correctly at all frequencies if a small adjustable capacitor matches the scope's input capacitance. Clip the probe to the scope's calibration square wave: a flat top means compensated; a rounded corner means under-compensated (high frequencies attenuated too much); an overshooting corner means over-compensated. An uncompensated probe turns every edge into a lie, in both directions.

**The ground lead.** The 15 cm alligator lead is an inductor of roughly 100 to 200 nH. With the probe's tip capacitance it forms a resonant circuit in the region of 100 MHz. Fast edges excite it, and the scope shows ringing the circuit does not have. The spring ground tip at the probe head shortens the loop and removes most of it.`,
      deeper: {
        title: "Ground clips and mains-referenced circuits",
        body: `The probe's ground clip is connected, through the scope, to mains earth. Clipping it onto any node that is not at earth potential shorts that node to earth through the probe. On a battery-powered board this is merely a measurement error; on a mains-referenced power supply it is a destroyed probe, a destroyed circuit, or an injury.

Measuring between two non-ground nodes needs a differential probe, or two channels subtracted (with the limits that implies), never a "floated" scope with the earth pin removed.`,
      },
    },
    {
      type: "concept",
      title: "What the scope cannot show",
      body: `**Bandwidth.** A scope's bandwidth is the frequency at which it attenuates a sine wave by 3 dB. For edges, the useful number is the fastest rise time it can display, roughly **t_r ≈ 0.35 ÷ BW** for a classic Gaussian response: a 100 MHz scope cannot show an edge faster than about 3.5 ns, and an edge measured near that limit is the scope's rise time, not the signal's. The rule of thumb is a bandwidth of **five times** the highest frequency content you care about; a 100 MHz scope is fine for a 1 MHz SPI clock's edges but blind to the ringing on a 3 ns edge.

**Sample rate.** A digital scope takes samples; it does not see between them. To display a waveform's shape you need several samples per period, and to avoid being fooled you need at least two (the **Nyquist** criterion). Below that, the scope reconstructs a **false, lower-frequency waveform** from the samples, an **alias**, and it looks perfectly real. Long timebases push the sample rate down (fixed memory depth ÷ long time), so a 1 MHz clock viewed at 100 ms per division can appear as a slow wobble.

The test for an alias is simple: change the timebase. A real signal keeps its frequency; an alias changes.

**Trigger and capture.** A repeating signal is easy. One-off events, such as the single reset pulse that happens at power-on, need **single-shot** capture with an edge trigger on the relevant line (NRST falling, for instance) and a long enough record. Triggering on the symptom rather than on time is how you catch what happened *before* it.`,
    },
    {
      type: "visual",
      title: "Watch a signal alias",
      visual: "aliasing",
      body: `Set the signal frequency and the sample rate. Above 2× the signal frequency the samples trace the sine; below it, the dots line up on a slower waveform that does not exist. Try 10 MHz sampled at 12 MS/s.`,
      caption: `Simulation of sampling a sine wave. The apparent frequency of an alias is the distance from the signal frequency to the nearest multiple of the sample rate.`,
    },
    {
      type: "example",
      title: "Worked example: three measurements, three probe decisions",
      body: `**Ripple on a 3.3 V rail.** You want 20 mV of ripple on a 3.3 V DC level. DC coupling at a sensitivity that shows 3.3 V hides 20 mV. Use **AC coupling** to remove the DC, a sensitive range, and the **20 MHz bandwidth limit** to keep high-frequency pickup from swamping the real ripple. Keep the ground loop tiny: spring tip, probe across the output capacitor.

**An 8 MHz crystal.** A 10× probe's 10 pF changes the load on the crystal pins. Probe the **MCO** pin or the oscillator output buffer instead; if you must probe the crystal, use a low-capacitance active probe, and treat any frequency reading as disturbed.

**A 3 ns edge on a 50 MHz clock.** Your 100 MHz scope shows a 4 ns rise with mild overshoot. The scope's own rise time is 3.5 ns, so the measurement is dominated by the instrument; the real edge is faster (roughly √(4² − 3.5²) ≈ 1.9 ns) and the overshoot may be probe ringing. To see the truth you need a faster scope, a spring ground, and ideally an active probe.`,
    },
    {
      type: "exercise",
      exercise: {
        kind: "numeric",
        id: "scope-rise-time",
        skill: "instrumentation",
        objective: "Relate bandwidth to the fastest displayable edge.",
        prompt: `Using the t_r ≈ 0.35 ÷ BW estimate, what is the fastest rise time a 200 MHz oscilloscope can display, in nanoseconds?`,
        unit: "ns",
        answer: 1.75,
        tolerance: 0.03,
        solution: `0.35 ÷ 200 × 10⁶ Hz = 1.75 × 10⁻⁹ s = **1.75 ns**. Any edge you measure near this value is being limited by the scope, not the circuit. The true rise time combines as a root-sum-of-squares, so a displayed 2.0 ns edge is really about √(2.0² − 1.75²) ≈ 0.97 ns.`,
        solvedFeedback: `Correct, 1.75 ns. A good habit: write the scope's own rise time on the bench before measuring edges, so you know which numbers to trust.`,
        misconceptions: [
          { value: 3.5, tolerance: 0.05, feedback: `3.5 ns is the figure for a 100 MHz scope. With 200 MHz the estimate halves: 0.35 ÷ 200 MHz = 1.75 ns.` },
          { value: 5, tolerance: 0.05, feedback: `5 ns is one period of 200 MHz, not the rise-time estimate. Rise time is 0.35 divided by the bandwidth: 1.75 ns.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "single",
        id: "scope-alias-check",
        skill: "instrumentation",
        objective: "Recognise and test for aliasing.",
        prompt: `A 4 MHz clock viewed at a slow timebase shows a clean 30 kHz waveform. You suspect an alias. Which observation would prove it?`,
        options: [
          { id: "a", text: "Changing the timebase changes the displayed frequency.", correct: true, feedback: `Yes. A real 30 kHz signal stays at 30 kHz at any timebase. An alias is an artefact of the sample rate, which the timebase sets, so it moves when the timebase moves.` },
          { id: "b", text: "Increasing the vertical sensitivity makes the waveform larger.", correct: false, feedback: `Both real signals and aliases scale with vertical gain; that tells you nothing about frequency.` },
          { id: "c", text: "The waveform disappears when the probe is removed.", correct: false, feedback: `So does a real signal. Removing the probe tests the connection, not the sampling.` },
          { id: "d", text: "The frequency counter on the scope also reads 30 kHz.", correct: false, feedback: `Most scope frequency readouts are computed from the same samples, so they report the alias too. Use the timebase test, or a hardware counter input.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "multi",
        id: "probe-artefacts",
        skill: "instrumentation",
        objective: "Identify artefacts created by the measurement.",
        prompt: `Select **every** observation that is more likely an artefact of the probe or scope than a property of the circuit.`,
        options: [
          { id: "a", text: "An oscillator stops the moment the probe touches the crystal pin.", correct: true, feedback: `Probe capacitance added to the crystal's load. The oscillator may have been marginal, but the stopping is the probe's doing.` },
          { id: "b", text: "Every fast edge rings at about 100 MHz, with the long alligator ground lead in use.", correct: true, feedback: `The ground-lead inductance and tip capacitance resonate near 100 MHz. Swap to the spring ground tip before concluding anything about signal integrity.` },
          { id: "c", text: "A 3.3 V rail shows 300 mV of 100 kHz triangular ripple with the probe tip and spring ground across the output capacitor.", correct: false, feedback: `A short ground, correct coupling and a waveform at the switching frequency: this is probably real regulator ripple, and worth investigating.` },
          { id: "d", text: "A square wave from the scope's own calibration output shows rounded corners through this probe.", correct: true, feedback: `That is an under-compensated probe. Adjust the compensation trimmer until the corners are square before trusting any edge measurement.` },
          { id: "e", text: "NRST shows a 20 µs low pulse once per second, captured with single-shot on the falling edge.", correct: false, feedback: `A specific, repeatable pulse caught with a correct trigger is a real event. Go and find what resets the chip.` },
        ],
        solvedFeedback: `Right. Loading, ground-lead resonance and compensation are the three ways a probe lies; the two real observations were made with short grounds and correct triggering.`,
      },
    },
    {
      type: "interview",
      questionId: "probe-loading",
      intro: `A short, precise answer here signals bench experience. Mention capacitance, the ground lead and compensation, and give one example of each.`,
    },
    {
      type: "recap",
      summary: `- A 10× probe loads a node with about 10 to 15 pF; a 1× probe with about 100 pF. Ask what that does to the node before you measure.
- Compensate the probe on the calibration square wave; an uncompensated probe distorts every edge.
- The long ground lead resonates with the tip capacitance and adds ringing. Use the spring ground tip.
- t_r ≈ 0.35 ÷ BW; measurements near the scope's own rise time are the scope's, not the circuit's.
- Fewer than two samples per period creates an alias; prove it by changing the timebase.
- The ground clip is mains earth. Never clip it to a live node.`,
      cards: [
        { id: "scope-1", front: "What does a 10× passive probe load a node with?", back: "About 10 MΩ in parallel with 10 to 15 pF (a 1× probe: around 100 pF). Enough to stop a marginal crystal or slow a high-impedance edge." },
        { id: "scope-2", front: "Edges ring at ~100 MHz with the alligator ground lead. Real?", back: "Probably not: ground-lead inductance resonates with probe capacitance. Re-measure with the spring ground tip before diagnosing signal integrity." },
        { id: "scope-3", front: "Fastest rise time a 100 MHz scope can show?", back: "About 0.35 ÷ 100 MHz = 3.5 ns. A measured 4 ns edge is mostly the scope's own response." },
        { id: "scope-4", front: "How do you prove a waveform is an alias?", back: "Change the timebase: a real signal keeps its frequency, an alias changes. Keep the sample rate above 2× (ideally 5 to 10×) the signal frequency." },
        { id: "scope-5", front: "Why never clip the probe ground to a non-ground node?", back: "The ground clip is tied to mains earth through the scope; clipping it elsewhere shorts that node to earth. Use a differential probe." },
      ],
    },
  ],
};
