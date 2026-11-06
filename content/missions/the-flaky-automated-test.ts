import type { Mission } from "@/lib/content/schema";

export const theFlakyAutomatedTest: Mission = {
  slug: "the-flaky-automated-test",
  moduleId: "python-test",
  title: "The flaky automated test",
  summary: "A nightly Python test of a device's serial interface fails one run in twenty with a reply that belongs to the previous command. Find the mechanism from the log and fix the protocol, not the symptom.",
  durationMinutes: 12,
  budgetMinutes: 35,
  whyItMatters: "Flaky tests are where automation loses a team's trust. The engineer who reads the timestamps, finds the mechanism and fixes the exchange so it cannot drift is the one who gets to automate the next thing.",
  relatedLesson: "serial-automation-and-test-logs",
  scenario: `**Setup:** a Python test talks to a device under test over USB-serial at 115200 baud, a plain UART link with line-terminated ASCII replies and no CRC, as the device's ICD describes. Each cycle sends \`SET GAIN 4\`, expects \`OK\`, sends \`MEAS?\`, expects a number, checks the number against limits. 500 cycles per night.

**Symptom:** about one run in twenty fails with \`ValueError: could not convert string to float: 'OK'\`, and the following cycles fail too until the script is restarted. The firmware team says the device is fine; the test team says the firmware is flaky. The device has a calibration step after a gain change that takes "a little while".

Every reading below is **simulated for this mission**, written to be realistic; it is not data from real hardware.

Find the mechanism with evidence and choose a fix that makes the exchange unambiguous.`,
  goal: `Show from the log that a late reply to SET GAIN is consumed as the reply to MEAS?, explain the two code faults (timeout shorter than the device's worst-case reply, no flush or reply matching), and fix the protocol.`,
  actions: [
    {
      id: "read-log",
      label: "Read the test log around a failure, with timestamps",
      category: "document",
      costMinutes: 4,
      assessment: "key",
      result: `\`23:41:02.110 TX 'SET GAIN 4'\`, \`23:41:03.112 RX ''\` (timeout), \`23:41:03.113 TX 'MEAS?'\`, \`23:41:03.140 RX 'OK'\`, \`23:41:03.141 ValueError\`. In successful cycles the OK arrives 20 to 300 ms after SET GAIN; in this one it arrived 1 030 ms after.`,
      assessmentNote: `The decisive evidence: the reply to SET GAIN arrived 30 ms after the 1 s timeout and was read as the reply to MEAS?. The log's timestamps make the mechanism visible without touching hardware.`,
      evidence: "late-reply-seen",
    },
    {
      id: "measure-rate",
      label: "Run the SET GAIN step 200 times and histogram the reply latency",
      category: "firmware",
      costMinutes: 6,
      assessment: "useful",
      result: `Reply latency: median 40 ms, 95th percentile 310 ms, maximum 1 420 ms. The slow tail coincides with the device's calibration step, which the firmware runs when the gain changes and its temperature drifted.`,
      assessmentNote: `Quantifies the tail the timeout must cover and links it to the device's documented calibration. A number for the fix, not a guess.`,
      evidence: "latency-tail",
    },
    {
      id: "read-code",
      label: "Read the test's serial helper",
      category: "firmware",
      costMinutes: 4,
      assessment: "key",
      result: `\`ser = serial.Serial(port, 115200, timeout=1.0)\`; \`def cmd(s): ser.write((s+'\\n').encode()); return ser.readline().decode().strip()\`. No flush before a command, no deadline beyond the single read, no check that the reply belongs to the request, no terminator check.`,
      assessmentNote: `Both code faults in one function: the fixed 1 s timeout is shorter than the device's worst case, and nothing stops a late reply being attributed to the next command.`,
      evidence: "no-matching",
    },
    {
      id: "firmware-docs",
      label: "Check the device's interface notes for the gain-change behaviour",
      category: "document",
      costMinutes: 3,
      assessment: "useful",
      result: `"After a gain change the device may run an auto-calibration of up to 2 s before replying OK. Hosts should wait for OK before issuing further commands."`,
      assessmentNote: `The device is behaving as documented. The test's timeout ignored the document.`,
      evidence: "documented-delay",
    },
    {
      id: "add-sleep",
      label: "Add time.sleep(2) after every SET GAIN",
      category: "firmware",
      costMinutes: 3,
      assessment: "risky",
      result: `Failures drop to about one in two hundred. The nightly run now takes 17 minutes longer, and the remaining failures look identical.`,
      assessmentNote: `A fixed sleep is a guess: too long for 95 % of replies and still too short for the 1.4 s tail plus USB jitter. It also hides the real defect, the unmatched exchange.`,
    },
    {
      id: "swap-cable",
      label: "Replace the USB cable and hub",
      category: "rework",
      costMinutes: 5,
      assessment: "neutral",
      result: `No change in failure rate. No framing errors in the log before or after.`,
      assessmentNote: `Cheap to rule out, but the log already showed clean, well-formed replies arriving late, which is timing, not signal integrity.`,
    },
    {
      id: "blame-firmware",
      label: "Raise a defect against the firmware for 'intermittent wrong replies'",
      category: "document",
      costMinutes: 2,
      assessment: "wasteful",
      result: `The firmware team replies with the interface note: the delay is documented and the replies are correct and in order.`,
      assessmentNote: `The device never sent a wrong reply; the host misattributed a late one. A defect without the mechanism wastes two teams' time.`,
    },
    {
      id: "long-timeout",
      label: "Set the serial timeout to 10 s",
      category: "firmware",
      costMinutes: 2,
      assessment: "neutral",
      result: `The one-in-twenty failure disappears over 2 000 cycles. A later test that sends two commands back to back without waiting still misattributes replies once.`,
      assessmentNote: `Covers the tail, so it fixes this symptom; it does not fix the exchange's lack of matching, which the next test pattern exposes.`,
      evidence: "timeout-covers-tail",
    },
    {
      id: "fix-protocol",
      label: "Rewrite the helper: flush before send, per-command deadline from the documented 2 s, complete-line check, reply matched by shape or tag",
      category: "firmware",
      costMinutes: 8,
      requiresAnyOf: ["read-code"],
      assessment: "key",
      result: `5 000 cycles overnight, zero failures. The log shows two late OKs during the run, each logged and discarded as "reply to #n after deadline" rather than consumed. Run time unchanged from the original.`,
      assessmentNote: `Confirmation by fix with evidence in the log: late replies still happen and are now handled, not hidden.`,
      evidence: "protocol-fixed",
    },
  ],
  diagnoses: [
    {
      id: "late-reply-misattributed",
      label: "The device's documented calibration delay sometimes exceeds the test's 1 s timeout; the late OK stays in the buffer and is read as the reply to MEAS?, because the helper never flushes or matches replies",
      correct: true,
      requiresEvidence: ["late-reply-seen", "no-matching"],
      feedback: `Correct. The log shows the OK arriving 30 ms after the timeout and being consumed by the next read; the helper has no flush, no deadline and no matching. Two faults, both in the host.`,
    },
    {
      id: "firmware-bug",
      label: "The firmware sends replies out of order",
      correct: false,
      feedback: `Every reply in the log is in order and well formed; one is late, as the interface note says it may be. The host misattributed it.` ,
    },
    {
      id: "cable",
      label: "The USB-serial link drops or corrupts characters",
      correct: false,
      feedback: `No framing errors, no corrupted replies, and a new cable changed nothing. The replies are clean; they are late.`,
    },
    {
      id: "python-bug",
      label: "pyserial's readline has a bug with long replies",
      correct: false,
      feedback: `readline behaved as documented: it returned an empty result at the timeout and the late bytes at the next call.`,
    },
  ],
  fixes: [
    {
      id: "protocol",
      label: "Flush before each command, read to a per-command deadline derived from the documented 2 s calibration, accept only complete lines, match each reply to its request, log every exchange",
      quality: "best",
      feedback: `The exchange cannot drift: late replies are logged and discarded, the deadline comes from the device's document, and the log is evidence for the next flaky day.`,
    },
    {
      id: "timeout-10s",
      label: "Raise the serial timeout to 10 s",
      quality: "acceptable",
      feedback: `It covers the tail and the nightly run goes green. The helper still cannot tell one reply from another, which the next back-to-back command pattern will expose.`,
    },
    {
      id: "sleep",
      label: "Add a fixed 2 s sleep after gain changes",
      quality: "wrong",
      feedback: `Slower every night, still fails on the 1.4 s tail plus jitter, and leaves the misattribution mechanism in place.`,
    },
  ],
  optimalPath: ["read-log", "read-code", "fix-protocol"],
  debrief: `Three actions, sixteen minutes, no hardware touched. The timestamps in the log showed a reply arriving 30 ms after a timeout and being read as the answer to the next command; the helper showed why nothing prevented that. The interface note and the latency histogram turned "a little while" into 2 s for the deadline.

The traps were the ones every flaky test attracts: a sleep, a cable, a defect ticket against the other team. None of them touched the mechanism. The fix is a protocol that matches replies to requests and treats a late reply as a logged event, not as data.

In an interview, this is the story of a test you made trustworthy, with timestamps as the evidence and a mechanism as the explanation.`,
  references: [
    { title: "pyserial documentation: timeout semantics and input buffer behaviour", note: "readline returns what arrived at timeout; later bytes remain in the buffer." },
  ],
};
