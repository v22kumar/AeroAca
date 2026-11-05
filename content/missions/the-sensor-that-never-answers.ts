import type { Mission } from "@/lib/content/schema";

export const theSensorThatNeverAnswers: Mission = {
  slug: "the-sensor-that-never-answers",
  moduleId: "interfaces",
  title: "The sensor that never answers",
  summary: "A temperature sensor NACKs every transaction. Use idle levels, one capture and a bus scan to find out why, without swapping a single part.",
  durationMinutes: 10,
  budgetMinutes: 30,
  relatedLesson: "i2c-sensor-not-acknowledging",
  scenario: `**Board:** an STM32-based sensor node with a TMP102 temperature sensor on I2C1 (PB8 = SCL, PB9 = SDA), 4.7 kΩ pull-ups to 3.3 V, bus at 100 kHz.

**Firmware:** \`HAL_I2C_Mem_Read(&hi2c1, TMP102_ADDR, 0x00, I2C_MEMADD_SIZE_8BIT, buf, 2, 100)\` returns \`HAL_ERROR\` with the acknowledge-failure flag set, on every call, on every one of five boards.

**Observed:** the rest of the firmware runs normally; the UART log prints "TMP102 read failed" once a second.

Every reading below is **simulated for this mission**. It is written to be realistic but is not data from real hardware.

Find the cause with evidence and propose a fix that also tells you how the mistake got there.`,
  goal: `Explain the NACK with a measured chain of evidence and choose a fix that aligns hardware and firmware rather than papering over one of them.`,
  actions: [
    {
      id: "idle-levels",
      label: "Measure SDA and SCL idle levels",
      category: "measure",
      costMinutes: 2,
      assessment: "key",
      result: `SDA **3.28 V**, SCL **3.28 V** with the bus idle.`,
      assessmentNote: `Two seconds of work that eliminates missing pull-ups, shorts and a stuck slave in one go. The physical bus is plausible.`,
      evidence: "idle-ok",
    },
    {
      id: "sensor-supply",
      label: "Measure V+ and ground at the sensor pins",
      category: "measure",
      costMinutes: 2,
      assessment: "useful",
      result: `V+ **3.29 V**. Sensor GND to MCU GND: **0.1 Ω**.`,
      assessmentNote: `A device cannot acknowledge without power and a return path. Cheap to check, and modules on cables fail here constantly.`,
      evidence: "supply-ok",
    },
    {
      id: "capture",
      label: "Capture one transaction on the scope or logic analyser",
      category: "scope",
      costMinutes: 6,
      assessment: "key",
      result: `Clean START. Nine clock pulses with sharp edges. The first byte decodes as **0x90** (7-bit address 0x48, write). On the ninth clock SDA stays **high**: NACK. The master then issues STOP. No clock stretching, no runt pulses.`,
      assessmentNote: `This single capture settles three questions: the master is driving the bus correctly, the address on the wire really is 0x48, and the edges are clean so timing is not the problem. Whatever is wrong, it is "nobody answers at 0x48".`,
      evidence: "wire-0x48",
    },
    {
      id: "bus-scan",
      label: "Run an I2C bus scan from firmware (0x08 to 0x77)",
      category: "firmware",
      costMinutes: 4,
      assessment: "key",
      result: `Exactly one device acknowledges, at **0x49**.`,
      assessmentNote: `The decisive observation. A device exists, it is powered, it talks, and it is not at the address the firmware uses.`,
      evidence: "device-at-0x49",
    },
    {
      id: "add0-strap",
      label: "Check how the sensor's ADD0 pin is strapped",
      category: "inspect",
      costMinutes: 3,
      requiresAnyOf: ["bus-scan", "datasheet-table"],
      assessment: "key",
      result: `ADD0 is connected to **V+** through a 0 Ω link. The schematic note next to it says "0x48", but the TMP102 datasheet address table gives: GND → 0x48, **V+ → 0x49**, SDA → 0x4A, SCL → 0x4B.`,
      assessmentNote: `Root cause located: the schematic comment and the strap disagree, and the firmware author trusted the comment. All five boards are built the same way, which is why all five fail.`,
      evidence: "strap-v+",
    },
    {
      id: "datasheet-table",
      label: "Read the TMP102 address-selection table",
      category: "document",
      costMinutes: 3,
      assessment: "useful",
      result: `The TMP102 has four addresses chosen by ADD0: GND 0x48, V+ 0x49, SDA 0x4A, SCL 0x4B.`,
      assessmentNote: `Good preparation. It tells you what to look for on the board, and it is the reference a reviewer will ask for.`,
      evidence: "table-known",
    },
    {
      id: "hal-shift",
      label: "Review how the firmware builds the HAL address argument",
      category: "firmware",
      costMinutes: 3,
      assessment: "useful",
      result: `\`#define TMP102_ADDR (0x48 << 1)\`. The shift is present and correct for the STM32 HAL.`,
      assessmentNote: `The 7-bit versus 8-bit mix-up is the most common I2C firmware bug, so ruling it out is sensible. The capture already showed 0x90 on the wire, which proves the same thing.`,
      evidence: "shift-ok",
    },
    {
      id: "pullup-values",
      label: "Measure the pull-up resistor values",
      category: "measure",
      costMinutes: 3,
      assessment: "neutral",
      result: `4.7 kΩ on SDA and 4.7 kΩ on SCL, to 3.3 V.`,
      assessmentNote: `Correct values, but the idle levels and the clean edges in a capture already told you the pull-ups were fine. Low information for the time.`,
    },
    {
      id: "slow-bus",
      label: "Drop the bus speed from 100 kHz to 10 kHz and retry",
      category: "firmware",
      costMinutes: 5,
      assessment: "neutral",
      result: `Still NACK on every transaction.`,
      assessmentNote: `A reasonable experiment on a bus with slow edges or long cables. Here the edges were clean, so it was unlikely to help, and it did not.`,
    },
    {
      id: "swap-sensor",
      label: "Replace the sensor with a new TMP102",
      category: "rework",
      costMinutes: 25,
      assessment: "wasteful",
      result: `Still NACK. The new part is strapped exactly like the old one.`,
      assessmentNote: `Twenty-five minutes of hot air to confirm that a part which was already acknowledging at 0x49 works. Five boards failing identically should have argued against a component fault from the start.`,
    },
    {
      id: "lower-pullups",
      label: "Change the pull-ups to 2.2 kΩ",
      category: "rework",
      costMinutes: 12,
      assessment: "wasteful",
      result: `Edges get slightly faster. Still NACK.`,
      assessmentNote: `Rework without a hypothesis. Nothing measured pointed at rise time.`,
    },
  ],
  diagnoses: [
    {
      id: "pullups",
      label: "The pull-ups are missing or the wrong value",
      correct: false,
      feedback: `Both lines idle at 3.28 V and the capture showed clean edges. The pull-ups are doing their job. A pull-up problem would have shown itself before the first address byte was even complete.`,
    },
    {
      id: "dead-sensor",
      label: "The sensor is dead on all five boards",
      correct: false,
      feedback: `A device acknowledges at 0x49 on the same bus, with the same supply. Five identical failures from a batch point to a design or documentation error, not five dead parts.`,
    },
    {
      id: "address-mismatch",
      label: "ADD0 is strapped to V+, so the sensor lives at 0x49 while the firmware addresses 0x48",
      correct: true,
      requiresEvidence: ["device-at-0x49", "strap-v+"],
      feedback: `Correct, and the chain of evidence is complete: the wire shows 0x48 being asked, the scan shows a device at 0x49, the strap and the datasheet table explain why. The schematic comment was wrong and nobody checked it against the table.`,
    },
    {
      id: "hal-unshifted",
      label: "The firmware passes an unshifted 7-bit address to the HAL",
      correct: false,
      feedback: `The macro includes the shift, and the capture shows 0x90 on the wire, which is the correctly shifted write form of 0x48. The firmware is sending exactly what it was told to send; what it was told is wrong.`,
    },
    {
      id: "too-fast",
      label: "The bus speed is too high for the wiring",
      correct: false,
      feedback: `100 kHz on a short board with 4.7 kΩ pull-ups is conservative, the captured edges were sharp, and slowing to 10 kHz changed nothing. Timing is not the cause.`,
    },
  ],
  fixes: [
    {
      id: "align-and-document",
      label: "Agree the intended address with the hardware owner, align the firmware constant with the strap, correct the schematic note, and add a bus scan to the bring-up checklist",
      quality: "best",
      feedback: `This fixes the boards in front of you, fixes the document that caused the error, and adds the cheap check that would have caught it in minutes. That is what "root cause" means in a review.`,
    },
    {
      id: "firmware-0x49",
      label: "Change the firmware constant to 0x49 and ship",
      quality: "acceptable",
      feedback: `The boards will work. But the schematic still says 0x48, so the next person to read it will reintroduce the bug, and nobody has decided whether V+ was the *intended* strap. Fix the artefact that lied.`,
    },
    {
      id: "move-jumper",
      label: "Move the 0 Ω link on every board so ADD0 goes to GND",
      quality: "wrong",
      feedback: `Reworking five boards by hand to match a comment that may itself be wrong is the most expensive option and still leaves the schematic and firmware unreviewed. Hardware rework is the last resort when a one-line firmware change and a document fix resolve the mismatch.`,
    },
  ],
  optimalPath: ["idle-levels", "capture", "bus-scan", "add0-strap"],
  debrief: `Four actions, fifteen bench-minutes. Idle levels cleared the physical layer. One capture proved the master was asking for 0x48 correctly and nobody was answering. The scan found who *was* answering. The strap and the datasheet table explained the gap.

Notice what was never needed: new parts, new resistors, a slower bus. The symptom "NACK on every board from a batch" was already a strong hint that the cause was systematic, and systematic causes live in documents and configuration, not in individual components.

The habit to take away is to look at the wire before touching anything. A logic analyser capture of a failing I2C transaction is the single most informative five minutes in embedded debugging.`,
  references: [
    { title: "TMP102 datasheet, address selection table", id: "SBOS397", url: "https://www.ti.com/lit/ds/symlink/tmp102.pdf" },
    { title: "I2C-bus specification and user manual", id: "UM10204", url: "https://www.nxp.com/docs/en/user-guide/UM10204.pdf" },
  ],
};
