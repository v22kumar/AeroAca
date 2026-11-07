import type { Lesson } from "@/lib/content/schema";

export const logsToEvidence: Lesson = {
  slug: "logs-to-evidence",
  moduleId: "python-advanced",
  format: "arc",
  prerequisites: ["serial-automation-and-test-logs"],
  title: "From logs to evidence: parse, check, count what you could not read",
  summary: "Turn a raw test log into a report a reviewer can trust: a regular expression that parses each line, a verdict from stated limits, a count of every line that could not be read, honest statistics, and a table with the raw numbers behind each verdict.",
  durationMinutes: 16,
  whyItMatters: "'How did you measure the 60 % reduction in test time?' and 'show me the report' both start from a log. A script that prints 'all passed' and silently skips what it could not parse is how overnight regressions hide real failures. This lesson is the habit that prevents it.",
  objectives: [
    "Write a regular expression with named groups that parses a log line, and read a second pattern for key=value pairs.",
    "Give each run one of three verdicts, PASS, FAIL or NO DATA, from limits written in one place, and never count NO DATA as a pass.",
    "Count and print every line the parser could not read.",
    "Report n, mean, standard deviation, minimum and maximum, and say what the mean hides.",
  ],
  review: {
    status: "technically-reviewed",
    note: "Python re and statistics standard-library behaviour as documented. The log, the limits and every number come from a SYNTHETIC log written for this lesson and reproduced exactly by the lab: ten runs, eight PASS, one FAIL, one NO DATA, one unparsed line. No real product or test is described.",
  },
  references: [
    { title: "Python documentation: re (regular expressions) and statistics", url: "https://docs.python.org/3/library/re.html", note: "Named groups, compile, match; mean and stdev." },
    { title: "Lesson: Serial communication and test logs in Python", note: "How the log gets written in the first place." },
    { title: "Lesson: Writing a trustworthy test case", note: "Limits come from a requirement, not from the data." },
  ],
  steps: [
    {
      type: "scenario",
      stage: "why",
      title: "The average that passed",
      body: `A boot-time test ran six times overnight. The morning script prints: *TC-101: mean boot time 885 ms, limit 900 ms, PASS*.

The engineer is about to sign it off when a colleague opens the raw log. Run 3 booted in **1190 ms**, well over the limit. Run 5 never produced a boot message at all: it timed out. And one line in the middle of the file is not a test line at all, it reads *serial buffer overrun, 14 bytes dropped*.

The script averaged only the runs it could read, hid the one that failed behind four good ones, left out the one that timed out and never mentioned the line it ignored. Every sentence it printed was true, and the conclusion was wrong.

A report is evidence only if it shows what it counted and what it left out.`,
    },
    {
      type: "concept",
      stage: "intuition",
      depth: "understand",
      title: "A ledger, not a headline",
      body: `Think of an accountant's ledger. Every transaction has its own line, and the ledger ends with a total. If a receipt is torn and cannot be read, the accountant does not leave it out. They write "one receipt unreadable" in the margin, so the total is not trusted blindly.

A test report is the same. The raw log is the pile of receipts. The report is the ledger: one line per run with its verdict and its numbers, then the totals, then the margin notes for everything that could not be read.

A headline such as "all passed" hides the lines. A ledger lets a reviewer check any total against its lines in seconds, and see at once what was **not** counted.

Three rules follow, and the rest of the lesson is how to apply them in code:

- Every line in the log is accounted for: parsed, or counted as unparsed.
- Every run gets a verdict that can be traced to its numbers.
- A run with no data is never a pass.`,
    },
    {
      type: "concept",
      stage: "theory",
      depth: "understand",
      title: "The four steps and the three verdicts",
      body: `Turning a log into a report is four steps, each small enough to test on its own.

1. **Parse.** Read each line with a **regular expression**. A pattern with named groups pulls out the run number, the case and the rest of the line. A second pattern pulls out every \`name=number\` pair, so a new measurement needs no new code.
2. **Check.** Compare each measurement with its **limits**, kept in one table, with each limit taken from a requirement. Never from the data.
3. **Decide.** One verdict per run: **PASS** if every measurement is inside its limits, **FAIL** if any is outside, **NO DATA** if the run produced no measurements, for example a timeout.
4. **Summarise.** Count the verdicts. Report n, mean, standard deviation, minimum and maximum for each case. Print the unparsed lines.

NO DATA is its own verdict because "nothing was measured" is not the same as "it was fine". If it were counted as a pass, a dead unit would score perfectly.

A **regression test** report is read by a person who did not run the test. Every number in it should be reproducible from the log file named in the report.`,
    },
    {
      type: "walkthrough",
      stage: "how",
      depth: "understand",
      title: "The parser, line by line",
      intro: `This is a trimmed version of the lab's parser. It keeps two lists: runs it understood, and lines it did not.`,
      language: "python",
      code: `LINE = re.compile(r"^(?P<ts>\\S+) (?P<level>INFO|WARN|ERROR)\\s+run=(?P<run>\\d+) case=(?P<case>[\\w-]+) (?P<rest>.*)$")
PAIR = re.compile(r"(\\w+)=([\\d.]+)")

def parse(text):
    runs, unparsed = [], []
    for n, line in enumerate(text.splitlines(), 1):
        m = LINE.match(line)
        if not m:
            unparsed.append((n, line))
            continue
        values = {k: float(v) for k, v in PAIR.findall(m["rest"])}
        runs.append({"run": int(m["run"]), "case": m["case"], "values": values})
    return runs, unparsed`,
      notes: [
        { lines: "1", text: `One pattern for the whole line: timestamp, level, \`run=\`, \`case=\`, and everything else captured as \`rest\`. The names inside \`(?P<name>...)\` become keys.` },
        { lines: "2", text: `A second pattern finds every \`name=number\` pair inside \`rest\`. A new measurement in the log is picked up with no code change.` },
        { lines: "4-6", text: `Walk the lines with their numbers. The two lists, \`runs\` and \`unparsed\`, are the whole point: everything ends up in one of them.` },
        { lines: "8-10", text: `If the line does not match, **keep it** with its line number and move on. This is the rule that stops a report silently dropping data.` },
        { lines: "11-12", text: `Build a dictionary of the numbers. A run that timed out has none, so its dictionary is **empty**, which is exactly what the verdict step uses to say NO DATA.` },
      ],
    },
    {
      type: "example",
      stage: "example",
      depth: "understand",
      title: "Worked example: the same log, read as a ledger",
      body: `The synthetic log has **ten** runs of two cases, TC-101 and TC-102, and one stray line. The limits are boot time 0 to 900 ms, the 3.3 V rail 3135 to 3465 mV (±5 %) and current 0 to 60 mA.

**Run 3:** boot_time_ms=1190. Outside 0 to 900. Verdict **FAIL**, with the reason *boot_time_ms=1190 outside (0, 900)*. The line's level was only WARN: the verdict comes from the number, not from the word.

**Run 4:** rail 3150 mV. Inside 3135 to 3465, so **PASS**, but only 15 mV above the lower limit. A reviewer would want that visible, so the number stays in the table.

**Run 5:** *TIMEOUT waiting for banner after 5000 ms*. No numbers. Verdict **NO DATA**, never a pass.

**Line 9:** *serial buffer overrun, 14 bytes dropped*. Not a run. Printed as **unparsed**.

**Totals:** 10 runs, **8 PASS, 1 FAIL, 1 NO DATA**.

**Statistics for TC-101:** five runs gave data, boot times 812, 805, 1190, 809 and 811. Mean is 4427 / 5 = **885.4 ms**, which is under the 900 limit, and says nothing about the 1190. That is the scenario's trap, now visible.`,
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "understand",
      exercise: {
        kind: "numeric",
        id: "mean-guided",
        skill: "logs-evidence",
        objective: "Compute the mean of the runs that produced data (guided).",
        prompt: `TC-101 produced these boot times in milliseconds: 812, 805, 1190, 809 and 811. What is their mean, in milliseconds, to one decimal place?`,
        unit: "ms",
        answer: 885.4,
        tolerance: 0.1,
        hints: [
          `The mean is the sum divided by the number of values.`,
          `There are five values. Add them: 812 + 805 + 1190 + 809 + 811.`,
          `The sum is 4427. Divide by 5.`,
        ],
        solution: `The sum is 812 + 805 + 1190 + 809 + 811 = 4427. Divided by 5 that is **885.4 ms**. Notice it is under the 900 ms limit, even though one run was at 1190.`,
        solvedFeedback: `Right: 885.4 ms. A mean under the limit says nothing about the worst run, which is why the report also prints the maximum.`,
        misconceptions: [
          { value: 809.25, tolerance: 0.1, feedback: `809.25 is the mean without the 1190 ms run. The FAIL run is a real run that produced data, so it stays in: 4427 / 5 = 885.4.` },
          { value: 737.8, tolerance: 0.1, feedback: `That divides by 6, counting the run with no data. A run with no measurement has no value to add, so n is 5: 4427 / 5 = 885.4.` },
        ],
      },
    },
    {
      type: "lab",
      stage: "practice",
      depth: "apply",
      title: "Run it yourself: parse, verdict, count, summarise",
      lab: "py-log-report",
      body: `The script holds the synthetic log inside itself, parses it with the two patterns, checks each run against the limits, and prints one table with the raw numbers, the totals, the statistics and the unparsed line. Find run 3, run 4, run 5 and line 9 in the output.`,
      tryNext: `Add a line to the log that has a typo in a field name, then run again: what happens to it? Change a limit and see which verdicts change. Then change the regular expression so it is stricter and see how many lines move to the unparsed list. Why is a visible unparsed count better than a parser that always finds something?`,
    },
    {
      type: "concept",
      stage: "how",
      depth: "apply",
      title: "Statistics that do not flatter",
      body: `For each case report five numbers: **n**, the **mean**, the **standard deviation**, the **minimum** and the **maximum**.

- **n** says how many runs the rest is based on. A mean of two runs is an anecdote.
- The **mean** is the centre, and it can hide a tail. In the lab it is 885.4 ms for TC-101 and passes, while one run is at 1190.
- The **standard deviation** says how spread out the runs are. For TC-101 it is 170.3 ms against 2.2 ms for TC-102: the first case is unstable, and the second is steady.
- The **minimum** and **maximum** show the extremes. The limit applies to **each run**, so the maximum is compared with it, not the mean.

Say what is in the statistics. In the lab the FAIL run **is** included, the NO DATA run is excluded and counted separately, and the report prints that note.

A good report also names what it was computed from: the log file, the date, the version of the script and where each limit came from, such as a requirement number. Then a reviewer can repeat it.`,
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "apply",
      exercise: {
        kind: "multi",
        id: "honest-report",
        skill: "logs-evidence",
        objective: "Recognise the features of an honest test report.",
        prompt: `Select **every** feature that makes a test report trustworthy.`,
        options: [
          { id: "a", text: "Lines that could not be parsed are counted and printed with their line numbers.", correct: true, feedback: `Yes. It stops the report silently dropping data and shows the reader what was not read.` },
          { id: "b", text: "A run with no measurements is reported as NO DATA and never counted as a pass.", correct: true, feedback: `Yes. A unit that never booted must not improve the pass rate.` },
          { id: "c", text: "Each verdict is shown beside the raw numbers it came from.", correct: true, feedback: `Yes. A reviewer can check any verdict against its numbers without opening the log.` },
          { id: "d", text: "Only the mean is shown, because it summarises the runs in one number.", correct: false, feedback: `A mean can sit under the limit while one run is far over it. The maximum and the per-run verdicts are what show that.` },
        ],
        solvedFeedback: `Right: count the unreadable lines, never turn NO DATA into a pass, and keep the raw numbers beside every verdict. A lone mean hides the tail.`,
      },
    },
    {
      type: "concept",
      stage: "complexity",
      depth: "master",
      title: "How reports mislead, even with correct code",
      body: `Five ways a correct-looking report can still mislead, and the defence against each.

**A pattern too strict.** A small change in the log format and the regular expression matches nothing. The defence is the unparsed count, and a check that the number of runs found is what was expected.

**A pattern too loose.** It matches a line it should not and invents a run. Test the parser with lines that look similar and must not match.

**Limits taken from the data.** Setting a limit just above the worst run makes everything pass. Limits come from a requirement, with its identifier in the report.

**Statistics over mixed runs.** Averaging runs of different cases, firmware or temperatures mixes populations. Group first, then summarise.

**A report that cannot be repeated.** If the script, the log or the limits change, the numbers change. The report names the version and the file, and the log is kept.

One more caution: a clean report on a **flaky test** may only mean the flake did not strike this time. Repeat the run and look at the spread before concluding it is fixed.

The report is the evidence. The log is the proof behind it. Keep both.`,
    },
    {
      type: "exercise",
      stage: "check",
      depth: "master",
      exercise: {
        kind: "single",
        id: "mean-vs-limit",
        skill: "logs-evidence",
        objective: "Draw the right conclusion from a mean under the limit.",
        prompt: `A case has a limit of 900 ms for **each** run. The report shows n = 5, mean 885.4 ms, maximum 1190 ms, and one further run with NO DATA. What is the correct conclusion?`,
        options: [
          { id: "a", text: "The case passes: the mean is under 900 ms.", correct: false, feedback: `The limit applies to each run, not to the mean. The 1190 ms run is outside it, so the case has a failure.` },
          { id: "b", text: "The case fails: at least one run is outside the limit, and a second run produced no data and must be investigated before anything is claimed.", correct: true, feedback: `Right. A failing run fails the case, and a NO DATA run is unresolved. Neither is hidden by the mean, which is why the report prints the maximum and the NO DATA count.` },
          { id: "c", text: "The case passes with five of six runs good, which is 83 %.", correct: false, feedback: `A pass rate of runs that happened to give data hides the failing run and the one with no data. Neither a 1190 ms boot nor a timeout is a good run.` },
          { id: "d", text: "Rerun until the mean is lower and then report that.", correct: false, feedback: `Repeating until the number looks better is selecting data. Reruns are for diagnosing a failure, and every run stays in the record.` },
        ],
      },
    },
    {
      type: "interview",
      stage: "check",
      depth: "master",
      questionId: "logs-to-evidence-report",
      intro: `Your script shows a mean under the limit. A reviewer asks how you know the case really passed. Walk through what the report must show.`,
    },
    {
      type: "concept",
      stage: "work",
      depth: "understand",
      title: "Where you will use this",
      body: `- **Embedded development.** Firmware logs on a serial console are the first evidence of a boot-time or current regression; a small parser that counts what it could not read is a good habit from the first day.
- **Aerospace and UAV systems.** Test reports for a bench or a flight-test replay are built from logs with limits taken from requirements, and reviewed line by line.
- **R&D and design.** Characterisation data, such as a rail across many boards, is summarised with n, mean, spread and extremes; the same report shape applies.
- **Verification and interviews.** "How did you know the run passed?" and "what did your report leave out?" are common probes. The ledger answer, every line accounted for, is the strong reply.`,
    },
    {
      type: "recap",
      summary: `- A report is a ledger: every log line is parsed or counted as unparsed, every run has a verdict traced to its numbers, and nothing is dropped silently.
- Parse with a regular expression with named groups and a second pattern for name=number pairs.
- Three verdicts: PASS, FAIL (any measurement outside its limits) and NO DATA, which is never a pass.
- Limits come from a requirement and live in one place; never set them from the data.
- Report n, mean, standard deviation, minimum and maximum. The limit applies per run, so a mean under it proves nothing; name the log, the date and the script version.`,
      cards: [
        { id: "logev-1", front: "Why print the lines the parser could not read?", back: "So a report never silently drops data. A strict pattern or a changed log format would otherwise make runs vanish and the totals look better than the truth." },
        { id: "logev-2", front: "Why is NO DATA a separate verdict?", back: "Because 'nothing was measured' is not 'fine'. Counting a timeout as a pass would let a dead unit improve the score." },
        { id: "logev-3", front: "Why is a mean under the limit not enough?", back: "The limit applies to each run. A mean can sit under it while one run is far over; the maximum and the per-run verdicts show that." },
        { id: "logev-4", front: "Where do limits come from, and what else does a report name?", back: "Limits come from a requirement, never from the data. The report also names the log file, the date and the version of the script, so a reviewer can repeat it." },
      ],
    },
  ],
};
