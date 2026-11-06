import type { Mission } from "@/lib/content/schema";

export const twoBoardsOneBusNoAgreement: Mission = {
  slug: "two-boards-one-bus-no-agreement",
  moduleId: "integration",
  title: "Two boards, one bus, no agreement",
  summary: "A sensor board and a controller both pass their own tests and fail together. Find the integration fault on the wire and fix the contract, not the symptom.",
  durationMinutes: 10,
  budgetMinutes: 35,
  whyItMatters: "This is the classic integration failure: two correct subsystems and a wrong assumption between them. The method, capture the bytes and compare them to the document, is the same for serial links, CAN, and network messages in every industry.",
  relatedLesson: "interface-control-and-integration-faults",
  scenario: `**System:** a temperature sensor board sends a 6-byte frame every 100 ms over an RS-485 link to a controller board: \`[0xAA][ID][T_hi][T_lo][CRC_hi][CRC_lo]\`. ICD rev 1.2: temperature is 16-bit signed, **big-endian**, 0.01 °C per LSB; CRC-16 over bytes 1 to 3.

**Sensor team:** unit test passes, reference thermometer agreement ±0.2 °C.
**Controller team:** parser unit test passes, every frame's CRC verifies, values logged.

**Observed together:** at 25 °C the controller logs **501.85 °C**; with the sensor in an ice bath it logs **0.00 °C**... then **-0.26 °C**, then **-256.26 °C** as the bath warms slightly.

Every reading below is **simulated for this mission**, written to be realistic; it is not data from real hardware.

Find the fault with evidence and fix the contract between the teams.`,
  goal: `Identify the integration fault from the bytes on the wire, name which side departs from the ICD, and choose a fix that corrects the contract and adds a test that would have caught it.`,
  actions: [
    {
      id: "capture-frame",
      label: "Capture one frame on the logic analyser and list the bytes",
      category: "scope",
      costMinutes: 5,
      assessment: "key",
      result: `At 25.0 °C (reference thermometer beside the sensor): \`AA 01 09 C4 7B 3D\`. CRC verifies. Bytes 2 and 3 are \`09 C4\`.`,
      assessmentNote: `The decisive evidence. 0x09C4 read big-endian is 2 500 → 25.00 °C, exactly the reference. The sensor is sending what the ICD says.`,
      evidence: "wire-bytes",
    },
    {
      id: "read-icd",
      label: "Read ICD rev 1.2, temperature field definition",
      category: "document",
      costMinutes: 3,
      assessment: "useful",
      result: `"Bytes 2–3: temperature, int16, big-endian (MSB first), 0.01 °C/LSB, valid −4000 to 12500, 0x8000 = invalid."`,
      assessmentNote: `The contract. Every later check is against this line.`,
      evidence: "icd-read",
    },
    {
      id: "controller-parser",
      label: "Read the controller's parsing code",
      category: "firmware",
      costMinutes: 4,
      assessment: "key",
      result: `\`int16_t t = buf[2] | (buf[3] << 8);\` followed by \`float celsius = t / 100.0f;\`. That is little-endian assembly: 0x09 | (0xC4 << 8) = 0xC409 = 50 185 → 501.85 °C.`,
      assessmentNote: `Root cause located and the number explained exactly. The ice-bath readings follow too: 0x0000 → 0; 0xFFE6 (−0.26 °C) read as 0xE6FF = −6401 → −64.01... and \`FF 00\` style pairs produce the −256 step. The controller departs from the ICD.`,
      evidence: "parser-little-endian",
    },
    {
      id: "sensor-code",
      label: "Read the sensor's frame-building code",
      category: "firmware",
      costMinutes: 4,
      assessment: "useful",
      result: `\`frame[2] = raw >> 8; frame[3] = raw & 0xFF;\` MSB first, matching the ICD.`,
      assessmentNote: `Confirms the sender honours the contract. Together with the capture it isolates the fault to the receiver.`,
      evidence: "sensor-ok",
    },
    {
      id: "crc-check",
      label: "Verify the CRC on captured frames by hand",
      category: "document",
      costMinutes: 3,
      assessment: "useful",
      result: `CRC-16 over \`01 09 C4\` = 0x7B3D, matching the frame.`,
      assessmentNote: `A passing CRC says the bytes arrived intact, so the fault is interpretation, not the link. A good reason to stop suspecting noise and termination.`,
      evidence: "crc-ok",
    },
    {
      id: "negative-test",
      label: "Put the sensor in the ice bath and capture a frame",
      category: "scope",
      costMinutes: 5,
      assessment: "useful",
      result: `At −0.26 °C: \`AA 01 FF E6 ...\`. 0xFFE6 as int16 = −26 → −0.26 °C. The controller logs −64.01 °C... wait, with its little-endian read: 0xE6FF = −6401 → −64.01 °C. The scenario's drifting negatives are the parser reading swapped bytes of small negative numbers.`,
      assessmentNote: `Negative and near-zero values are where byte-order and sign errors show their shape. The capture matches the ICD again.`,
      evidence: "negative-captured",
    },
    {
      id: "swap-sensor",
      label: "Swap in a second sensor board",
      category: "rework",
      costMinutes: 6,
      assessment: "neutral",
      result: `Identical readings. Both sensor boards send \`09 C4\` at 25 °C.`,
      assessmentNote: `Rules out one sensor, but the capture had already shown the sender was correct. Low information for the time.`,
    },
    {
      id: "check-termination",
      label: "Check RS-485 termination and bias resistors",
      category: "measure",
      costMinutes: 4,
      assessment: "neutral",
      result: `120 Ω at both ends; bias resistors fitted. Signal clean on the scope.`,
      assessmentNote: `Reasonable on a new link, but every CRC was passing, which already said the link delivered the bytes intact.`,
    },
    {
      id: "fudge-scaling",
      label: "Adjust the controller's scaling constant until 25 °C reads 25 °C",
      category: "firmware",
      costMinutes: 8,
      assessment: "risky",
      result: `Dividing by 2007.4 instead of 100 makes 25 °C read 25.00. 30 °C then reads 2.00 °C and the ice bath reads 0.00 then −31.9.`,
      assessmentNote: `A fudge factor that fits one point is the integration equivalent of lengthening a watchdog: it hides the fault at the value you tested and corrupts every other value.`,
    },
    {
      id: "change-icd",
      label: "Ask the sensor team to switch to little-endian so the controller works as written",
      category: "document",
      costMinutes: 5,
      assessment: "wasteful",
      result: `The sensor team points out that three other consumers of this frame implement the ICD correctly and would break.`,
      assessmentNote: `The ICD is the contract; the side that departs from it changes. Changing the contract to match one bug multiplies the fault.`,
    },
  ],
  diagnoses: [
    {
      id: "byte-order",
      label: "The controller's parser assembles the temperature little-endian; the ICD and the sensor are big-endian",
      correct: true,
      requiresEvidence: ["wire-bytes", "parser-little-endian"],
      feedback: `Correct. 0x09C4 → 25.00 °C on the wire; the parser's \`buf[2] | (buf[3] << 8)\` reads it as 0xC409 → 501.85 °C. The sensor honours the ICD; the controller does not.`,
    },
    {
      id: "sensor-faulty",
      label: "The sensor board is sending wrong values",
      correct: false,
      feedback: `The captured bytes decode to exactly the reference temperature under the ICD's definition, and a second sensor behaves identically. The sender is correct.`,
    },
    {
      id: "bus-noise",
      label: "RS-485 noise or termination is corrupting frames",
      correct: false,
      feedback: `Every CRC verifies and the scope shows clean signals. Corruption would fail CRCs randomly, not produce a stable, structured wrong number.`,
    },
    {
      id: "scaling",
      label: "The scaling factor in the ICD is wrong",
      correct: false,
      feedback: `A scaling error gives a constant ratio. 25 → 501.85 and −0.26 → −64.01 are not one ratio; they are byte swaps.`,
    },
    {
      id: "ground",
      label: "The two boards do not share a ground",
      correct: false,
      feedback: `A ground problem gives intermittent corruption and failed CRCs, not reproducible structured values.`,
    },
  ],
  fixes: [
    {
      id: "fix-parser-and-test",
      label: "Fix the parser to the ICD's big-endian int16, add golden-frame unit tests (09 C4 → 2500, FF E6 → −26, 80 00 → invalid) and an integration test against a reference thermometer",
      quality: "best",
      feedback: `The side that departed from the contract is corrected, the golden frames pin the byte order and the sign for ever, and the reference-thermometer test is the across-the-interface check that was missing.`,
    },
    {
      id: "fix-parser-only",
      label: "Fix the parser's byte order and ship",
      quality: "acceptable",
      feedback: `It fixes this fault. Without the golden-frame tests the next refactor can reintroduce it, and without the reference test the next field with a scaling error ships the same way.`,
    },
    {
      id: "fudge",
      label: "Keep the parser and adjust the scaling constant so the bench reading is right",
      quality: "wrong",
      feedback: `A constant that fits one point and corrupts every other, as the risky action demonstrated. It also leaves the parser disagreeing with the ICD for the next person.`,
    },
  ],
  optimalPath: ["capture-frame", "read-icd", "controller-parser"],
  debrief: `Three actions, twelve minutes. One capture compared against one line of the ICD located the fault; one look at the parser explained the exact number. The CRC passing told you not to waste time on termination and noise.

The two traps were tempting because they both "work" on the bench: a fudge factor fits 25 °C, and changing the ICD fits one consumer. Both corrupt the contract. The rule: the side that departs from the document changes, and a golden frame goes into its tests so it cannot depart again.

In an interview, the story is "two passing units, one failing system, bytes on the wire versus the document, fix the departure, add the test that was missing".`,
  references: [
    { title: "NASA Mars Climate Orbiter Mishap Investigation Board report (1999)", note: "The units-mismatch integration failure; the same class of fault as this mission." },
  ],
};
