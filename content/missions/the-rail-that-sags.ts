import type { Mission } from "@/lib/content/schema";

export const theRailThatSags: Mission = {
  slug: "the-rail-that-sags",
  moduleId: "fundamentals",
  title: "The rail that sags",
  summary: "A sensor resets whenever the radio transmits. The regulator reads perfectly. Find where the volts go, with a scope at the load, and fix the path rather than the regulator.",
  durationMinutes: 10,
  budgetMinutes: 35,
  whyItMatters: "Power faults that hide from a multimeter are the most common 'mystery reset'. The engineer who measures at the load under load, and who can turn a trace into an I × R number, fixes this in an hour instead of a week.",
  relatedLesson: "reading-a-power-tree",
  scenario: `**Board:** a sensor node with a 3.3 V buck regulator rated 1 A. The MCU and a temperature sensor sit near the regulator; a radio module sits 40 cm away at the end of a thin trace and a two-pin connector, with a 100 nF capacitor at its supply pin and nothing else.

**Symptom:** every time the radio transmits (20 ms bursts, 800 mA), the temperature sensor, which shares the rail and sits on the same far branch, resets and reports a power-on value. The multimeter at the regulator output reads 3.31 V before, during and after bursts.

Every reading below is **simulated for this mission**, written to be realistic; it is not data from real hardware.

Find where the voltage goes and choose a fix that addresses the path.`,
  goal: `Show with a scope measurement at the load that the rail sags during the burst, attribute the sag to I × R in the trace and connector plus missing bulk capacitance, and choose a fix that corrects the path.`,
  actions: [
    {
      id: "meter-regulator",
      label: "Multimeter at the regulator output during a burst",
      category: "measure",
      costMinutes: 2,
      assessment: "neutral",
      result: `3.31 V, steady. The meter's averaging cannot see a 20 ms event.`,
      assessmentNote: `Confirms the regulator is in regulation and that this instrument cannot see the fault. Cheap, but not evidence about the load.`,
    },
    {
      id: "scope-load",
      label: "Scope the sensor's supply pin, triggered on the radio's TX line",
      category: "scope",
      costMinutes: 5,
      assessment: "key",
      result: `Rail at the sensor drops from 3.28 V to 2.90 V within 50 µs of TX asserting, stays there for the 20 ms burst, then overshoots to 3.45 V and rings for 300 µs. The sensor's brown-out threshold is 2.95 V.`,
      assessmentNote: `The decisive measurement: at the load, under load, with the scope. The sag crosses the sensor's brown-out level; the recovery shows the path's inductance and the lack of local bulk capacitance.`,
      evidence: "sag-at-load",
    },
    {
      id: "scope-regulator",
      label: "Scope the regulator output pin during a burst",
      category: "scope",
      costMinutes: 3,
      assessment: "useful",
      result: `Dips 40 mV for 20 µs at the burst edge, then recovers. In regulation throughout.`,
      assessmentNote: `Rules out the regulator with the right instrument, and localises the loss to the path between regulator and load.`,
      evidence: "regulator-ok",
    },
    {
      id: "measure-path",
      label: "Measure the DC resistance of the trace and connector from regulator to radio branch",
      category: "measure",
      costMinutes: 4,
      assessment: "key",
      result: `0.42 Ω end to end (four-wire measurement): 0.31 Ω of trace, 0.11 Ω across the connector. 0.42 Ω × 0.8 A = 0.34 V.`,
      assessmentNote: `Turns the sag into arithmetic: I × R matches the measured dip. This is the number that goes in the report.`,
      evidence: "path-resistance",
    },
    {
      id: "swap-regulator",
      label: "Replace the buck regulator with a 2 A part",
      category: "rework",
      costMinutes: 8,
      assessment: "wasteful",
      result: `No change. The sag at the sensor is identical; the regulator was never the limit.`,
      assessmentNote: `The regulator was shown in regulation. More current capability does not reduce the drop across 0.42 Ω.`,
    },
    {
      id: "raise-setpoint",
      label: "Raise the regulator output to 3.6 V so the sag lands above 3.0 V",
      category: "firmware",
      costMinutes: 3,
      assessment: "risky",
      result: `The sensor stops resetting during bursts. Between bursts the sensor and the MCU now sit at 3.58 V; the sensor's absolute maximum supply is 3.6 V.`,
      assessmentNote: `Fixes the symptom by running every part at its absolute-maximum rating all day. A warm day or a regulator tolerance pushes it over.`,
    },
    {
      id: "add-bulk",
      label: "Add a 47 µF capacitor at the radio's supply pin and re-scope",
      category: "rework",
      costMinutes: 4,
      requiresAnyOf: ["scope-load"],
      assessment: "key",
      result: `Dip at the sensor reduced to 3.12 V; recovery ringing gone. Still 160 mV of steady sag for the burst length, from the trace.`,
      assessmentNote: `Confirmation by fix for the capacitance half: the burst's edge is supplied locally. The remaining sag is the DC I × R, which only a lower-resistance path removes.`,
      evidence: "bulk-helps",
    },
    {
      id: "widen-trace",
      label: "Bodge a 1 mm² wire in parallel with the trace and bypass the connector pins",
      category: "rework",
      costMinutes: 5,
      requiresAnyOf: ["measure-path"],
      assessment: "useful",
      result: `Path resistance 0.08 Ω. Sag at the sensor 3.21 V with the bulk capacitor fitted. Sensor no longer resets over 1 000 bursts.`,
      assessmentNote: `Confirms the I × R half. On the next board revision this is a wider trace and a better connector; on this one it is the bodge that proves the diagnosis.`,
      evidence: "path-fixed",
    },
    {
      id: "firmware-retry",
      label: "Add firmware to re-initialise the sensor after every radio burst",
      category: "firmware",
      costMinutes: 6,
      assessment: "risky",
      result: `Readings resume after each burst, 80 ms late. The MCU, on the same rail, also sees 3.05 V during bursts and is 50 mV from its own brown-out level.`,
      assessmentNote: `Hides the symptom and leaves the MCU one tolerance away from resetting too. The rail is the fault, not the sensor's reaction to it.`,
    },
  ],
  diagnoses: [
    {
      id: "ir-drop",
      label: "The rail sags at the load during bursts: I × R across the thin trace and connector (0.42 Ω × 0.8 A ≈ 0.34 V) with no bulk capacitance at the load to supply the burst edge",
      correct: true,
      requiresEvidence: ["sag-at-load", "path-resistance"],
      feedback: `Correct. The scope at the load shows the sag below the sensor's brown-out level; the measured path resistance makes it arithmetic; the regulator was in regulation throughout.`,
    },
    {
      id: "regulator-weak",
      label: "The regulator cannot supply the burst current",
      correct: false,
      feedback: `The regulator's own output dips only 40 mV and a 2 A part changed nothing. The loss is in the path.`,
    },
    {
      id: "sensor-fault",
      label: "The sensor is defective and resets spontaneously",
      correct: false,
      feedback: `The resets are synchronised with TX and the rail at the sensor crosses its brown-out threshold. The sensor is doing what its datasheet says it does at 2.9 V.`,
    },
    {
      id: "radio-noise",
      label: "RF from the radio is coupling into the sensor",
      correct: false,
      feedback: `The scope shows a DC sag of the exact I × R magnitude for the exact burst length, not RF pickup. Coupling would not produce 0.34 V of DC drop.`,
    },
  ],
  fixes: [
    {
      id: "path-and-bulk",
      label: "Add bulk capacitance at the radio (47 µF) and lower the path resistance (wider trace, better connector or a dedicated feed) on the next revision; bodge both now to prove it",
      quality: "best",
      feedback: `Both halves addressed: the burst edge is supplied locally and the DC drop is removed. The scope at the load is the acceptance test.`,
    },
    {
      id: "bulk-only",
      label: "Add the 47 µF capacitor at the radio and ship",
      quality: "acceptable",
      feedback: `Stops the resets with margin of about 170 mV. The 0.42 Ω path still drops 0.34 V in DC terms during long bursts, which a longer transmission or a warmer connector will expose.`,
    },
    {
      id: "setpoint",
      label: "Raise the regulator setpoint to 3.6 V",
      quality: "wrong",
      feedback: `Runs every part at its absolute maximum between bursts to hide a resistance problem. The risky action showed why.`,
    },
  ],
  optimalPath: ["scope-load", "measure-path", "add-bulk"],
  debrief: `Three actions, thirteen minutes. The scope at the load, triggered on the burst, saw what the multimeter at the regulator could not; the four-wire resistance turned the dip into I × R; the capacitor at the load confirmed the fix by halves.

The traps were a bigger regulator (the regulator was never the limit), a higher setpoint (hides the drop by overstressing everything) and a firmware retry (hides the reset and leaves the MCU next). None measured the path.

In an interview: "measure at the load, under load, with the scope; sag equals I × R; bulk capacitance at the load for the edge, a lower-resistance path for the DC".`,
  references: [
    { title: "Texas Instruments SLVA079 and vendor layout guidance on supply traces and remote loads", note: "Bulk capacitance placement and trace resistance." },
  ],
};
