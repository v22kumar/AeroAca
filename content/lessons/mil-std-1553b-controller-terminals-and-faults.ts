import type { Lesson } from "@/lib/content/schema";

export const milStd1553bControllerTerminalsAndFaults: Lesson = {
  slug: "mil-std-1553b-controller-terminals-and-faults",
  moduleId: "avionics-buses",
  format: "arc",
  prerequisites: ["mil-std-1553b-the-word-and-the-message"],
  title: "1553 on a real rig: the schedule, the load and reading a monitor log",
  summary: "The bus controller is a scheduler. Learn how its timetable is built, how to compute how full the bus is, and how to read a bus-monitor capture message by message and say, with evidence, why a terminal did not answer.",
  durationMinutes: 16,
  whyItMatters: "In an avionics integration lab the evidence is a bus-monitor capture. Engineers who can read it, count the microseconds and name the fault class are the ones who find the cause in minutes instead of swapping boxes for a week.",
  objectives: [
    "Explain the bus controller's timetable (major and minor frames) in plain words and say what a remote terminal is allowed to do within it.",
    "Compute the duration of a message and the loading of a bus from a schedule, showing every step.",
    "Read a monitor log line by line and classify each message: clean, late, no response, illegal command, broadcast, parity error.",
    "Say what a clean status word does and does not prove, and why a retry on the other bus can hide a failing terminal.",
  ],
  review: {
    status: "technically-reviewed",
    note: "Message formats, the 4 to 12 µs response window, the 14 µs no-response time and the 4 µs minimum gap follow MIL-STD-1553B. The typical response time (8 µs) and intermessage gap (10 µs) used in the arithmetic are common values chosen for the worked examples, not requirements. The monitor log is synthetic and was generated for this lesson; the lab decodes it exactly.",
  },
  references: [
    { title: "MIL-STD-1553B, Digital Time Division Command/Response Multiplex Data Bus (with Notice 2)", note: "Message formats, response time, intermessage gap, mode codes." },
    { title: "MIL-HDBK-1553A, Multiplex Applications Handbook", note: "Bus controller design, schedules and bus loading in practice." },
    { title: "Lesson: MIL-STD-1553B: the word and the message", note: "The words, the three message formats and the timing windows this lesson builds on." },
  ],
  steps: [
    {
      type: "scenario",
      stage: "why",
      title: "Seven messages, five of them fine",
      body: `A flight-control computer on an integration rig reports "stale data from terminal 9" about once a minute. The integration engineer connects a bus monitor and captures one frame of traffic: eight messages, a few hundred microseconds each.

Three of the eight look wrong. One answer came late. One terminal set an error flag and sent nothing. One command got no answer at all, until the controller asked again on the second bus and was answered at once.

The team's first plan is to swap terminal 9. The engineer's plan is to read the capture first, message by message, and write one line of evidence for each. This lesson teaches that reading, and the arithmetic behind it.`,
    },
    {
      type: "concept",
      stage: "intuition",
      depth: "understand",
      title: "The bus controller is a timetable",
      body: `Think of a railway timetable. The same list of departures repeats every day, at fixed times. Nobody improvises, and everyone knows when their train leaves.

The bus controller runs a timetable of **messages**. Each message is one question and its answer. The whole list repeats forever. A terminal never speaks first; it answers when the controller asks, and only then.

The timetable is built in two sizes. A short, fixed slot is called a **minor frame**, say 20 ms. A longer repeat that contains several minor frames is a **major frame**, say 200 ms. Fast things, such as control surface commands, are asked in every minor frame. Slow things, such as temperatures, are asked once per major frame.

Because the schedule is fixed, the traffic is predictable, and that is why this bus is trusted in aircraft. When something goes wrong, you do not ask "what happened?" You ask "which line of the timetable was not honoured?"`,
    },
    {
      type: "figure",
      stage: "how",
      depth: "understand",
      title: "Two messages on a timeline",
      diagram: "mil1553-message",
      alt: "Two MIL-STD-1553B message formats on a timeline: controller to terminal with data then status, and terminal to controller with status then data, with the response time window and intermessage gap.",
      caption: "Every word lasts 20 µs. The amber gap is the terminal's response time (4 to 12 µs). Between messages the controller leaves at least 4 µs of silence.",
      body: `Read the top timeline from left to right: the controller's command, its data, a short pause, the terminal's status. Then read the bottom one, where the terminal sends its data after its status.`,
    },
    {
      type: "concept",
      stage: "theory",
      depth: "understand",
      title: "How long does a message take?",
      body: `Every word, command, status or data, lasts **20 µs**. Add the pauses and you have the message's duration.

For a controller-to-terminal message with N data words:

**duration = command (20) + N × 20 + response time + status (20) + gap**

For a terminal-to-controller message, the order of the words changes but the total is the same: command, response time, status, then N data words, then the gap.

The two pauses are the **response time** (the terminal's thinking time, 4 to 12 µs allowed, 8 µs typical) and the **intermessage gap** (at least 4 µs, often about 10 µs in real schedules).

Example, 10 data words, 8 µs response, 10 µs gap: 20 + 200 + 8 + 20 + 10 = **258 µs**.

A **terminal-to-terminal** message is two commands, then one terminal's status and data, then the other's status: 20 + 20 + response + 20 + 20N + response + 20, plus the gap.`,
    },
    {
      type: "concept",
      stage: "theory",
      depth: "understand",
      title: "How full is the bus?",
      body: `**Bus loading** is the share of the time that words are on the wire. Add up the durations of every message in a minor frame, then divide by the length of that frame.

Worked example. A 20 ms minor frame carries:

- 8 messages of 10 words, controller to terminal: 8 × 258 µs = 2064 µs
- 5 messages of 20 words, terminal to controller (20 + 8 + 20 + 400 + 10 = 458 µs each): 2290 µs
- 4 terminal-to-terminal messages of 6 words (216 + 10 = 226 µs each): 904 µs

Total = 5258 µs. Loading = 5258 / 20 000 = **26 %**.

Why it matters: the other 74 % is not waste. It is where retries, occasional messages and growth go. A schedule that is 95 % full has no room to retry a failed message on the second bus without pushing the next message late. The acceptable loading is a program decision, written down in the interface control document.`,
    },
    {
      type: "example",
      stage: "example",
      depth: "understand",
      title: "Worked example: one message, to the microsecond",
      body: `The monitor shows this command at t = 1000 µs: word 0x2C64, then a status word at t = 1028 µs, then four data words.

**Step 1: decode the command.** 0x2C64 = \`0010 1100 0110 0100\`. Terminal 5, transmit, subaddress 3, 4 words (the previous lesson's worked example).

**Step 2: when did the command end?** It started at 1000 and lasts 20 µs, so it ended at **1020**.

**Step 3: when did the terminal answer?** Its status word started at 1028. Response time = 1028 − 1020 = **8 µs**. That is inside 4 to 12 µs, so on time.

**Step 4: when did the message end?** Status lasts 20 µs (1028 to 1048), then four data words at 20 µs each: 1048 + 80 = **1128**. The message occupied 1000 to 1128: 128 µs, plus the gap before the next one.

**Step 5: verdict.** Right command, right count of data words, response inside the window. Clean.

You will do exactly this for a failing message in the lab, and the numbers will tell you which kind of failure it is.`,
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "understand",
      exercise: {
        kind: "numeric",
        id: "msg-duration-guided",
        skill: "avionics-buses",
        objective: "Compute a message's duration (guided).",
        prompt: `A controller-to-terminal message carries **8 data words**. Take the response time as **8 µs** and the intermessage gap as **10 µs**. How long does the whole message take, in microseconds?`,
        unit: "µs",
        answer: 218,
        tolerance: 0,
        hints: [
          `Every word lasts 20 µs. Count the words on the wire: the command, the 8 data words and the terminal's status word.`,
          `That is 1 + 8 + 1 = 10 words, so 10 × 20 = 200 µs of words.`,
          `Add the two pauses: the 8 µs response time and the 10 µs gap.`,
        ],
        solution: `Words: command + 8 data + status = 10 words × 20 µs = 200 µs. Pauses: 8 + 10 = 18 µs. Total **218 µs**.`,
        solvedFeedback: `Right: 218 µs. Words plus pauses, nothing else.`,
        misconceptions: [
          { value: 200, tolerance: 0, feedback: `200 µs is the words alone. A message also includes the terminal's response time (8 µs) and the gap before the next message (10 µs): 218 µs.` },
          { value: 190, tolerance: 0, feedback: `You left out one word. Count the command, all 8 data words and the status word: 10 words, 200 µs, then add the 18 µs of pauses.` },
          { value: 180, tolerance: 0, feedback: `That is 9 words and no pauses. The status word is also a word on the wire (20 µs), and the response time and gap are real time too: 218 µs.` },
        ],
      },
    },
    {
      type: "walkthrough",
      stage: "how",
      depth: "apply",
      title: "How the monitor-log decoder groups words into messages",
      intro: `The lab below turns a raw capture into messages. This is the heart of that program: how it decides which word is a command and which is the terminal's status, and where one message ends.`,
      language: "python",
      code: `def decode(words):
    messages, i = [], 0
    while i < len(words):
        cmd = words[i]; i += 1
        rt, tr, sa, wc = fields(cmd.value)
        count = 32 if wc == 0 else wc
        m = {"cmd": cmd, "status": None, "data": [], "gap": None}
        end = cmd.t + WORD_US
        if tr == 0:
            while i < len(words) and words[i].sync == "D":
                m["data"].append(words[i]); end = words[i].t + WORD_US; i += 1
        if i < len(words) and words[i].sync == "C" and words[i].t - end <= NO_RESPONSE_US:
            m["status"] = words[i]; m["gap"] = words[i].t - end; i += 1
        messages.append(m)
    return messages`,
      notes: [
        { lines: "3-4", text: `Take the next word as a **command**. In this log a word with command/status sync that appears while the bus is idle is always a command; the controller is the only device that starts a message.` },
        { lines: "5-6", text: `Split the command into its four fields and turn the word count into a number. A count field of **0 means 32**, which is easy to forget and is the cause of the scenario's illegal-command message.` },
        { lines: "8", text: `Remember when the command (or its last data word) **ended**: start time plus 20 µs. Every response time is measured from this moment.` },
        { lines: "9-11", text: `If it was a **receive** command (T/R = 0) the controller sends the data words next. Collect every following data-sync word and move the end time to the end of the last one.` },
        { lines: "12-13", text: `The next command-sync word is the terminal's **status** only if it starts within 14 µs of the end. If it starts later, it is a new command and this message had **no response**. The gap, status start minus end, is the number you compare with 4 to 12 µs.` },
      ],
    },
    {
      type: "lab",
      stage: "practice",
      depth: "apply",
      title: "Run it yourself: decode a synthetic capture and judge every message",
      lab: "py-mon1553",
      body: `The program decodes the eight-message capture from the scenario (a synthetic log written for this lesson). For every message it prints the terminal, the direction, the subaddress, the word count, the status word and the response gap, then a verdict. Before you run it, read the log and write down your own verdict for each message. Then compare.`,
      tryNext: `Add a ninth message to the log: a command to terminal 5 whose status arrives 15 µs after the command ends. Predict what the program says, then run it. Next, change the word count of the t=1000 command from 4 to 5 and see which part of the output changes first.`,
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "apply",
      exercise: {
        kind: "numeric",
        id: "bus-loading",
        skill: "avionics-buses",
        objective: "Compute bus loading from a schedule.",
        prompt: `A 20 ms minor frame carries 5 terminal-to-controller messages of 10 data words each, and 3 terminal-to-terminal messages of 4 data words each. Use a response time of 8 µs and a gap of 10 µs. What is the bus loading, as a percentage? (Give one decimal place.)`,
        unit: "%",
        answer: 9.2,
        tolerance: 0.1,
        solution: `Terminal-to-controller, 10 words: 20 + 8 + 20 + 200 + 10 = 258 µs; five of them: 1290 µs. Terminal-to-terminal, 4 words: 20 + 20 + 8 + 20 + 80 + 8 + 20 + 10 = 186 µs; three of them: 558 µs. Total 1848 µs. Loading = 1848 / 20 000 = **9.24 %**.`,
        solvedFeedback: `Right: about 9.2 %. Sum the message durations, divide by the frame length.`,
        misconceptions: [
          { value: 1848, tolerance: 1, feedback: `1848 is the total in microseconds. Loading is a share of the 20 000 µs frame: 1848 / 20 000 = 9.24 %.` },
          { value: 8.8, tolerance: 0.1, feedback: `That leaves out the intermessage gap after each message (10 µs × 8 messages = 80 µs, a further 0.4 % of the frame). Every message is followed by its gap: 1848 µs in total, 9.2 %.` },
        ],
      },
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "apply",
      exercise: {
        kind: "single",
        id: "retry-on-b",
        skill: "avionics-buses",
        objective: "Read a retry across the two buses.",
        prompt: `The monitor shows a command to terminal 9 on bus A with no status within 14 µs. The controller repeats the same command on bus B and terminal 9 answers in 7 µs with a clean status and its data. Nothing else on bus A fails. What is the best conclusion and next step?`,
        options: [
          { id: "a", text: "Terminal 9's firmware is faulty; reflash it.", correct: false, feedback: `The same terminal answered correctly on bus B, so its logic and its subaddress are working. The fault is on the A side of the path.` },
          { id: "b", text: "The path from the controller to terminal 9 on bus A (coupler, stub, transceiver, connector) is suspect; check it and the A-side signal at the terminal.", correct: true, feedback: `Yes. One terminal, one bus, repeatable: the A-side path. The retry on B hid the fault from the application, which is exactly why the monitor log, not the application, is where you find it.` },
          { id: "c", text: "The controller's schedule is wrong for terminal 9.", correct: false, feedback: `The identical command was accepted on bus B. A wrong schedule or an illegal command would fail on both buses.` },
          { id: "d", text: "Nothing is wrong; the retry is working as designed.", correct: false, feedback: `The retry is working, but it is masking a failing path. If bus B degrades later, terminal 9 is lost entirely. Log retries and chase them.` },
        ],
      },
    },
    {
      type: "concept",
      stage: "complexity",
      depth: "master",
      title: "A clean status does not mean good data",
      body: `The status word says the terminal **received and understood** the command. It says nothing about whether the data in its subaddress is fresh.

A terminal's subsystem may have stopped updating the mailbox while the 1553 interface keeps answering happily. The bus shows a perfect message every time: right command, response at 8 µs, clean status, four data words. The data words are the same ones as a minute ago.

This is why the scenario's engineer saw "stale data from terminal 9" in the application, with a **clean** bus capture around it. No bus tool would have flagged it. Defence is in the data, not the wire:

- a **sequence counter or time tag** inside the data words, checked by the consumer;
- a **validity flag** the producing subsystem sets and clears;
- a consumer-side **timeout**: "no new counter value for three frames is a failure".

The retry policy is the second trade-off. A controller that retries at once on the other bus hides marginal terminals until the day both buses are marginal. One that does not retry fails loudly on one corrupted word. Whichever the program chooses, the retry must be **logged**, so maintenance data shows a terminal going marginal before it fails.`,
    },
    {
      type: "exercise",
      stage: "check",
      depth: "master",
      exercise: {
        kind: "multi",
        id: "monitor-log-reading",
        skill: "avionics-buses",
        objective: "Judge what a capture proves and does not prove.",
        prompt: `A capture shows, for terminal 9's subaddress 2: command, status in 8 µs, clean status flags, one data word, every 20 ms, for ten minutes. The application nevertheless reports the data is not changing. Select **every** statement that follows.`,
        options: [
          { id: "a", text: "The bus transaction is healthy; the 1553 interface of terminal 9 is answering correctly.", correct: true, feedback: `Right command, response inside the window, clean status, expected word count. The wire level is fine.` },
          { id: "b", text: "The cable to terminal 9 is the most likely cause.", correct: false, feedback: `The cable carries a perfect transaction every 20 ms. Changing it will change nothing.` },
          { id: "c", text: "The data in the terminal's subaddress may not be refreshed by its subsystem; look for a sequence counter, time tag or validity flag in the data.", correct: true, feedback: `The next question is about the producer, not the bus.` },
          { id: "d", text: "A consumer-side check (no new counter for N frames raises a fault) would have detected this.", correct: true, feedback: `Detection of stale data belongs in the data layer, because the bus layer cannot see it.` },
          { id: "e", text: "Setting the bus monitor to a higher sampling rate will reveal the fault.", correct: false, feedback: `The monitor already decoded every word correctly. More resolution on a healthy transaction shows more of a healthy transaction.` },
        ],
        solvedFeedback: `Right. The wire is healthy; the staleness lives in the producer's data and has to be detected there.`,
      },
    },
    {
      type: "interview",
      stage: "check",
      depth: "master",
      questionId: "mil-1553-bus-fault-triage",
      intro: `Walk through a capture the way you did here: decode, time, classify, say what the retry hides, and what a clean status does not prove.`,
    },
    {
      type: "concept",
      stage: "work",
      depth: "understand",
      title: "Where you will use this",
      body: `- **Embedded development.** The grouping logic in the walkthrough is what a monitor tool's firmware does. When you write a terminal's driver, the subaddress map and the "data fresh" flag are your design decisions.
- **Aerospace and UAV systems.** The schedule and loading table is a core ICD artifact; integration labs run on monitor captures like this one.
- **R&D and design.** Choosing message rates and word counts is a bandwidth and latency design problem; the loading arithmetic is the first check.
- **Verification and interviews.** "A terminal does not respond; what do you do?" is the standard panel question, and the strong answer is the classification you practised: decode first, then time, then bus.`,
    },
    {
      type: "recap",
      summary: `- The bus controller runs a fixed timetable of messages in minor frames inside a major frame; terminals only answer.
- Duration: words × 20 µs plus the response time and the gap. Terminal-to-terminal has two commands and two statuses.
- Bus loading is the sum of message durations over the frame length; spare capacity is for retries and growth.
- Read a capture: decode the command, compute the response gap, classify (clean, late, no response, message error, broadcast, parity error).
- A retry on the second bus hides a failing path; log retries. A clean status proves the transaction, not the freshness of the data.`,
      cards: [
        { id: "m1553b-1", front: "How long is a 1553 message?", back: "Words × 20 µs (command, data words, status), plus the terminal's response time (4–12 µs allowed, about 8 typical) and the intermessage gap (at least 4 µs). Terminal-to-terminal adds a second command and a second status." },
        { id: "m1553b-2", front: "How do you compute bus loading?", back: "Add the durations of every message in a minor frame and divide by the frame length. Spare capacity is needed for retries and growth; the acceptable figure is a program decision recorded in the ICD." },
        { id: "m1553b-3", front: "A terminal answers on bus B but not on bus A. Conclusion?", back: "The A-side path to that terminal (coupler, stub, transceiver, connector) is suspect; its logic works. The retry hid the fault from the application, so log retries and chase them." },
        { id: "m1553b-4", front: "What does a clean status word not prove?", back: "That the data is fresh. The status says the command was received and understood; a stalled subsystem can leave the same data in the subaddress forever. Detect it with a counter, time tag or validity flag and a consumer-side timeout." },
      ],
    },
  ],
};
