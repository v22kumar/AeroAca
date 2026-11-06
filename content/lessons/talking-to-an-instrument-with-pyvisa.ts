import type { Lesson } from "@/lib/content/schema";

export const talkingToAnInstrumentWithPyvisa: Lesson = {
  slug: "talking-to-an-instrument-with-pyvisa",
  moduleId: "python-test",
  prerequisites: ["writing-a-trustworthy-test-case"],
  title: "Talking to a bench instrument with PyVISA",
  summary: "Every bench instrument with a USB, LAN or GPIB port speaks SCPI, and Python reaches it through VISA. Learn the four calls that cover most of test automation, the SCPI commands you will use every week, and the synchronisation and error-queue habits that keep scripts honest.",
  durationMinutes: 12,
  whyItMatters: "Test automation is the fastest route from 'hardware test engineer' to 'engineer who multiplies the team'. A script that takes a thousand measurements overnight, with timestamps and instrument IDs in the log, is evidence a review can use. 'Have you automated a measurement?' is asked in nearly every hardware-test interview.",
  objectives: [
    "Open an instrument with PyVISA, identify it, configure a measurement and read a value.",
    "Use SCPI structure: common commands, subsystem trees, queries, the error queue and *OPC? synchronisation.",
    "Write a measurement loop whose log a reviewer can trust: timestamps, instrument identity, settings, raw values.",
  ],
  review: {
    status: "technically-reviewed",
    note: "PyVISA API (ResourceManager, open_resource, write, query, timeout, termination) per the PyVISA documentation; SCPI commands per IEEE 488.2 common commands and the SCPI-1999 standard, with the Keysight 34461A DMM programming guide as the example dialect. Command spellings vary slightly between vendors; the structure does not.",
  },
  references: [
    { title: "PyVISA documentation: Tutorial and ResourceManager / Resource API", url: "https://pyvisa.readthedocs.io/", note: "open_resource, query, write, read, timeout, read_termination." },
    { title: "IEEE 488.2 common commands (*IDN?, *RST, *CLS, *OPC?, *ESR?)", note: "Mandatory on every SCPI instrument." },
    { title: "SCPI-1999 standard syntax and style (IVI Foundation)", note: "Subsystem trees, short and long forms, queries, error queue." },
    { title: "Keysight 34460A/34461A programming guide", note: "CONFigure, MEASure, READ?, SENSe:VOLTage:DC:NPLC examples." },
  ],
  steps: [
    {
      type: "scenario",
      title: "Two hundred readings, by hand",
      body: `A regulator's output must stay within 3.30 V ± 1 % across a two-hour warm-up. The test plan says "record the output every 30 seconds". That is 240 readings, typed from a multimeter display into a spreadsheet, by a person who also has to watch a scope.

The DMM on the bench has a USB port on the back. Twelve lines of Python read it every 30 seconds, time-stamp each value, record the instrument's serial number and the measurement settings, and write a CSV. The engineer goes to lunch. The log is better than the hand-typed one would have been, and it can be re-run on the next unit by anyone.

This lesson is those twelve lines, and the habits that make them trustworthy.`,
    },
    {
      type: "concept",
      title: "VISA, SCPI and the four calls",
      body: `**VISA** (Virtual Instrument Software Architecture) is the driver layer that makes USB, LAN (VXI-11, HiSLIP), GPIB and serial instruments look the same to a program. **PyVISA** is its Python binding; it needs a backend, either a vendor VISA (Keysight, NI, R&S) or the pure-Python \`pyvisa-py\`.

**SCPI** (Standard Commands for Programmable Instruments) is the text language on top. Three things to know:

- **Common commands** start with \`*\` and exist on every instrument: \`*IDN?\` (identity), \`*RST\` (reset to a known state), \`*CLS\` (clear status and the error queue), \`*OPC?\` (returns \`1\` when all pending operations are complete).
- **Subsystem commands** form a tree: \`CONFigure:VOLTage:DC 10,0.001\` sets up a DC-volts measurement with a 10 V range and 1 mV resolution. Capitals are the short form (\`CONF:VOLT:DC\`), the long form is also accepted, and a trailing \`?\` makes a query.
- **The error queue**: a wrong command does not raise an exception; it goes into the instrument's queue. \`SYST:ERR?\` pops one entry, \`0,"No error"\` when empty. A script that never reads the queue has no idea whether its commands were accepted.

Four PyVISA calls cover almost everything:

\`\`\`python
import pyvisa
rm = pyvisa.ResourceManager()                  # or ResourceManager('@py') for pyvisa-py
print(rm.list_resources())                    # ('USB0::0x2A8D::0x1301::MY57200123::INSTR', ...)
dmm = rm.open_resource('USB0::0x2A8D::0x1301::MY57200123::INSTR')
dmm.timeout = 5000                            # ms; longer than the slowest reply you expect
dmm.read_termination = '\\n'
print(dmm.query('*IDN?'))                     # write + read in one call
dmm.write('*RST; *CLS')
dmm.write('CONF:VOLT:DC 10,0.001')
value = float(dmm.query('READ?'))
\`\`\`

\`write\` sends a command, \`read\` waits for a reply, \`query\` does both, and \`timeout\` is the time \`read\` will wait before raising. The resource string is the instrument's address; the serial number inside it is also what belongs in your log.`,
      deeper: {
        title: "Why *OPC? matters",
        body: `Commands are queued and executed in order, but a slow one (a 100-PLC measurement, an auto-zero, a calibration) can still be running when your next \`read\` times out. \`*OPC?\` blocks until everything before it has finished and then returns \`1\`, so \`dmm.query('*OPC?')\` after a configuration is a synchronisation point. The alternative, \`time.sleep(2)\`, is a guess that is either too long or, one day, too short; the flaky-test mission on day 22 is built on that guess.`,
      },
    },
    {
      type: "visual",
      title: "A simulated DMM to practise on",
      visual: "scpi-console",
      body: `Type SCPI at a simulated multimeter. Try \`*IDN?\`, \`*RST\`, \`CONF:VOLT:DC 10,0.001\`, \`SENS:VOLT:DC:NPLC 10\`, \`READ?\`, a misspelled command, then \`SYST:ERR?\`. Readings are generated with noise that shrinks as NPLC rises, and each reading takes NPLC × 20 ms at 50 Hz, as a real one would.`,
      caption: `Simulation for practice; it models one DMM dialect and a handful of commands. Real instruments have hundreds of commands and their own programming guide.`,
    },
    {
      type: "example",
      title: "Worked example: the warm-up log",
      body: `\`\`\`python
import csv, time, pyvisa

rm = pyvisa.ResourceManager()
dmm = rm.open_resource('USB0::0x2A8D::0x1301::MY57200123::INSTR')
dmm.timeout = 10_000
dmm.read_termination = '\\n'

idn = dmm.query('*IDN?').strip()
dmm.write('*RST; *CLS')
dmm.write('CONF:VOLT:DC 10,0.001')
dmm.write('SENS:VOLT:DC:NPLC 10')            # 200 ms per reading at 50 Hz, lower noise
dmm.query('*OPC?')                            # configuration complete before the first READ?
err = dmm.query('SYST:ERR?').strip()
assert err.startswith('0,'), f'instrument rejected setup: {err}'

with open('warmup_log.csv', 'w', newline='') as f:
    w = csv.writer(f)
    w.writerow(['utc', 'instrument', 'config', 'volts'])
    t_end = time.time() + 2 * 3600
    while time.time() < t_end:
        v = float(dmm.query('READ?'))
        w.writerow([time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), idn, 'DCV 10V NPLC10', f'{v:.6f}'])
        f.flush()
        time.sleep(30)
\`\`\`

What makes this log trustworthy: the instrument identity and serial number are recorded with every row; the configuration is recorded; the error queue was checked after setup; the value is written raw with full resolution (judging pass or fail is a separate step); the file is flushed each row so a crash at hour two keeps hour one. NPLC (number of power-line cycles) is the integration time: 10 cycles rejects mains hum and lowers noise at the cost of 200 ms per reading, which is nothing at one reading per 30 s.`,
    },
    {
      type: "exercise",
      exercise: {
        kind: "single",
        id: "pyvisa-code-reading",
        skill: "python-automation",
        objective: "Read a PyVISA script and find the fault.",
        prompt: `This script sometimes raises a timeout on the \`READ?\` line, and sometimes returns the previous reading. What is wrong?

\`\`\`python
dmm.timeout = 1000
dmm.write('*RST')
dmm.write('CONF:VOLT:DC 10,0.001')
dmm.write('SENS:VOLT:DC:NPLC 100')
v = float(dmm.query('READ?'))
\`\`\``,
        options: [
          { id: "a", text: "A 100-PLC reading takes about 2 s at 50 Hz, longer than the 1 s timeout; the late reply then waits in the buffer for the next read.", correct: true, feedback: `Yes. NPLC 100 is 2 s of integration (plus auto-zero), so READ? cannot answer within 1 s. The reply arrives later and is consumed by the next query, which is how 'the previous reading' appears. Set the timeout from the measurement time, and synchronise with *OPC? after configuration.` },
          { id: "b", text: "CONF:VOLT:DC needs the long form CONFigure:VOLTage:DC.", correct: false, feedback: `Short and long forms are both accepted by SCPI; the short form is the capitalised part.` },
          { id: "c", text: "*RST must be sent as a query, *RST?.", correct: false, feedback: `*RST is a command with no reply; *RST? is not defined.` },
          { id: "d", text: "float() cannot parse SCPI replies; use int().", correct: false, feedback: `SCPI returns numbers in a form such as +3.29871000E+00, which float() parses correctly.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "numeric",
        id: "nplc-time",
        skill: "python-automation",
        objective: "Convert NPLC to time and set a timeout.",
        prompt: `A DMM on 50 Hz mains is set to NPLC 20 and takes two readings per trigger with auto-zero on, which doubles the integration time. What is the **minimum** integration time per trigger, in milliseconds, before any overhead?`,
        unit: "ms",
        answer: 1600,
        tolerance: 1,
        solution: `One power-line cycle at 50 Hz is 20 ms. NPLC 20 → 400 ms per reading. Auto-zero doubles it → 800 ms. Two readings → **1 600 ms**. A timeout for READ? should be well above this, say 5 s, and *OPC? should guard the configuration step.`,
        solvedFeedback: `Correct: 1 600 ms. Timeouts come from the measurement arithmetic, not from a guess.`,
        misconceptions: [
          { value: 400, tolerance: 1, feedback: `400 ms is one reading without auto-zero. Auto-zero doubles it and there are two readings: 1 600 ms.` },
          { value: 800, tolerance: 1, feedback: `800 ms is one reading with auto-zero. Two readings per trigger: 1 600 ms.` },
          { value: 1333, tolerance: 2, feedback: `You used 60 Hz (16.7 ms per cycle). The question says 50 Hz: 20 ms per cycle → 1 600 ms.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "multi",
        id: "trustworthy-log",
        skill: "python-automation",
        objective: "Know what belongs in an automated measurement log.",
        prompt: `Select **every** item an automated measurement log should contain for a reviewer to trust it.`,
        options: [
          { id: "a", text: "The instrument identity and serial number from *IDN?.", correct: true, feedback: `Ties the data to a calibrated instrument.` },
          { id: "b", text: "The configuration used (function, range, NPLC, triggering).", correct: true, feedback: `Without it, nobody can reproduce the measurement or judge its uncertainty.` },
          { id: "c", text: "A timestamp per reading.", correct: true, feedback: `Turns a column of numbers into evidence about a process over time.` },
          { id: "d", text: "Only the readings that passed the limit, to keep the file small.", correct: false, feedback: `Filtering at capture destroys the evidence. Record everything raw; judge later.` },
          { id: "e", text: "The result of SYST:ERR? after setup, and any error during the run.", correct: true, feedback: `A rejected command silently produces a log of the wrong measurement.` },
        ],
        solvedFeedback: `Right. Identity, configuration, timestamps, raw values and the error queue. Judgement is a separate step from capture.`,
      },
    },
    {
      type: "interview",
      questionId: "automate-a-measurement",
      intro: `Describe the four calls, the SCPI commands, the synchronisation and the log columns. If you have automated anything with real instruments, name the instrument; if you have not, say that and describe this exercise honestly.`,
    },
    {
      type: "figure",
      title: "The automated bench, drawn",
      diagram: "test-bench-automation",
      alt: "Automated test bench: a PC running pytest controls a bench supply, oscilloscope and multimeter and talks to the device under test over serial.",
      caption: `The PC owns the instruments over SCPI and the device under test over serial; fixtures open the ports once, tests ask, read and assert, and the report is written from what was measured.`,
    },
    {
      type: "recap",
      summary: `- VISA makes USB, LAN, GPIB and serial instruments look alike; PyVISA wraps it: ResourceManager, open_resource, write, query, read, timeout.
- SCPI: *IDN?, *RST, *CLS, *OPC? on every instrument; subsystem trees like CONF:VOLT:DC; a trailing ? queries; SYST:ERR? pops the error queue.
- Timeouts come from measurement arithmetic (NPLC × cycle time × readings, doubled by auto-zero); *OPC? synchronises after slow commands.
- A trustworthy log records instrument identity, configuration, timestamps, raw values and the error queue, and never filters at capture.`,
      cards: [
        { id: "visa-1", front: "Four PyVISA calls that cover most automation?", back: "ResourceManager().open_resource(address); write(cmd); query(cmd) (write + read); read(). Plus timeout and read_termination settings." },
        { id: "visa-2", front: "Four SCPI common commands every instrument has?", back: "*IDN? identity, *RST reset, *CLS clear status and error queue, *OPC? returns 1 when pending operations complete." },
        { id: "visa-3", front: "How long does an NPLC 10 reading take at 50 Hz?", back: "10 × 20 ms = 200 ms of integration, doubled with auto-zero. Set the timeout from this arithmetic, not from a guess." },
        { id: "visa-4", front: "What does SYST:ERR? do and why read it?", back: "Pops one entry from the instrument's error queue (0,\"No error\" when empty). Wrong commands do not raise exceptions; they queue silently." },
      ],
    },
  ],
};
