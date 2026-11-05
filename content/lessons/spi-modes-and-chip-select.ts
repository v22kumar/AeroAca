import type { Lesson } from "@/lib/content/schema";

export const spiModesAndChipSelect: Lesson = {
  slug: "spi-modes-and-chip-select",
  moduleId: "interfaces",
  title: "SPI modes, chip select and the first byte of garbage",
  summary: "SPI is simple until two chips disagree about which clock edge matters. Learn the four modes, how chip select frames a transaction, and how to read a shifted or stuck byte as a precise diagnosis.",
  durationMinutes: 9,
  whyItMatters: "Displays, flash memories, IMUs and ADCs all speak SPI, and a mode mismatch is the most common reason a new sensor returns the wrong ID. Interviewers ask about clock polarity and phase because it is a quick test of whether you read datasheets and look at waveforms.",
  objectives: [
    "Name the four SPI signals and explain why a read requires the master to clock out dummy bytes.",
    "Translate a datasheet's timing statement into CPOL and CPHA settings, and recognise a mode mismatch from the data you get back.",
    "Choose a clock prescaler that respects a device's maximum SCK frequency.",
  ],
  review: {
    status: "technically-reviewed",
    note: "Mode definitions follow the widely used Motorola/Freescale convention adopted by STM32 (RM0090 SPI chapter: CPOL and CPHA bits in SPI_CR1, BR prescaler). Device examples are generic; waveforms in the visual are illustrative.",
  },
  references: [
    {
      title: "STM32F4 reference manual, SPI: clock phase and polarity, data frame format, NSS management, baud rate control",
      id: "RM0090",
      url: "https://www.st.com/resource/en/reference_manual/rm0090-stm32f405415-stm32f407417-stm32f427437-and-stm32f429439-advanced-armbased-32bit-mcus-stmicroelectronics.pdf",
    },
    {
      title: "Any SPI peripheral datasheet, 'Serial interface' and 'Timing characteristics' sections",
      note: "The statements 'SCK idles high/low' and 'data is latched on the rising/falling edge' are what you translate into CPOL/CPHA. Maximum SCK frequency and CS setup/hold times live in the timing table.",
    },
  ],
  steps: [
    {
      type: "scenario",
      title: "The sensor that says 0x7E",
      body: `A new inertial sensor is wired to SPI1. The datasheet says its identity register returns **0x3F**. Your first read returns **0x7E**, every time, reliably.

0x7E is 0111 1110. 0x3F is 0011 1111. One is the other shifted left by a single bit. The sensor is alive, the wiring is right, and a single configuration bit is wrong. By the end of this lesson you will know which bit, why the data shifts by exactly one position, and how to confirm it in one scope capture.`,
    },
    {
      type: "concept",
      title: "Four wires and a shift register",
      body: `**SPI** is a synchronous, full-duplex bus with one master (controller) and one or more slaves (peripherals):

- **SCK**: the clock, always driven by the master.
- **MOSI** (master out, slave in; also called COPI or SDI on the device): data from master to slave.
- **MISO** (master in, slave out; CIPO or SDO): data from slave to master.
- **CS** (chip select, often NSS or SS, active-low): one line per slave. The slave ignores SCK until its CS is low.

Think of master and slave as two 8-bit **shift registers** joined in a ring. Every clock edge shifts one bit out of each and into the other. That has two consequences people forget:

1. **Every transfer is both a write and a read.** To read a register, the master sends the address and then clocks out *dummy* bytes; the slave's reply arrives on MISO during those dummy clocks.
2. **Nothing happens without clocks from the master.** A slave cannot push data on its own.

Bits usually go **most-significant first** (the opposite of UART). STM32 can be set to LSB-first for the rare device that needs it.`,
      deeper: {
        title: "Chip select is part of the protocol",
        body: `CS does more than enable the slave. Most devices reset their internal bit counter on the falling edge of CS, interpret the first byte after it as a command, and commit the transaction on the rising edge. Holding CS low across several bytes is how multi-byte reads work; raising it between every byte breaks them.

Timing tables specify CS setup time (before the first clock), hold time (after the last clock) and a minimum CS-high time between transactions. Driving CS from a GPIO under software control, as STM32 users usually do, makes all three your responsibility.`,
      },
    },
    {
      type: "visual",
      title: "Polarity, phase and the sampling edge",
      visual: "spi-modes",
      body: `Toggle **CPOL** (clock idle level) and **CPHA** (which edge samples). Watch where the sampling dots land on the data. Then set the device's expectation differently from the master's and read the symptom.`,
      caption: `Illustrative timing. CPOL sets the idle level of SCK. CPHA = 0 samples on the first edge of each clock pulse, CPHA = 1 on the second. The four combinations are modes 0 to 3.`,
    },
    {
      type: "concept",
      title: "Reading the datasheet, reading the symptom",
      body: `A datasheet rarely says "mode 3". It says things like *"SCK idles high; data is latched on the rising edge and changes on the falling edge."* Translate in two steps:

- Idle level → **CPOL**: idles low → CPOL = 0; idles high → CPOL = 1.
- Which edge *samples* → **CPHA**: if the sampling edge is the *first* edge after idle, CPHA = 0; if it is the *second*, CPHA = 1.

"Idles high, latched on rising": the first edge from idle-high is the falling edge, so the rising edge is the second: CPOL = 1, CPHA = 1, **mode 3**. "Idles low, latched on rising": the rising edge is the first edge: CPOL = 0, CPHA = 0, **mode 0**. Modes 0 and 3 both sample on the rising edge and cover most devices.

Symptoms are just as readable:

| What you read | Likely cause |
|---|---|
| Always 0xFF | MISO not reaching the master (wrong pin, no connection, slave never selected). A floating or pulled-up MISO reads as all ones. |
| Always 0x00 | MISO shorted low, slave unpowered, or the slave is in a state where it drives nothing and the line is pulled down. |
| Correct value shifted by one bit (0x3F → 0x7E or 0x1F) | Clock phase or polarity mismatch: the master samples half a clock early or late, so the bit stream is offset by one. |
| Correct on the second read only | CS not toggled between transactions, so the device's bit counter started mid-command. |
| Correct at low speed, wrong at high speed | SCK above the device's maximum, or capacitive loading rounding the edges. |`,
    },
    {
      type: "example",
      title: "Worked example: the 0x7E",
      body: `Sensor datasheet: *"Data on SDI is captured on the rising edge of SCK. SDO is updated on the falling edge. SCK idle state is high."*

Translation: idle high → CPOL = 1. Rising edge is the second edge after idle-high → CPHA = 1. **Mode 3.**

The firmware had the STM32 default, CPOL = 0, CPHA = 0, mode 0. Mode 0 also samples on the rising edge, but with the clock idling low the *first* rising edge now comes before the slave has placed its first bit, so the master captures the slave's bits one position late: 0x3F arrives as 0x7E. The scope confirms it: MISO changes on falling edges, and the first MISO transition happens after the master has already sampled once.

Fix: \`SPI_CR1 |= SPI_CR1_CPOL | SPI_CR1_CPHA;\` (or the equivalent HAL init fields), then read the ID again. 0x3F.`,
    },
    {
      type: "exercise",
      exercise: {
        kind: "single",
        id: "spi-mode-from-datasheet",
        skill: "spi",
        objective: "Translate datasheet timing into CPOL/CPHA.",
        prompt: `A flash memory datasheet says: *"The clock is low when idle. Input data is sampled on the rising edge of SCK; output data is driven on the falling edge."* Which SPI mode does the master need?`,
        options: [
          { id: "a", text: "Mode 0 (CPOL = 0, CPHA = 0)", correct: true, feedback: `Correct. Idle low gives CPOL = 0. From idle-low, the first edge is rising, and that is the sampling edge, so CPHA = 0.` },
          { id: "b", text: "Mode 1 (CPOL = 0, CPHA = 1)", correct: false, feedback: `CPOL = 0 is right, but CPHA = 1 would sample on the *second* edge, the falling one. The datasheet says data is sampled on the rising edge.` },
          { id: "c", text: "Mode 2 (CPOL = 1, CPHA = 0)", correct: false, feedback: `The clock idles low, so CPOL must be 0. Mode 2 idles high and samples on the falling edge: wrong on both counts.` },
          { id: "d", text: "Mode 3 (CPOL = 1, CPHA = 1)", correct: false, feedback: `Mode 3 also samples on the rising edge, which is why it is often confused with mode 0, but it idles high. The device says idle low, and the first clock edge the device sees would be wrong.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "single",
        id: "spi-shifted-id",
        skill: "spi",
        objective: "Diagnose a mode mismatch from the returned data.",
        prompt: `A device's identity register should read 0x9A (1001 1010). You consistently read 0x4D (0100 1101), and the scope shows MISO toggling with sensible-looking data. What is the most likely cause?`,
        context: `Reading the register at a quarter of the clock speed gives the same 0x4D.`,
        options: [
          { id: "a", text: "MISO is not connected and the line is floating.", correct: false, feedback: `A floating or pulled-up MISO reads 0xFF (or 0x00 if pulled down), not a structured value, and the scope shows real toggling.` },
          { id: "b", text: "Clock polarity or phase is mismatched, so the master samples one bit late.", correct: true, feedback: `Yes. 0x4D is 0x9A shifted right by one (the leading 1 is lost and a trailing bit is added). A consistent one-bit offset that does not change with speed is the signature of a CPOL/CPHA mismatch. Compare the datasheet's idle level and sampling edge with SPI_CR1.` },
          { id: "c", text: "SCK is too fast for the device.", correct: false, feedback: `Speed problems vary with clock rate and usually corrupt bits unevenly. The context says the same value appears at a quarter of the speed, which rules speed out.` },
          { id: "d", text: "The device is sending LSB first.", correct: false, feedback: `LSB-first would give the bit-reversed value: 0x9A reversed is 0x59, not 0x4D. A one-position shift points to the sampling edge, not the bit order.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "numeric",
        id: "spi-prescaler",
        skill: "spi",
        objective: "Respect a device's maximum SCK frequency.",
        prompt: `SPI1 on an STM32F4 is clocked from APB2 at 84 MHz. The sensor's datasheet allows SCK up to 10 MHz. The STM32 prescaler can only divide by 2, 4, 8, 16, 32, 64, 128 or 256. What is the highest SCK frequency, in MHz, you can legally use?`,
        unit: "MHz",
        answer: 5.25,
        tolerance: 0.01,
        solution: `84 ÷ 8 = 10.5 MHz, which exceeds the 10 MHz limit. The next prescaler, ÷16, gives 84 ÷ 16 = **5.25 MHz**. The limit is a maximum, so you round the divider up, not the frequency.`,
        solvedFeedback: `Correct: 5.25 MHz with the ÷16 prescaler. The ÷8 setting would run at 10.5 MHz, over the limit by 5 %, which often works on the bench and fails in the climate chamber.`,
        misconceptions: [
          { value: 10.5, tolerance: 0.01, feedback: `84 ÷ 8 = 10.5 MHz is above the 10 MHz maximum. Being 5 % over a datasheet limit is still over it; drop to ÷16.` },
          { value: 10, tolerance: 0.01, feedback: `10 MHz is the device's limit, but the STM32 can only produce 84 MHz divided by a power of two. The nearest legal value below 10 MHz is 5.25 MHz.` },
        ],
      },
    },
    {
      type: "interview",
      questionId: "spi-first-byte-shifted",
      intro: `Interviewers like to describe a wrong register value and ask what you would check. Your answer should name CPOL and CPHA, say what the scope would show, and name the two other causes you would rule out.`,
    },
    {
      type: "recap",
      summary: `- SPI is two shift registers in a ring: every transfer is a write and a read; reads need dummy clocks from the master.
- CPOL is the clock idle level; CPHA chooses the first or second edge for sampling. Modes 0 and 3 both sample on the rising edge.
- Translate datasheet words: idle level → CPOL, sampling edge → CPHA.
- Symptoms: 0xFF means no MISO path or no CS; a one-bit shift means a mode mismatch; correct on the second read means CS framing.
- Pick the prescaler that keeps SCK at or below the device maximum, rounding the divider up.`,
      cards: [
        { id: "spi-1", front: "What do CPOL and CPHA each set?", back: "CPOL: SCK idle level (0 low, 1 high). CPHA: sampling on the first (0) or second (1) edge of each clock pulse. Modes 0 to 3 are the four combinations." },
        { id: "spi-2", front: "Datasheet: 'SCK idles high, data latched on rising edge.' Mode?", back: "Mode 3 (CPOL = 1, CPHA = 1): from idle-high the rising edge is the second edge." },
        { id: "spi-3", front: "Device ID should be 0x3F, you read 0x7E every time. Cause?", back: "A one-bit shift: clock polarity or phase mismatch between master and device. Check CPOL/CPHA against the datasheet and confirm on the scope." },
        { id: "spi-4", front: "MISO always reads 0xFF. Causes?", back: "MISO not reaching the master (wrong pin or open), chip select never asserted, or device unpowered: a pulled-up line with nothing driving it reads all ones." },
        { id: "spi-5", front: "Why does an SPI read need dummy bytes?", back: "The slave can only shift data out while the master supplies clocks; sending dummy bytes provides those clocks and the reply arrives on MISO during them." },
      ],
    },
  ],
};
