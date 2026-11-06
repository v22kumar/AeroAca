import type { Lesson } from "@/lib/content/schema";

export const capacitorsInductorsRcAndFilters: Lesson = {
  slug: "capacitors-inductors-rc-and-filters",
  moduleId: "fundamentals",
  prerequisites: ["circuit-laws-on-the-bench"],
  title: "Capacitors, inductors, the RC time constant and the filters they make",
  summary: "A capacitor resists a change in voltage, an inductor a change in current, and a resistor with either makes a time constant. From that one idea come debounce timing, reset delays, anti-alias filters, decoupling and the ripple on a rail.",
  durationMinutes: 11,
  whyItMatters: "Every 'it works at 1 kHz but not at 100 kHz', every reset that fires late and every ADC that reads noise is RC arithmetic. An interviewer who hears you say 'about five time constants' and '−3 dB at 1 over 2 pi RC' knows you can design a filter and read one.",
  objectives: [
    "Describe what a capacitor and an inductor do to a changing voltage or current, and the energy each stores.",
    "Compute an RC time constant, the charge and discharge curve at 1, 3 and 5 time constants, and the delay to a threshold.",
    "Compute the cutoff frequency of an RC low-pass or high-pass filter and read what it does to a signal above and below it.",
    "Choose capacitor types and values for decoupling, bulk storage, timing and anti-aliasing, and know the ESR and dielectric traps.",
  ],
  review: {
    status: "technically-reviewed",
    note: "Standard passive-network theory. The time-constant table and cutoff values were checked by the lab program; dielectric behaviour follows manufacturer application notes (Murata, KEMET). Values in examples are illustrative.",
  },
  references: [
    { title: "Horowitz and Hill, The Art of Electronics, 3rd edition, sections 1.4 to 1.7", note: "Capacitors, inductors, RC circuits, filters, decibels." },
    { title: "Murata: Basics of capacitors (application guide); KEMET: Ceramic capacitor DC bias and temperature characteristics", note: "Class 2 ceramics lose capacitance with DC bias and temperature; ESR and ESL versus package." },
    { title: "Lesson: ADC resolution, reference and noise", note: "Where the anti-alias filter's cutoff meets the sample rate." },
  ],
  steps: [
    {
      type: "scenario",
      title: "The button that pressed itself",
      body: `A button on a 3.3 V board feeds an MCU input through 10 kΩ with a 100 nF capacitor to ground "for debounce". Pressing it once registers two or three presses. Scoping the pin shows the voltage rising in a smooth curve over about 2 ms, and the MCU's input threshold sits in the middle of that curve, where a few millivolts of noise flip the reading back and forth.

The capacitor did its job: it slowed the edge. Nobody computed how slowly, or what a slow edge does to a digital input without hysteresis. This lesson is the computation.`,
    },
    {
      type: "concept",
      title: "What a capacitor and an inductor actually do",
      body: `A **capacitor** stores charge: Q = C × V. Its current is the rate of change of its voltage, I = C × dV/dt. The consequence that matters: **a capacitor's voltage cannot jump**. To change it you must move charge, and that takes time set by whatever resistance the charge flows through. It stores energy ½ C V²; a 100 µF capacitor at 5 V holds 1.25 mJ, which is what keeps a rail up for a millisecond while the regulator catches up.

An **inductor** stores current in a magnetic field: V = L × dI/dt. **An inductor's current cannot jump**; interrupt it and the voltage spikes to whatever is needed to keep the current flowing (the flyback spike that kills a transistor, and the reason relay coils get a diode). It stores ½ L I². In power supplies the inductor is the energy shuttle; in signal paths it is mostly a parasitic: every centimetre of wire is a few nanohenries, which is why decoupling must be close.

A **resistor** sets how fast charge or current can change in either. Resistance with capacitance makes a **time constant** τ = R × C (seconds, when R is in ohms and C in farads). 10 kΩ × 100 nF = 1 ms. Resistance with inductance makes τ = L / R.

Across a step from 0 to V, a capacitor charging through R follows V × (1 − e^(−t/τ)): 63 % at one τ, 95 % at 3τ, 99.3 % at 5τ. Discharging follows V × e^(−t/τ): 37 %, 5 %, 0.7 %. "About five time constants" is when an engineer calls it settled. The scenario's 1 ms time constant gives a 2.3 ms crawl through the input's threshold band, and a digital input with a threshold but no **hysteresis** (a Schmitt trigger has it; most MCU GPIO inputs have a little) chatters while the voltage dwells there.`,
      deeper: {
        title: "Time to a threshold",
        body: `For a charging capacitor, the time to reach a fraction f of the final voltage is t = −τ × ln(1 − f). To reach 50 %: 0.693τ. To cross an MCU input's V_IH of 0.7 × V_DD: −τ × ln(0.3) = 1.20τ. A reset-delay RC that must hold a chip in reset for 10 ms after power-up with V_IH at 0.7 V_DD needs τ ≈ 8.3 ms, so 100 kΩ and 100 nF, with the supply's own rise time added on top. The lab program prints this table.`,
      },
    },
    {
      type: "visual",
      title: "Step response and cutoff",
      visual: "rc-step",
      body: `Set R and C, read the time constant and the 1τ, 3τ, 5τ points on the charging curve, and the −3 dB cutoff of the same RC used as a low-pass filter. Then set a signal frequency and read how much of it gets through.`,
      caption: `Illustrative. The curve is V(1 − e^(−t/τ)) for a perfect step; a real supply rises in its own time and the two add. Attenuation shown is for a first-order filter: −3 dB at f_c, then −20 dB per decade.`,
    },
    {
      type: "concept",
      title: "The same RC as a filter",
      body: `Drive an RC with a sine wave instead of a step and it becomes a **filter**. A resistor in series then a capacitor to ground passes low frequencies and attenuates high ones (a **low-pass**); swap them and it is a **high-pass**. The boundary is the **cutoff frequency**

f_c = 1 / (2 π R C)

where the output is 1/√2 of the input, −3 dB, and the phase lags 45°. 10 kΩ and 100 nF give f_c = 159 Hz. Above f_c a first-order filter falls at 20 dB per decade (a factor of ten in voltage per factor of ten in frequency): at 1.59 kHz the output is about a tenth, at 15.9 kHz a hundredth. Below f_c it is essentially flat.

Three uses you will meet constantly:

- **Anti-aliasing** before an ADC: anything above half the sample rate folds back as a false low frequency (the aliasing interactive in the probing lesson). A first-order RC at a tenth of the sample rate attenuates the fold-back region by 20 dB or more; sharper needs more poles or a faster sample rate, which is the ADC lesson's trade.
- **Smoothing a PWM into a DC level** (a poor DAC): PWM at 20 kHz through an RC with f_c of 20 Hz leaves ripple of about a thousandth of the swing and responds in a few tens of milliseconds. The ripple and the response time are the same τ pulling in opposite directions.
- **Keeping switching noise off a sensitive rail**: an LC or RC filter in front of an analogue regulator (the power-tree lesson's PSRR point). A **ferrite bead** is a lossy inductor made for exactly this; it looks like a few hundred ohms above a few tens of megahertz and nearly a short at DC.

The **decibel** is how filters are described: dB = 20 × log₁₀(V_out / V_in). −3 dB is 0.707, −20 dB is 0.1, −40 dB is 0.01, −6 dB is 0.5. Learn these four and you can read any filter plot.`,
    },
    {
      type: "concept",
      title: "Choosing the capacitor, and the three traps",
      body: `**Ceramic (MLCC)**: small, cheap, low ESR, the universal decoupling and timing part. The trap is the **dielectric**: class 2 ceramics (X7R, X5R) lose capacitance with DC bias and temperature. A 10 µF X5R in a 0603 package biased at 3.3 V may be 4 µF. Timing circuits and anti-alias filters that need a stable value use **C0G/NP0** (class 1), which is stable but only available in small values. Ceramics are also piezoelectric: a noisy rail can sing, and a mechanical shock can inject a voltage.

**Electrolytic (aluminium) and tantalum/polymer**: large values for bulk storage. Aluminium electrolytics have high **ESR** (equivalent series resistance, from tens of milliohms to ohms), a lifetime that halves per 10 °C, and they dry out; polymer and tantalum have low ESR but tantalum fails short if reverse-biased or surge-stressed. A regulator that needs "ESR between 0.1 and 1 Ω" was designed for an electrolytic and may oscillate with a 10 mΩ ceramic; the datasheet's stability table is the law.

**Film**: stable, low loss, large; for mains, audio and precise timing.

The three traps: the **value you bought is not the value you have** (bias and temperature); **ESR and ESL** make a capacitor stop being one above its self-resonant frequency, which is why decoupling uses a 100 nF ceramic rather than one 10 µF part; and **voltage rating** is a maximum, with ceramics derated to about half for reliability and for the bias effect.`,
    },
    {
      type: "example",
      title: "Worked example: fixing the button, and an anti-alias filter",
      body: `**The button.** τ = 10 kΩ × 100 nF = 1 ms. The input's threshold band is 0.3 to 0.7 V_DD; the capacitor crosses it between 0.36τ and 1.20τ, so it dwells in the band for 0.84 ms, chattering. Three fixes, in order of preference: (1) enable the input's **Schmitt trigger** or add one (74HC14): hysteresis means one threshold on the way up and a lower one on the way down, so dwelling in between does nothing; (2) debounce in **firmware**: sample every 5 ms and accept a change after three identical samples, and remove the capacitor's influence; (3) make τ much shorter than the bounce (bounce is 1 to 10 ms, so RC debounce alone cannot be fast and effective at once, which is why fixes 1 and 2 win).

**The anti-alias filter.** An ADC samples a temperature signal at 1 kHz; the signal itself changes slower than 10 Hz but the cable picks up 50 Hz mains and switching noise around 20 kHz. Half the sample rate is 500 Hz; the 20 kHz noise would fold to 20 000 − 20 × 1000 = 0 Hz, a slow wobble indistinguishable from temperature. A first-order RC with f_c = 50 Hz (R = 3.3 kΩ, C = 1 µF C0G, f_c = 48 Hz) passes the signal with about 2 % error at 10 Hz, attenuates 50 Hz mains by 3 dB (not enough: average 20 samples over one mains cycle in firmware as well), and attenuates 20 kHz by 20 × log₁₀(20 000 / 48) ≈ 52 dB, to a quarter of a percent. The source resistance the ADC sees is 3.3 kΩ, within its sample-time budget. All of this is on one line of arithmetic per statement, and the lab program reproduces it.`,
    },
    {
      type: "lab",
      title: "Run it yourself: time constants, thresholds and cutoffs",
      lab: "py-rc",
      body: `The lesson's arithmetic as a program: for a few R and C pairs it prints τ, the voltage at 1τ/3τ/5τ, the time to reach 50 % and 70 % of the supply, the −3 dB cutoff of the same RC as a filter, and the attenuation at four frequencies. Run it and check the button's 1 ms and the anti-alias filter's 52 dB against the worked example.`,
      tryNext: `Add the reset-delay case from "Go deeper": 100 kΩ and 100 nF, and read the time to 70 %. Then halve C and predict the new cutoff and the new 70 % time before running.`,
    },
    {
      type: "exercise",
      exercise: {
        kind: "numeric",
        id: "rc-cutoff",
        skill: "passives",
        objective: "Compute an RC cutoff frequency.",
        prompt: `A 4.7 kΩ resistor and a 33 nF capacitor form a low-pass filter. What is the −3 dB cutoff frequency, in hertz?`,
        unit: "Hz",
        answer: 1026,
        tolerance: 15,
        solution: `f_c = 1 / (2π × 4700 × 33 × 10⁻⁹) = 1 / (9.745 × 10⁻⁴) ≈ **1026 Hz**. τ = 155 µs.`,
        solvedFeedback: `Right: about 1 kHz. At 10 kHz this filter passes about a tenth; at 100 Hz, essentially everything.`,
        misconceptions: [
          { value: 6447, tolerance: 100, feedback: `6447 is 1 / (R × C) without the 2π: that is the angular cutoff in radians per second, not hertz.` },
          { value: 1.026, tolerance: 0.02, feedback: `Check prefixes: 33 nF is 33 × 10⁻⁹ F. The answer is in kilohertz territory, not hertz units of one.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "numeric",
        id: "rc-threshold-time",
        skill: "passives",
        objective: "Compute the time for a charging RC to reach a threshold.",
        prompt: `A reset pin with a threshold at 0.5 × V_DD is held by 47 kΩ and 220 nF charging from 0 V at power-up. How long after the supply appears does the pin cross the threshold, in milliseconds? (Assume the supply itself steps instantly.)`,
        unit: "ms",
        answer: 7.17,
        tolerance: 0.15,
        solution: `τ = 47 000 × 220 × 10⁻⁹ = 10.34 ms. Time to 50 %: 0.693 × τ = **7.17 ms**.`,
        solvedFeedback: `Correct. Half the final voltage arrives at ln 2 ≈ 0.693 time constants, whatever the values.`,
        misconceptions: [
          { value: 10.34, tolerance: 0.15, feedback: `10.34 ms is one time constant, at which the capacitor has reached 63 %, past the 50 % threshold. The crossing is earlier: 0.693τ.` },
          { value: 5.17, tolerance: 0.15, feedback: `Half of τ is not the time to half the voltage; the curve is exponential, not linear. Use −τ × ln(1 − 0.5) = 0.693τ.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "multi",
        id: "capacitor-traps",
        skill: "passives",
        objective: "Recognise the practical traps of real capacitors.",
        prompt: `Select **every** correct statement.`,
        options: [
          { id: "a", text: "A 10 µF X5R ceramic at 3.3 V bias in a small package can have well under 10 µF of effective capacitance.", correct: true, feedback: `DC bias and temperature derating of class 2 ceramics; the datasheet curve, not the printed value, is the number.` },
          { id: "b", text: "A regulator specified for an output capacitor with 0.1 to 1 Ω of ESR may oscillate with a low-ESR ceramic.", correct: true, feedback: `The ESR was part of the regulator's compensation. Read the stability table before 'upgrading' the capacitor.` },
          { id: "c", text: "One 10 µF capacitor at the regulator replaces the 100 nF decoupling at each pin.", correct: false, feedback: `Above its self-resonant frequency a large capacitor is an inductor; the small ceramic close to the pin handles the edges.` },
          { id: "d", text: "An inductor's current can be interrupted instantly without consequence.", correct: false, feedback: `V = L × dI/dt: interrupting the current produces a large voltage spike; relay coils and motors need a flyback path.` },
          { id: "e", text: "Timing and anti-alias filters that need a stable value should use C0G/NP0 ceramics or film capacitors.", correct: true, feedback: `Class 1 dielectrics and film are stable with bias and temperature; X7R/X5R drift.` },
        ],
        solvedFeedback: `Right. The value you have is not the value you bought, ESR is part of a design, decoupling is about edges, inductors bite, and stable timing needs a stable dielectric.`,
      },
    },
    {
      type: "interview",
      questionId: "rc-debounce-filter",
      intro: `Give the time constant first, then the dwell in the threshold band, then the fix that uses hysteresis or firmware rather than a bigger capacitor.`,
    },
    {
      type: "recap",
      summary: `- Capacitor: I = C dV/dt, voltage cannot jump, stores ½CV². Inductor: V = L dI/dt, current cannot jump, stores ½LI².
- τ = RC. Charging: 63 % at τ, 95 % at 3τ, 99 % at 5τ; time to fraction f is −τ ln(1 − f); 50 % at 0.693τ.
- Filter cutoff f_c = 1 / (2πRC): −3 dB there, −20 dB per decade beyond. Anti-alias before the ADC; smooth PWM; filter rails. dB: −3 → 0.707, −6 → 0.5, −20 → 0.1, −40 → 0.01.
- Capacitors: class 2 ceramics lose value with bias and temperature; ESR is part of a regulator's design; decoupling needs small ceramics close to the pin; C0G/film for stable timing.`,
      cards: [
        { id: "rc-1", front: "RC time constant and the settling rule?", back: "τ = R × C. A step reaches 63 % at τ, 95 % at 3τ, 99.3 % at 5τ; call it settled at about five time constants. 10 kΩ × 100 nF = 1 ms." },
        { id: "rc-2", front: "Cutoff frequency of an RC filter?", back: "f_c = 1 / (2π R C), the −3 dB point (0.707). First order falls 20 dB per decade above it. 10 kΩ and 100 nF: 159 Hz." },
        { id: "rc-3", front: "Why does an RC-debounced button still chatter?", back: "The slow edge dwells in the input's threshold band (0.3 to 0.7 V_DD) for about 0.84τ; without hysteresis, noise flips the reading there. Fix with a Schmitt input or firmware debounce, not a bigger capacitor." },
        { id: "rc-4", front: "Why is a 10 µF X5R not 10 µF, and why does it matter?", back: "Class 2 ceramics lose capacitance with DC bias and temperature (often half or less at rated voltage in small packages). Use the datasheet curve; use C0G or film where the value sets a time or a cutoff." },
      ],
    },
  ],
};
