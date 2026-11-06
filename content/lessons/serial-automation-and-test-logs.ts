import type { Lesson } from "@/lib/content/schema";

export const serialAutomationAndTestLogs: Lesson = {
  slug: "serial-automation-and-test-logs",
  moduleId: "python-test",
  prerequisites: ["uart-framing-and-baud", "talking-to-an-instrument-with-pyvisa"],
  title: "Serial communication and test logs in Python",
  summary: "Most devices under test talk over a UART. Learn pyserial's handful of calls, why bytes and strings are different, how timeouts and stale buffers make tests flaky, and how to frame a request and match its reply so a thousand-cycle test means something.",
  durationMinutes: 10,
  whyItMatters: "A serial test script is the first automation most hardware engineers write and the one most likely to lie: it passes on the bench and fails overnight because of a timeout or a stale byte. Knowing why, and designing request-reply matching from the start, is what interviewers listen for behind 'tell me about a test you automated'.",
  objectives: [
    "Open a serial port with pyserial, send a command and read a line, handling bytes versus text correctly.",
    "Explain how timeouts, partial lines and stale input buffers produce flaky results, and prevent them.",
    "Design a request-reply protocol with framing, a sequence tag and a per-command timeout, and log every exchange.",
  ],
  review: {
    status: "technically-reviewed",
    note: "pyserial API per its documentation (Serial, timeout semantics, readline, reset_input_buffer, in_waiting). Protocol patterns are general practice.",
  },
  references: [
    { title: "pyserial documentation: Serial class, timeouts, readline, reset_input_buffer", url: "https://pyserial.readthedocs.io/", note: "read returns up to n bytes or whatever arrived before the timeout." },
    { title: "Lesson: UART framing and baud tolerance", note: "The physical layer under all of this." },
  ],
  steps: [
    {
      type: "scenario",
      title: "The test that passed 95 % of the time",
      body: `A nightly test sends \`MEAS?\` to a device every second and checks that the reply is a voltage within limits. One run in twenty fails with "could not convert string to float: 'OK'". The device is fine. The cable is fine. The failure never happens when someone watches.

The device replies \`OK\` to a configuration command, and the reply arrived after the script had already timed out waiting for it and moved on. The next read, meant for \`MEAS?\`, received the \`OK\` instead, and the real measurement sat in the buffer for the read after that. Every reply from then on was one command late.

This lesson is how to make that impossible.`,
    },
    {
      type: "concept",
      title: "pyserial in five calls, and bytes versus text",
      body: `\`\`\`python
import serial
ser = serial.Serial('/dev/ttyUSB0', 115200, timeout=1.0)   # 8N1 by default
ser.reset_input_buffer()                                     # discard anything stale
ser.write(b'MEAS?\\n')                                        # bytes, with the terminator
line = ser.readline()                                        # bytes up to '\\n' or until timeout
text = line.decode('ascii', errors='replace').strip()
ser.close()
\`\`\`

Before any script, put a logic analyser or a terminal on TX and RX for one minute: it shows the baud rate, the framing (8N1 or otherwise), whether the device uses a CRC on its frames, what the ICD says the line ending is, and whether the device echoes. Write those at the top of the script.

**Bytes, not strings.** The port moves bytes. \`write\` takes \`bytes\` (\`b'...'\` or \`text.encode()\`); \`read\` and \`readline\` return \`bytes\` that you \`decode\`. A device that sends a non-ASCII byte (noise during reset, a binary frame) will crash a naive \`decode()\`; \`errors='replace'\` keeps the script alive and the log honest.

**What timeout means.** \`timeout=1.0\` is the longest a single \`read\` or \`readline\` waits. On timeout, \`readline\` returns *whatever arrived*, possibly an empty \`b''\` or a partial line with no terminator. It does not raise. A script that does not check for the terminator treats a partial line as a reply.

**Stale input.** Bytes that arrive after you stop waiting do not vanish; they sit in the input buffer until the next read. That is the scenario: a late reply becomes the next command's answer. \`reset_input_buffer()\` before a command discards the stale bytes, and \`in_waiting\` tells you how many are there.

**Other settings that bite.** The device's reset line is often wired to DTR or RTS; opening the port can reset an Arduino-style board, which then takes a second to boot and prints a banner into your first read. Set \`dsrdtr\`/\`rtscts\` as the device expects, and wait for the banner.`,
      deeper: {
        title: "Line endings and echo",
        body: `Devices differ on terminators: \`\\n\`, \`\\r\\n\`, or \`\\r\` alone (which \`readline\` does not stop at by default). Some echo every character you send, so the first line you read back is your own command. Both are discovered in one minute with a terminal program before any script is written, and both belong in the protocol notes at the top of the script.`,
      },
    },
    {
      type: "lab",
      title: "Run it yourself: bytes, text and partial lines",
      lab: "py-bytes-str",
      body: `Everything the concept step said about bytes versus text, run on your own machine. Note three things in the output: \`decode()\` is what turns \`b"..."\` into a string you can compare; a baud-mismatch byte such as \`0xff\` does not decode as ASCII and the script reports *where* instead of crashing; and a reply that arrives in pieces is only usable once the terminator has been seen, which is why the accumulate-and-split loop exists.`,
      tryNext: `Change the terminator in the accumulate loop to \`b"\\n"\` only and run again. The lines now end in a stray \`\\r\`: find it in the output, then explain why \`.strip()\` hides this bug on the bench until a device sends a bare \`\\n\`.`,
    },
    {
      type: "example",
      title: "Worked example: a request-reply helper that cannot drift",
      body: `\`\`\`python
import time, serial

class Dut:
    def __init__(self, port, baud=115200):
        self.ser = serial.Serial(port, baud, timeout=0.1)
        self.seq = 0
        self.log = open('dut_log.txt', 'a')

    def cmd(self, text, timeout=1.0):
        self.seq += 1
        tag = f'#{self.seq}'
        self.ser.reset_input_buffer()                 # 1. nothing stale can be mistaken for the reply
        req = f'{tag} {text}\\n'.encode()
        t0 = time.time()
        self.ser.write(req)
        deadline = t0 + timeout
        while time.time() < deadline:                 # 2. per-command deadline, not per-read
            line = self.ser.readline()
            if not line.endswith(b'\\n'):
                continue                              # 3. partial lines are not replies
            reply = line.decode('ascii', 'replace').strip()
            self.log.write(f'{t0:.3f} TX {req!r}\\n{time.time():.3f} RX {reply!r}\\n')
            if reply.startswith(tag):                 # 4. the reply must carry this request's tag
                return reply[len(tag):].strip()
            # a late reply to an earlier command: logged, ignored, keep waiting
        raise TimeoutError(f'{tag} {text}: no tagged reply within {timeout}s')
\`\`\`

The device echoes the tag it was sent (\`#17 OK\`, \`#18 3.2987\`). Four rules make the exchange unambiguous: flush before sending, wait against a deadline rather than a single read, accept only complete lines, and match the reply to the request by tag. The log records every byte in and out with timestamps, so when something does go wrong the evidence is already there. If the firmware cannot echo a tag, the next best thing is to match the reply's *shape* (a number for MEAS?, OK for a setting) and to discard anything else.`,
    },
    {
      type: "lab",
      title: "Run it yourself: a request-reply helper that cannot drift",
      lab: "py-request-reply",
      body: `The worked example's helper against a fake port that misbehaves exactly like the mission's instrument: the reply to \`SLOW\` turns up only after the *next* request. Watch what the helper does: it flushes stale input before writing, tags every request with a sequence number, times out instead of waiting forever, and when the late reply finally arrives tagged \`2\` during request \`3\`, it is ignored rather than returned as the value for \`VOLT\`. Swap \`FakePort\` for \`serial.Serial(...)\` and the same helper runs on the bench.`,
      tryNext: `Remove the \`port.reset_input_buffer()\` line and run again. Which request now receives the wrong value, and what in the printed output tells you so?`,
    },
    {
      type: "exercise",
      exercise: {
        kind: "single",
        id: "stale-reply-cause",
        skill: "python-automation",
        objective: "Diagnose a one-command-late reply stream.",
        prompt: `A script sends \`SET 5\` then \`MEAS?\` and receives \`OK\` for \`MEAS?\`, then a number for the next \`SET\`. Every reply is one command late. What happened?`,
        options: [
          { id: "a", text: "The reply to SET 5 arrived after the script's read timed out, stayed in the input buffer, and was returned as the reply to MEAS?.", correct: true, feedback: `Yes. A timeout does not cancel the device's reply; it just stops you waiting. The late bytes are consumed by the next read. Flush before each command, wait against a deadline, and match replies to requests.` },
          { id: "b", text: "The baud rate is slightly off, so characters are corrupted.", correct: false, feedback: `A baud error corrupts characters; it does not shift whole, well-formed replies by one command.` },
          { id: "c", text: "pyserial's readline returns lines in reverse order.", correct: false, feedback: `It returns bytes in the order they arrived. The order is right; the alignment with your commands is wrong.` },
          { id: "d", text: "The device needs a longer line ending, \\r\\n.", correct: false, feedback: `A terminator problem would give partial lines or none, not a clean one-command shift.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "order",
        id: "request-reply-order",
        skill: "python-automation",
        objective: "Order a robust request-reply exchange.",
        prompt: `Put the steps of a robust serial request-reply in order.`,
        items: [
          { id: "flush", text: "Discard stale input (reset_input_buffer)", why: "Nothing left over can be mistaken for this reply." },
          { id: "send", text: "Send the tagged, terminated request and log it with a timestamp", why: "The tag ties the reply to this request; the log is evidence." },
          { id: "read", text: "Read lines until the deadline, ignoring partial lines", why: "A per-command deadline tolerates slow replies without a huge per-read timeout." },
          { id: "match", text: "Accept only a complete line carrying this request's tag; log and ignore others", why: "Late replies to earlier commands are seen and discarded, not misattributed." },
          { id: "fail", text: "Raise a timeout with the tag and command if the deadline passes", why: "A missing reply is a failure with evidence, never a silent pass or a shifted stream." },
        ],
        correctOrder: ["flush", "send", "read", "match", "fail"],
        solvedFeedback: `Correct. Flush, send and log, read to a deadline, match by tag, fail loudly.`,
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "multi",
        id: "pyserial-facts",
        skill: "python-automation",
        objective: "Know pyserial's timeout and buffer behaviour.",
        prompt: `Select **every** true statement about pyserial.`,
        options: [
          { id: "a", text: "readline returns whatever arrived, possibly a partial line, when the timeout expires; it does not raise.", correct: true, feedback: `Check for the terminator yourself.` },
          { id: "b", text: "write takes bytes; text must be encoded first.", correct: true, feedback: `b'MEAS?\\n' or 'MEAS?\\n'.encode().` },
          { id: "c", text: "Bytes that arrive after a timeout are discarded automatically.", correct: false, feedback: `They wait in the input buffer for the next read; that is the stale-reply fault.` },
          { id: "d", text: "Opening the port can toggle DTR or RTS and reset some boards.", correct: true, feedback: `Expect a boot delay and a banner on such devices, or configure the control lines.` },
          { id: "e", text: "A timeout of 1 s guarantees every reply is received within 1 s.", correct: false, feedback: `A timeout bounds how long you wait, not how long the device takes.` },
        ],
        solvedFeedback: `Right. Timeouts bound waiting, not the device; partial lines are returned, not raised; stale bytes persist; control lines can reset boards.`,
      },
    },
    {
      type: "interview",
      questionId: "flaky-test-diagnosis",
      intro: `Tell the one-command-late story, name the two mechanisms (timeout shorter than the reply, stale buffer) and the four-rule fix. It is a concrete, honest automation story even if the device was a lab bench supply.`,
    },
    {
      type: "recap",
      summary: `- pyserial: Serial(port, baud, timeout), write(bytes), readline() → bytes, decode with errors='replace', reset_input_buffer(), in_waiting.
- A timeout bounds waiting, not the device; readline returns partial lines; late bytes persist in the buffer and shift every later reply by one.
- Robust exchange: flush, send a tagged terminated request, read to a deadline, accept only complete tagged lines, fail loudly with the tag.
- Log every TX and RX with timestamps; judge later.`,
      cards: [
        { id: "ser-1", front: "What does readline do when the timeout expires?", back: "Returns whatever bytes arrived, possibly empty or a partial line without a terminator; it does not raise. Check the terminator yourself." },
        { id: "ser-2", front: "Why do replies become one command late?", back: "A reply arrived after the read timed out, stayed in the input buffer, and was consumed by the next read. Flush before each command and match replies to requests." },
        { id: "ser-3", front: "Four rules for a robust request-reply?", back: "Flush stale input; send a tagged, terminated request; read to a per-command deadline accepting only complete lines; match the reply by tag or shape and fail loudly otherwise." },
        { id: "ser-4", front: "Bytes or strings on a serial port?", back: "Bytes. write takes bytes; read returns bytes; decode with errors='replace' so a noise byte cannot crash the script." },
      ],
    },
  ],
};
