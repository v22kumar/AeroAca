import type { Lesson } from "@/lib/content/schema";

export const logicLevelsThresholdsAndOpenDrain: Lesson = {
  slug: "logic-levels-thresholds-and-open-drain",
  moduleId: "fundamentals",
  prerequisites: ["circuit-laws-on-the-bench", "diodes-and-transistors-as-switches"],
  title: "Logic levels, thresholds, open-drain and the pull-up",
  summary: "A digital signal is two voltage ranges and a forbidden band between them. Learn the four threshold numbers, how to tell whether two chips can talk, what open-drain outputs are for, and how to size the pull-up resistor that every I2C bus, reset line and interrupt pin depends on.",
  durationMinutes: 10,
  whyItMatters: "Half of all 'the bus does not work' and 'the pin reads random values' faults are level or pull-up problems. Being able to read V_IH, V_OL and I_OL off two datasheets and say 'these are compatible with 0.4 V of margin' is a skill interviewers test with a single question.",
  objectives: [
    "Define V_IH, V_IL, V_OH and V_OL and compute the noise margin between an output and the input it drives.",
    "Decide whether a 5 V, 3.3 V or 1.8 V output can drive a given input, including the 5 V-tolerant and clamp-diode cases.",
    "Explain push-pull versus open-drain outputs and why open-drain allows wired-AND buses and level translation.",
    "Size a pull-up resistor from the sink current and the rise-time requirement, and recognise the symptoms of a pull-up that is too strong or too weak.",
  ],
  review: {
    status: "technically-reviewed",
    note: "Threshold conventions follow JEDEC/CMOS practice and STM32 datasheet GPIO specifications; the I2C pull-up bounds follow UM10204. Numbers in examples are typical and illustrative.",
  },
  references: [
    { title: "STM32F4 datasheet, I/O port characteristics (V_IL, V_IH, V_OL, V_OH, 5 V-tolerant pins, injection current)", note: "The input thresholds are specified as fractions of V_DD with hysteresis; FT pins tolerate 5 V." },
    { title: "NXP UM10204, I2C-bus specification, section 7.1 (pull-up resistor sizing)", id: "UM10204", note: "R_p(min) from V_OL and I_OL; R_p(max) from the bus capacitance and rise time." },
    { title: "Texas Instruments SCEA035: Logic guide, and application report on voltage-level translation", note: "Level families, 5 V tolerance, translation methods." },
  ],
  steps: [
    {
      type: "scenario",
      title: "The sensor that worked on the dev kit",
      body: `A 5 V legacy sensor's digital output drives a 3.3 V microcontroller input. On the development kit it worked for a week. On the product, one unit in ten reads the sensor as permanently high, and two came back with a dead pin.

The MCU pin was not one of the 5 V-tolerant ones. Its input clamp diode conducted the sensor's 5 V into the 3.3 V rail; on a board with a light load the rail itself was pulled up toward 4 V, every input threshold moved, and the clamp diode slowly died. Nothing in the firmware could have shown this. The datasheet's I/O table could, in one line.`,
    },
    {
      type: "concept",
      title: "Four numbers and a forbidden band",
      body: `A logic input promises to read **low** for any voltage below **V_IL** and **high** for any voltage above **V_IH**; between them is a forbidden band where the reading is undefined (and where the RC lesson's button chattered). A logic output promises to produce at least **V_OH** when high and at most **V_OL** when low, at its rated current. Compatibility is two subtractions:

- high-side **noise margin** = V_OH(driver) − V_IH(receiver)
- low-side noise margin = V_IL(receiver) − V_OL(driver)

Both must be positive, and comfortably so (a few hundred millivolts) because ground offsets, crosstalk and supply noise eat into them. For CMOS parts the input thresholds are fractions of the receiver's supply: typically V_IL ≈ 0.3 V_DD and V_IH ≈ 0.7 V_DD (an STM32 specifies about 0.35 and 0.65 V_DD, with a little hysteresis); outputs swing nearly to the rails at light load (V_OH ≈ V_DD − 0.4 V and V_OL ≈ 0.4 V at the rated 8 mA on an STM32).

So a 3.3 V CMOS output driving a 3.3 V input has margins of about 0.6 V each way. A **3.3 V output driving a 5 V CMOS input** fails: V_OH ≈ 2.9 V against V_IH = 3.5 V, a negative margin, and the input sits in the forbidden band (it may read high on the bench and low in the field). The same 3.3 V output driving a 5 V **TTL-threshold** input (V_IH = 2.0 V) works with 0.9 V of margin, which is why "5 V TTL-compatible" inputs are so useful. A **5 V output driving a 3.3 V input** has the opposite problem: thresholds are fine but the input's **absolute maximum** (usually V_DD + 0.3 V) is exceeded unless the pin is marked **5 V tolerant** (STM32 "FT" pins, which have no clamp diode to V_DD). On a non-tolerant pin the clamp diode conducts, exactly as in the scenario.

Always read the receiver's **absolute maximum** and the driver's **V_OH at the current you draw**; a strong pull-down load drags V_OH down and the margin with it.`,
      deeper: {
        title: "Injection current and the rail that rose",
        body: `When a clamp diode conducts, the datasheet calls it **injection current** and limits it (a few milliamps per pin). The current flows into the receiver's supply rail. If the rail's regulator is lightly loaded it cannot sink current, so the rail rises toward the injected voltage, which is the scenario's 4 V and the reason every other threshold on the chip moved. A series resistor (which limits the injection to a safe value) is a cheap fix; a proper level translator is the right one.`,
      },
    },
    {
      type: "concept",
      title: "Push-pull, open-drain and the wired-AND bus",
      body: `A **push-pull** output has a transistor to the supply and one to ground; it drives high and low actively, fast and strongly. Two push-pull outputs connected together fight (one pulls up while the other pulls down), so a push-pull line has exactly one driver.

An **open-drain** output has only the transistor to ground. It can pull the line low or let go; it cannot drive high. Something else, a **pull-up resistor**, brings the line high when nobody pulls. Three things follow:

1. **Many devices can share one line.** Any of them can pull it low; it is high only when all let go. That is a **wired-AND**, and it is how I2C, the shared interrupt line of several sensors, and a multi-source reset line work. Nothing can fight, because nothing drives high.
2. **The high level is set by the pull-up's supply, not the driver's.** An open-drain output on a 1.8 V chip with its pull-up to 3.3 V produces a 3.3 V high; that is free level translation in one direction (as long as the open-drain pin tolerates the higher voltage).
3. **The rising edge is slow.** The pull-up charges the line's capacitance with an RC time constant (the RC lesson): R_p × C_bus. The falling edge, driven by a transistor, is fast. Open-drain buses are therefore asymmetric and limited in speed by the pull-up.

STM32 GPIO can be configured push-pull or open-drain per pin (OTYPER), and I2C pins must be open-drain with external pull-ups; the internal pull-ups (about 40 kΩ) are too weak for a bus and exist for buttons and idle lines.`,
    },
    {
      type: "concept",
      title: "Sizing the pull-up: two limits and a window",
      body: `A pull-up has a **minimum** value set by how much current the driver can sink while still producing a valid low, and a **maximum** set by how fast the line must rise.

**R_p(min)**: when a device pulls low it must hold V_OL (0.4 V for I2C) while the pull-up pours current into it. The current is (V_DD − V_OL) / R_p and must not exceed the driver's I_OL (3 mA for standard I2C). R_p(min) = (3.3 − 0.4) / 0.003 = 967 Ω. Below about 1 kΩ at 3.3 V the low level starts to float up.

**R_p(max)**: the rise time t_r from 30 % to 70 % of V_DD is about 0.85 × R_p × C_bus (the two threshold crossings of the RC curve). I2C standard mode allows 1000 ns of rise time; a bus with 100 pF of capacitance (a few devices and 10 cm of trace) gives R_p(max) ≈ 1000 ns / (0.85 × 100 pF) ≈ 11.8 kΩ. Fast mode (400 kHz) allows 300 ns, so R_p(max) ≈ 3.5 kΩ with the same capacitance.

The window for this bus is roughly **1 kΩ to 3.5 kΩ at 400 kHz** and up to about 12 kΩ at 100 kHz; 2.2 kΩ or 4.7 kΩ are the usual choices, with the smaller value for faster buses or more devices. The symptoms when it is wrong: too weak (resistor too large) gives **rounded rising edges**, missed acknowledges at speed and a bus that works at 100 kHz but not 400 kHz; too strong (too small) gives a **low level that does not reach V_OL**, so a driver's "0" reads as a 1 on a marginal receiver, plus wasted current. Both are visible in one scope capture of SDA, which is why the I2C lesson's second measurement is the edge shape.

The same arithmetic sizes a pull-up on a reset line (fast rise matters less; leakage matters more) or an interrupt line shared by three sensors (sum their leakages, keep the high level above V_IH).`,
    },
    {
      type: "example",
      title: "Worked example: three level questions from one schematic",
      body: `A board has a 3.3 V STM32, a 1.8 V IMU with open-drain interrupt and I2C, and a 5 V ultrasonic sensor with a push-pull echo output.

1. **IMU interrupt → STM32 pin.** Open-drain from the 1.8 V chip, pull-up to 3.3 V, so the high level is 3.3 V and the low is the IMU's V_OL (0.2 V). Margins against the STM32's 0.65 V_DD = 2.15 V and 0.35 V_DD = 1.16 V are fine. Check: the IMU's interrupt pin must tolerate 3.3 V in open-drain (its datasheet says so; many do, some do not). Pull-up 10 kΩ: an interrupt edge of a few microseconds is fine.
2. **I2C between STM32 and IMU.** The IMU's I2C pins are 1.8 V logic with an absolute maximum of 2.1 V, so the bus pull-ups must go to **1.8 V**, and the STM32's open-drain I2C pins (FT, 5 V tolerant, and happy with a 1.8 V high) produce a 1.8 V high. The STM32's V_IH is 2.15 V, so **it cannot read a 1.8 V high**: an I2C bus between them needs a level translator (a dual-supply I2C translator or the two-MOSFET circuit from UM10204). Caught at the schematic, this is a $0.50 part; caught on the bench, it is a week.
3. **Ultrasonic echo (5 V push-pull) → STM32.** Choose an FT pin and check its absolute maximum (5.5 V): acceptable with a 5 V-tolerant pin. V_OH 4.5 V against V_IH 2.15 V: 2.35 V of margin. On a non-FT pin, add a divider (10 kΩ / 20 kΩ gives 3.33 V) or a series resistor plus the clamp, accepting the injection current limit.

Each conclusion came from two datasheet lines and one subtraction.`,
    },
    {
      type: "exercise",
      exercise: {
        kind: "numeric",
        id: "noise-margin",
        skill: "logic-levels",
        objective: "Compute a high-level noise margin.",
        prompt: `A 3.3 V CMOS output specifies V_OH = 2.9 V at its load. It drives a 5 V CMOS input with V_IH = 0.7 × 5 V. What is the high-level noise margin, in volts? (A negative answer means it does not work.)`,
        unit: "V",
        answer: -0.6,
        tolerance: 0.02,
        solution: `V_IH = 3.5 V. Margin = V_OH − V_IH = 2.9 − 3.5 = **−0.6 V**. The input sits in its forbidden band: it may read high on one unit and low on another. A 5 V TTL-threshold input (V_IH = 2.0 V) would give +0.9 V.`,
        solvedFeedback: `Right: negative, so incompatible. This is the most common 3.3 V-to-5 V mistake.`,
        misconceptions: [
          { value: 0.6, tolerance: 0.02, feedback: `The magnitude is right but the sign matters: the driver's high (2.9 V) is *below* the receiver's threshold (3.5 V). Margin = V_OH − V_IH = −0.6 V.` },
          { value: 1.4, tolerance: 0.05, feedback: `That compares against 1.5 V (0.3 × 5 V), the low threshold. The high-level margin uses V_IH = 0.7 × 5 = 3.5 V.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "numeric",
        id: "pullup-min",
        skill: "logic-levels",
        objective: "Compute the minimum I2C pull-up.",
        prompt: `An I2C bus runs at 3.3 V. The devices guarantee V_OL = 0.4 V at a sink current of 3 mA. What is the smallest pull-up resistor that respects this, in ohms?`,
        unit: "Ω",
        answer: 967,
        tolerance: 10,
        solution: `R_p(min) = (V_DD − V_OL) / I_OL = (3.3 − 0.4) / 0.003 = **967 Ω**. Use 1 kΩ or larger; 2.2 kΩ and 4.7 kΩ are the usual values, with the rise-time limit setting the upper bound.`,
        solvedFeedback: `Correct. Smaller than this and the driver cannot pull the line down to a valid low.`,
        misconceptions: [
          { value: 1100, tolerance: 10, feedback: `1100 Ω is 3.3 V / 3 mA, ignoring the 0.4 V the driver is allowed to leave on the line. The pull-up sees V_DD − V_OL.` },
          { value: 133, tolerance: 5, feedback: `That divides by 3 mA as if it were 30 mA, or treats 0.4 V as the drop. The drop across the pull-up when the line is low is 3.3 − 0.4 = 2.9 V.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "multi",
        id: "open-drain-facts",
        skill: "logic-levels",
        objective: "Reason about open-drain outputs and level compatibility.",
        prompt: `Select **every** correct statement.`,
        options: [
          { id: "a", text: "Several open-drain outputs can share one line with a single pull-up; the line is high only when all of them release it.", correct: true, feedback: `Wired-AND: the basis of I2C and shared interrupt lines.` },
          { id: "b", text: "An open-drain output's high level is set by the pull-up's supply, which can translate a 1.8 V device's signal to 3.3 V if the pin tolerates it.", correct: true, feedback: `One-directional level translation for free; check the pin's absolute maximum.` },
          { id: "c", text: "A pull-up that is too large makes the rising edges slow; too small and the low level may not reach V_OL.", correct: true, feedback: `The two limits that define the pull-up window. Both show in one scope capture.` },
          { id: "d", text: "A 5 V push-pull output can drive any 3.3 V input because 'high is high'.", correct: false, feedback: `Only a 5 V-tolerant input. Otherwise the clamp diode conducts, injects current into the rail and eventually fails, as in the scenario.` },
          { id: "e", text: "Two push-pull outputs may be wired together to make a bus.", correct: false, feedback: `They fight whenever they disagree. Shared lines need open-drain outputs or a tri-state protocol.` },
        ],
        solvedFeedback: `Right. Open-drain shares and translates; the pull-up has a window; tolerance is a datasheet property, not an assumption; push-pull outputs never share a wire.`,
      },
    },
    {
      type: "interview",
      questionId: "level-compatibility",
      intro: `Say the four numbers, do the two subtractions out loud, then name the tolerant-pin and clamp-diode cases.`,
    },
    {
      type: "figure",
      title: "Driver guarantees against receiver requirements",
      diagram: "logic-levels",
      alt: "Driver output levels VOH and VOL against receiver input thresholds VIH and VIL for 3.3 volt LVTTL, with the noise margins between them.",
      caption: `Noise margin high is VOH − VIH (2.4 − 2.0 = 0.4 V); noise margin low is VIL − VOL (0.8 − 0.4 = 0.4 V). Anything between VIL and VIH is undefined, and an open-drain output only reaches VOH through its pull-up.`,
    },
    {
      type: "recap",
      summary: `- Inputs: low below V_IL (~0.3 V_DD), high above V_IH (~0.7 V_DD), forbidden in between. Outputs: at least V_OH high, at most V_OL low at rated current. Margins: V_OH − V_IH and V_IL − V_OL, both positive by a few hundred millivolts.
- 3.3 V → 5 V CMOS input fails (2.9 < 3.5); 3.3 V → TTL-threshold input works; 5 V → 3.3 V input needs a 5 V-tolerant pin or a divider/translator, or the clamp diode conducts.
- Open-drain: pulls low or releases; pull-up sets the high; wired-AND lets devices share a line and translates levels upward; rising edges are RC-slow.
- Pull-up window: R_p(min) = (V_DD − V_OL) / I_OL (~1 kΩ at 3.3 V); R_p(max) from rise time ≈ t_r / (0.85 × C_bus) (~3.5 kΩ for 400 kHz at 100 pF).`,
      cards: [
        { id: "lvl-1", front: "Can a 3.3 V CMOS output drive a 5 V CMOS input?", back: "No: V_OH ≈ 2.9 V against V_IH = 3.5 V, a −0.6 V margin. It can drive a 5 V TTL-threshold input (V_IH = 2.0 V). Check the receiver's V_IH, not its supply." },
        { id: "lvl-2", front: "What happens when 5 V meets a non-tolerant 3.3 V input?", back: "The clamp diode to V_DD conducts; injection current flows into the 3.3 V rail, lifting it on a light load, and the diode degrades. Use a 5 V-tolerant pin, a divider, a series resistor within the injection limit, or a translator." },
        { id: "lvl-3", front: "Why are I2C outputs open-drain?", back: "So any device can pull the line low without fighting (wired-AND), the pull-up sets a common high, and arbitration and clock stretching work. The cost is an RC-slow rising edge set by the pull-up." },
        { id: "lvl-4", front: "I2C pull-up window at 3.3 V, 100 pF, 400 kHz?", back: "Min (3.3 − 0.4) / 3 mA ≈ 1 kΩ (valid low); max ≈ 300 ns / (0.85 × 100 pF) ≈ 3.5 kΩ (rise time). 2.2 kΩ is a safe choice; 4.7 kΩ suits 100 kHz." },
      ],
    },
  ],
};
