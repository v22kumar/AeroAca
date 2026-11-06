import type { Lesson } from "@/lib/content/schema";

export const i2cSensorNotAcknowledging: Lesson = {
  slug: "i2c-sensor-not-acknowledging",
  moduleId: "interfaces",
  prerequisites: ["mcu-board-does-not-boot"],
  title: "I2C sensor not acknowledging",
  summary: "A NACK is the bus telling you exactly one thing. Learn to read it, and to separate supply, pull-up, address, timing and firmware causes with a meter and a scope.",
  durationMinutes: 10,
  whyItMatters: "Almost every product has a sensor on I2C, and almost every engineer has lost a day to one that would not answer. Being the person who finds it in ten minutes with a meter and one capture is a reputation worth having.",
  objectives: [
    "Explain how an I2C transaction is built, including the address byte and the acknowledge bit.",
    "Distinguish a wiring or pull-up fault from an addressing or firmware fault using idle levels and one scope capture.",
    "Convert between 7-bit and 8-bit address conventions without error, including the STM32 HAL convention.",
  ],
  review: {
    status: "technically-reviewed",
    note: "Bus behaviour follows the NXP I2C-bus specification (UM10204). Sensor addressing uses the TI TMP102 as a concrete example. Scope captures in the visual are illustrative drawings, not measurements.",
  },
  references: [
    {
      title: "I2C-bus specification and user manual",
      id: "UM10204",
      url: "https://www.nxp.com/docs/en/user-guide/UM10204.pdf",
      note: "Timing, rise-time limits (1000 ns standard mode, 300 ns fast mode), bus capacitance limit (400 pF) and pull-up sizing.",
    },
    {
      title: "TMP102 low-power digital temperature sensor datasheet",
      id: "SBOS397",
      url: "https://www.ti.com/lit/ds/symlink/tmp102.pdf",
      note: "Address selection by the ADD0 pin: GND 0x48, V+ 0x49, SDA 0x4A, SCL 0x4B.",
    },
    {
      title: "STM32F4 HAL I2C driver description",
      note: "HAL functions take DevAddress as the 7-bit address shifted left by one (bit 0 is the R/W position). See the HAL driver user manual for your series (UM1725 for STM32F4).",
    },
  ],
  steps: [
    {
      type: "scenario",
      title: "HAL_ERROR, every time",
      body: `The temperature sensor on a new sensor node never answers. \`HAL_I2C_Mem_Read()\` returns \`HAL_ERROR\` on every call, and the error code says acknowledge failure. The sensor is a TMP102, the firmware uses address 0x48, and the schematic shows 4.7 kΩ pull-ups.

Three engineers have three theories: the pull-ups are wrong, the sensor is dead, the HAL is "weird about addresses". All three are guesses. In ten minutes you will know how to replace them with two measurements and one capture.`,
    },
    {
      type: "concept",
      title: "What a NACK actually says",
      body: `I2C has two wires, **SDA** (data) and **SCL** (clock), both **open-drain**: devices can only pull a line low; resistors pull it high. Idle, both lines sit at VDD.

A transaction is: **START** (SDA falls while SCL is high) → the **address byte** → an **ACK** bit → data bytes, each followed by an ACK bit → **STOP** (SDA rises while SCL is high).

The address byte is the device's **7-bit address shifted left by one**, with the **R/W bit** in bit 0 (0 = write, 1 = read). For a TMP102 at 0x48 the first byte on the wire is 0x90 for a write and 0x91 for a read.

After each byte the *receiver* acknowledges by pulling SDA low during the ninth clock pulse. If nobody pulls it low, SDA stays high: that is a **NACK**.

A NACK after the **address byte** means exactly this: *no powered, functioning device on this bus recognised that address at that moment.* It does not say why. The causes split into three groups:

- **Physical.** Sensor not powered, missing ground, SDA/SCL not connected, missing pull-ups, a device holding a line low.
- **Addressing.** Firmware sends an address the sensor is not configured for (address pins, 7-bit vs 8-bit confusion).
- **Timing or state.** Bus too fast for the wiring, clock stretching not honoured, sensor in shutdown or still in its power-on reset.`,
      deeper: {
        title: "Pull-ups, capacitance and rise time",
        body: `The pull-up resistor and the total bus capacitance form an RC rise. The I2C specification limits rise time to 1000 ns in standard mode (100 kHz) and 300 ns in fast mode (400 kHz), with bus capacitance up to 400 pF.

Smaller resistors give faster edges but more current when a device pulls low (3.3 V / 2.2 kΩ ≈ 1.5 mA per line) and must stay within each device's sink capability (3 mA minimum per the spec). Larger resistors save power but produce slow "shark-fin" rising edges on long cables that can corrupt the ninth clock, so the master reads a NACK that the slave actually sent as an ACK.

Typical values: 4.7 kΩ at 100 kHz on a short board; 2.2 kΩ at 400 kHz or with longer wiring. If several modules each carry their own pull-ups, the parallel combination can get too small.`,
      },
    },
    {
      type: "visual",
      title: "Address byte and the ninth clock",
      visual: "i2c-waveform",
      body: `Change the 7-bit address and the direction, and watch the first byte on the wire. Toggle whether a device answers to see the difference between ACK and NACK on the ninth clock.`,
      caption: `Illustrative waveform, not a measurement. The ninth bit is driven by the receiver: low means ACK, high means NACK.`,
    },
    {
      type: "concept",
      title: "Two measurements and one capture",
      body: `**1. Idle levels with a multimeter.** With the bus idle, SDA and SCL should both read VDD (3.3 V here).
- Both at 0 V, or one at 0 V: no pull-ups, a shorted line, or a device holding the line low (a slave stuck mid-byte after a glitch; clocking SCL nine times with SDA released usually frees it).
- Both at VDD: the physical bus is at least plausible.

**2. Supply and ground at the sensor pins.** Measure V+ at the sensor, and the resistance between sensor GND and MCU GND. Modules on cables lose grounds constantly. A sensor whose supply is below its minimum will not acknowledge.

**3. One scope or logic-analyser capture of a transaction.** This is the measurement that decides between addressing and firmware causes:
- No activity at all: the master is not driving the bus. Check the peripheral clock is enabled, the pins are configured as alternate-function open-drain, and the right I2C instance is used.
- Clean START, nine clocks, SDA high on the ninth: a genuine NACK. Now decode the first byte. If it is 0x90, the master is asking for 0x48 correctly, and the question becomes *why does nothing answer at 0x48*.
- First byte 0x48 instead of 0x90: the firmware passed an unshifted address to a driver that expects a shifted one. On STM32 HAL, \`DevAddress\` must be \`0x48 << 1\`.
- Slow, curved rising edges: pull-ups too large or bus capacitance too high for the chosen speed.

**4. Bus scan.** Loop over addresses 0x08 to 0x77, send the address byte, and list those that ACK. A sensor answering at 0x49 when firmware expects 0x48 is the end of the investigation: on a TMP102 the ADD0 pin tied to V+ selects 0x49.`,
    },
    {
      type: "example",
      title: "Worked example: the STM32 HAL address",
      body: `A colleague writes:

\`\`\`c
#define TMP102_ADDR 0x48
HAL_I2C_Mem_Read(&hi2c1, TMP102_ADDR, 0x00, I2C_MEMADD_SIZE_8BIT, buf, 2, 100);
\`\`\`

On the wire the first byte is 0x48 → binary 0100 1000. The bus sees 7-bit address **0x24** with R/W = 0. Nothing lives at 0x24, so: NACK.

The fix is one shift:

\`\`\`c
#define TMP102_ADDR (0x48 << 1)   /* HAL wants the 8-bit, left-shifted form */
\`\`\`

Now the first byte is 0x90 and the sensor at 0x48 acknowledges. Many Linux and Arduino APIs take the 7-bit form instead; the only way to know is to read the driver's documentation or to look at the wire.`,
    },
    {
      type: "exercise",
      exercise: {
        kind: "single",
        id: "first-byte-0x4a",
        skill: "i2c-addressing",
        objective: "Convert a 7-bit address and direction into the byte seen on the wire.",
        prompt: `A TMP102 has ADD0 connected to SDA, which selects 7-bit address 0x4A. What is the first byte a logic analyser shows for a **read** from this device?`,
        options: [
          { id: "a", text: "0x4A", correct: false, feedback: `That is the 7-bit address itself. On the wire it is shifted left by one and the R/W bit occupies bit 0, so 0x4A never appears as the first byte of a correctly formed read.` },
          { id: "b", text: "0x94", correct: false, feedback: `0x4A << 1 = 0x94 is the **write** form (R/W = 0). A read sets bit 0, giving 0x95.` },
          { id: "c", text: "0x95", correct: true, feedback: `Correct. 0x4A << 1 = 0x94, and the read bit makes it 0x95. The analyser's decoder will typically display it as "0x4A R".` },
          { id: "d", text: "0x25", correct: false, feedback: `0x25 is 0x4A shifted the wrong way (right instead of left). Shifting right drops the lowest address bit and produces an address that does not exist on your bus.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "multi",
        id: "idle-low-causes",
        skill: "i2c-physical",
        objective: "Interpret idle-level measurements on an open-drain bus.",
        prompt: `With the bus idle, your meter shows SDA at 0.0 V and SCL at 3.3 V. Select **every** explanation that is consistent with this reading.`,
        options: [
          { id: "a", text: "A slave device is stuck holding SDA low after an interrupted transfer.", correct: true, feedback: `Consistent. A slave interrupted mid-byte can keep SDA low until it sees enough clocks to finish. Nine SCL pulses with SDA released, then a STOP, usually frees it.` },
          { id: "b", text: "The SDA pull-up resistor is missing or open.", correct: true, feedback: `Consistent. Without a pull-up, an open-drain line has nothing to raise it, so it reads at or near 0 V even with every device idle. SCL being high shows its own pull-up is fine.` },
          { id: "c", text: "Both pull-ups are missing.", correct: false, feedback: `Not consistent: SCL reads 3.3 V, so its pull-up is present. Only SDA is affected.` },
          { id: "d", text: "SDA is shorted to ground on the PCB.", correct: true, feedback: `Consistent. A solder bridge or damaged trace to ground reads exactly like this. A resistance check with power off distinguishes it from a stuck slave.` },
          { id: "e", text: "The firmware is using the wrong slave address.", correct: false, feedback: `Not consistent. A wrong address produces a NACK during a transaction, but between transactions the bus still idles high. Address errors never change the idle level.` },
        ],
        solvedFeedback: `Exactly. Idle levels diagnose the *physical* bus. SDA low while SCL is high means SDA specifically has lost its pull-up, is shorted, or is being held by a device. Addressing problems live entirely inside transactions.`,
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "numeric",
        id: "pullup-current",
        skill: "i2c-physical",
        objective: "Check that a pull-up value is compatible with device sink current.",
        prompt: `A bus runs at 3.3 V. Two modules on it each have their own 2.2 kΩ pull-ups on SDA. How much current, in mA, must a device sink to hold SDA at 0 V? Round to one decimal place.`,
        unit: "mA",
        answer: 3.0,
        tolerance: 0.1,
        solution: `Two 2.2 kΩ resistors in parallel make 1.1 kΩ. Current = 3.3 V / 1.1 kΩ = **3.0 mA**. The I2C specification only guarantees that a device can sink 3 mA, so this bus is at the limit; a third module with its own pull-ups would push it over.`,
        solvedFeedback: `Correct: 3.0 mA, right at the guaranteed minimum sink capability. Duplicate pull-ups across modules are a common reason a bus that worked with one sensor fails when a second is added.`,
        misconceptions: [
          { value: 1.5, tolerance: 0.1, feedback: `1.5 mA is the current through **one** 2.2 kΩ resistor. The two pull-ups are in parallel, so the device sinks both: 3.0 mA.` },
          { value: 0.75, tolerance: 0.05, feedback: `You treated the resistors as being in series (4.4 kΩ). Pull-ups on the same line are in parallel, which halves the resistance and doubles the current.` },
        ],
      },
    },
    {
      type: "interview",
      questionId: "i2c-nack-systematic",
      intro: `Interviewers love this one because the answer reveals whether you reason from the physical layer upward or just swap parts.`,
    },
    {
      type: "recap",
      summary: `- Both lines are open-drain and idle at VDD. Idle levels diagnose the physical bus; transactions diagnose addressing and timing.
- A NACK after the address byte means no powered, working device recognised that address. Decode the first byte to see what the master actually sent.
- 7-bit address ≪ 1, plus the R/W bit, is what appears on the wire. STM32 HAL expects the shifted form.
- Check supply and ground at the sensor pins, then capture one transaction, then run a bus scan.
- Pull-ups size the rise time; parallel pull-ups from several modules add up and can exceed the 3 mA sink guarantee.`,
      cards: [
        { id: "i2c-1", front: "First byte on the wire for a write to 7-bit address 0x48?", back: "0x90 (0x48 << 1, R/W = 0). A read is 0x91." },
        { id: "i2c-2", front: "SDA idles at 0 V, SCL at 3.3 V. Causes?", back: "SDA pull-up missing or open, SDA shorted to ground, or a slave holding SDA low after an interrupted transfer. Never a wrong address." },
        { id: "i2c-3", front: "What does a NACK after the address byte prove?", back: "No powered, functioning device on this bus recognised that address at that moment. The reason (wiring, address pins, shift error, sleep state) needs a capture or a bus scan." },
        { id: "i2c-4", front: "I2C spec limits to remember?", back: "Rise time ≤ 1000 ns (standard, 100 kHz) or ≤ 300 ns (fast, 400 kHz); bus capacitance ≤ 400 pF; devices guaranteed to sink only 3 mA." },
        { id: "i2c-5", front: "TMP102 ADD0 pin tied to V+ gives which address?", back: "0x49. GND → 0x48, SDA → 0x4A, SCL → 0x4B (per the TMP102 datasheet)." },
      ],
    },
  ],
};
