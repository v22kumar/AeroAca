import type { Lesson } from "@/lib/content/schema";

export const adcResolutionReferenceAndNoise: Lesson = {
  slug: "adc-resolution-reference-and-noise",
  moduleId: "fundamentals",
  prerequisites: ["op-amp-sanity-checks", "capacitors-inductors-rc-and-filters"],
  title: "ADC resolution, reference and noise",
  summary: "Twelve bits is a count, not an accuracy. Learn what one LSB is worth, where the reference's error and noise go, why the input's source impedance and the sample time matter on a microcontroller ADC, and what averaging can and cannot buy you.",
  durationMinutes: 10,
  whyItMatters: "The sensor monitor in the portfolio track, and most products, end in an ADC. Knowing why a 12-bit reading jitters by 8 counts, and which of reference, layout, impedance or sample time is responsible, is a daily skill and a standard interview question.",
  objectives: [
    "Convert resolution and reference to LSB size, quantisation noise and a code for a given voltage.",
    "Explain the reference's contribution to accuracy and noise, and the input impedance and sample-time requirement of a SAR ADC.",
    "Use averaging and oversampling correctly, and recognise when they cannot help.",
  ],
  review: {
    status: "technically-reviewed",
    note: "SAR ADC input model and sample-time guidance follow STM32 reference manuals and AN2834 (How to get the best ADC accuracy on STM32). Quantisation-noise and oversampling arithmetic is standard.",
  },
  references: [
    { title: "ST AN2834: How to get the best ADC accuracy on STM32 microcontrollers", note: "Error sources, sampling time versus source impedance, layout and reference recommendations." },
    { title: "STM32F4 reference manual, ADC chapter", id: "RM0090", note: "Sampling time registers, resolution, internal reference." },
    { title: "Lesson: Oscilloscope probing without lying to yourself", note: "Aliasing, covered there." },
  ],
  steps: [
    {
      type: "scenario",
      title: "Eight counts of jitter on a 12-bit reading",
      body: `A 12-bit ADC on a 3.3 V reference reads a steady 1.000 V thermistor divider as 1240 ± 4 counts: eight counts of jitter, which is 6.5 mV, which is about 0.6 °C of apparent temperature noise on a sensor specified to 0.1 °C. The engineer averages 64 samples and gets ± 3 counts, not the ± 0.5 that √64 promised.

The noise was not random. It was the switching regulator's ripple on the ADC reference, correlated sample to sample, which averaging cannot remove. This lesson is how to tell which error is which.`,
    },
    {
      type: "concept",
      title: "Resolution, LSB and the reference",
      body: `An N-bit ADC divides its reference into 2^N codes: **1 LSB = V_ref ÷ 2^N**. For 12 bits and 3.3 V that is 0.806 mV; for 16 bits, 50 µV. A voltage V gives code ≈ V ÷ LSB (rounded per the part's transfer function).

**Resolution is not accuracy.** The code is only as good as three things:

- **The reference.** Its initial accuracy (±0.5 % on a cheap LDO rail is ±16 LSB at 12 bits), its temperature drift, and its **noise and ripple**: anything on V_ref appears in every conversion, scaled by the input fraction. A supply rail used as the reference carries the regulator's ripple and the digital noise of the board; a dedicated reference with its own decoupling does not. The scenario's correlated jitter came from here.
- **The ADC's own errors**: offset, gain, integral and differential non-linearity, each a datasheet number in LSB. These are systematic and partly calibratable (most MCU ADCs have a calibration routine).
- **Quantisation noise**: the unavoidable ±½ LSB from rounding, with an rms value of LSB ÷ √12. It sets the ideal signal-to-noise ratio of about 6.02 N + 1.76 dB; a real ADC's **effective number of bits (ENOB)** is lower, and 10.5 ENOB from a 12-bit converter on a noisy board is common.

Reading the datasheet for a sensor front end therefore means reading the reference's spec sheet too.`,
      deeper: {
        title: "Why a microcontroller ADC cares about source impedance",
        body: `A successive-approximation ADC samples by connecting a small capacitor (a few picofarads) through a switch with some resistance to the input for the **sample time**, then converting. The capacitor must charge to within ½ LSB through the source's impedance plus the switch's: with a 10 kΩ thermistor divider and 12 bits, that is several microseconds, and the reference manual's table of maximum source impedance against sample time says exactly how many ADC clock cycles to set. Too short a sample time on a high-impedance source gives readings that are low, or that depend on the previous channel: the classic "my second channel reads the first channel's value". The fix is a longer sample time, a buffer op-amp, or a 100 nF capacitor at the ADC pin to hold charge, with its own consequences for bandwidth.`,
      },
    },
    {
      type: "visual",
      title: "LSB, codes and noise",
      visual: "adc-quantisation",
      body: `Change the resolution and the reference; read the LSB, the code for a test voltage and the quantisation noise. Add reference noise and see which part of the jitter averaging removes.`,
      caption: `Illustrative calculator; the noise model is simplified to uncorrelated versus reference-correlated components.`,
    },
    {
      type: "concept",
      title: "Averaging, oversampling and what they cannot fix",
      body: `Averaging n samples reduces **uncorrelated** noise by √n: 64 samples turn 8 counts of white noise into 1. It does nothing to noise that is the same in every sample (a DC offset, a reference error) or correlated across them (ripple at a frequency comparable to the sample rate, which aliases into a slow wander). The scenario's residual ± 3 counts was ripple; the fix was a cleaner reference and a filter, not more samples.

**Oversampling with decimation** can add resolution: 4^k times more samples for k extra bits, provided the noise is at least about 1 LSB and uncorrelated so that the codes actually dither. On a quiet input the ADC returns the same code every time and no amount of averaging creates information; some MCUs add deliberate dither or have an oversampling hardware block for this reason.

**Layout and sequencing** are the rest of the budget: a separate analogue ground return, the reference decoupled at the pin, no digital traces under the analogue input, and the conversion timed away from the radio burst or the switcher edge. AN2834's checklist is the practical order.`,
    },
    {
      type: "example",
      title: "Worked example: the jitter budget",
      body: `12-bit ADC, 3.3 V rail as reference, 1.000 V input, 10 kΩ source, sample time 3 cycles at 21 MHz ADC clock.

| Source | Size | Averaging helps? |
|---|---|---|
| Quantisation | 0.29 LSB rms | Yes (√n) |
| ADC noise (datasheet) | ~1 LSB rms | Yes |
| Reference ripple from the buck, 2 mV p-p at 300 kHz | ~2.5 LSB p-p, aliased | No: correlated, aliases to a wander |
| Sample time too short for 10 kΩ | reads ~1 % low, channel-dependent | No: systematic |
| Reference accuracy ±1 % | ±41 LSB gain error | No: calibrate or use a reference IC |

The fix order: longer sample time (free), a dedicated 3.0 V reference IC or at least an LC filter and local decoupling on V_ref (removes the ripple), calibration against a known voltage (removes most gain error), then averaging for the residual white noise. The ± 4 counts became ± 1 count with a lower noise floor than averaging alone could reach.`,
    },
    {
      type: "exercise",
      exercise: {
        kind: "numeric",
        id: "lsb-size",
        skill: "adc",
        objective: "Compute LSB size.",
        prompt: `A 12-bit ADC uses a 2.500 V reference. What is one LSB, in millivolts?`,
        unit: "mV",
        answer: 0.610,
        tolerance: 0.002,
        solution: `1 LSB = V_ref ÷ 2^12 = 2.500 V ÷ 4096 = **0.610 mV**. A 1.000 V input is code 1638; the quantisation noise is 0.610 ÷ √12 = 0.18 mV rms.`,
        solvedFeedback: `Correct: 0.610 mV. Resolution gives the step; accuracy depends on the reference and the ADC errors on top of it.`,
        misconceptions: [
          { value: 0.805, tolerance: 0.003, feedback: `0.806 mV is for a 3.3 V reference. With 2.500 V: 2.5 ÷ 4096 = 0.610 mV.` },
          { value: 1.22, tolerance: 0.01, feedback: `1.22 mV is 2.5 V ÷ 2048, an 11-bit step. Twelve bits give 4096 codes: 0.610 mV.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "single",
        id: "channel-crosstalk",
        skill: "adc",
        objective: "Diagnose sample-time trouble.",
        prompt: `Two ADC channels are read in sequence. Channel 2, fed from a 47 kΩ divider, reads a value close to channel 1's whatever its own voltage. What is the most likely cause?`,
        options: [
          { id: "a", text: "The sample time is too short for the 47 kΩ source, so the sampling capacitor keeps part of channel 1's charge.", correct: true, feedback: `Yes. The SAR sampling capacitor must charge through the source impedance within the sample time; increase the sample time per the reference-manual table, buffer the source, or add a capacitor at the pin.` },
          { id: "b", text: "The ADC is broken and needs replacing.", correct: false, feedback: `The behaviour follows the input impedance exactly; it is the sample time.` },
          { id: "c", text: "The two channels are shorted on the PCB.", correct: false, feedback: `A short would give the same reading regardless of sample time; a longer sample time changes this one.` },
          { id: "d", text: "The reference is noisy.", correct: false, feedback: `Reference noise adds jitter to both channels; it does not copy one channel's value into the other.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "multi",
        id: "averaging-limits",
        skill: "adc",
        objective: "Know what averaging can fix.",
        prompt: `Select **every** error that averaging more samples reduces.`,
        options: [
          { id: "a", text: "Quantisation noise and the ADC's white noise.", correct: true, feedback: `Uncorrelated: reduced by √n.` },
          { id: "b", text: "A ±1 % reference accuracy error.", correct: false, feedback: `Systematic gain error; calibrate or use a better reference.` },
          { id: "c", text: "Reference ripple at a frequency near the sample rate.", correct: false, feedback: `Correlated and aliased into a slow wander; averaging does not remove it. Filter the reference.` },
          { id: "d", text: "Thermal noise from a high-value source resistor, if the sample time is adequate.", correct: true, feedback: `White and uncorrelated, so √n applies.` },
          { id: "e", text: "A reading that is low because the sample time is too short.", correct: false, feedback: `Systematic; only a longer sample time or a lower source impedance fixes it.` },
        ],
        solvedFeedback: `Right. Averaging buys √n on uncorrelated noise and nothing on systematic or correlated errors.`,
      },
    },
    {
      type: "interview",
      questionId: "adc-noise-budget",
      intro: `Start with LSB arithmetic, then the three error sources, then the sample-time rule, then what averaging can and cannot do. End with the fix order.`,
    },
    {
      type: "recap",
      summary: `- 1 LSB = V_ref ÷ 2^N; quantisation noise LSB ÷ √12 rms; resolution is not accuracy.
- The reference's accuracy, drift and noise appear in every conversion; a supply rail as reference carries the board's ripple.
- SAR ADCs need the sample time matched to the source impedance; too short reads low and copies the previous channel.
- Averaging reduces uncorrelated noise by √n and does nothing for systematic or correlated errors; oversampling adds bits only when the noise dithers the codes.
- Fix order: sample time, reference quality and decoupling, calibration, then averaging.`,
      cards: [
        { id: "adc-1", front: "1 LSB for 12 bits and 3.3 V? and 2.5 V?", back: "3.3 ÷ 4096 = 0.806 mV; 2.5 ÷ 4096 = 0.610 mV. Quantisation noise is LSB ÷ √12 rms." },
        { id: "adc-2", front: "Why does a second ADC channel read the first channel's value?", back: "Sample time too short for the source impedance: the sampling capacitor keeps part of the previous channel's charge. Lengthen the sample time, buffer, or add a capacitor at the pin." },
        { id: "adc-3", front: "What can averaging not fix?", back: "Systematic errors (reference accuracy, gain, offset, short sample time) and correlated noise (reference ripple aliased into a wander). It reduces only uncorrelated noise, by √n." },
        { id: "adc-4", front: "Why not use the 3.3 V rail as the ADC reference?", back: "Its ripple and the board's digital noise enter every conversion and are correlated sample to sample; a dedicated reference IC with local decoupling, or at least a filtered rail, is needed for accuracy." },
      ],
    },
  ],
};
