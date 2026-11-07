import type { Lesson } from "@/lib/content/schema";

export const whyFlightControlIsRedundant: Lesson = {
  slug: "why-flight-control-is-redundant",
  moduleId: "redundancy",
  format: "arc",
  prerequisites: ["fmea-for-a-small-embedded-product", "avionics-and-automotive-standards-scope"],
  title: "Why flight control is redundant: channels, common-mode faults and what 'fail-operational' means",
  summary: "The flight-control system as a whole, why one computer is not enough, what simplex, duplex, triplex and quad channels can and cannot do, and why copies of the same thing fail together. Draw the architecture and defend it in plain words.",
  durationMinutes: 16,
  whyItMatters: "If you have worked beside a redundant flight-control system, the first interview question is 'draw it and explain why it is built that way'. A clear answer separates detecting a fault from surviving it, and names the faults that redundancy does not fix.",
  objectives: [
    "Draw the flight-control system as sensors, computers, actuators and power, and say what each channel contains.",
    "Define fail-operational, fail-passive and fail-safe and say which architecture gives which.",
    "Compare simplex, duplex, triplex and quad channels by what they detect, isolate and survive.",
    "Explain common-mode faults and dissimilarity, and why a voter is not a cure for them.",
  ],
  review: {
    status: "technically-reviewed",
    note: "Terminology (fail-operational, fail-passive, fail-safe), channel counts and the idea that redundancy must be assessed together with common-cause and latent faults follow the public descriptions in SAE ARP4754A and ARP4761 and standard fault-tolerance texts. The architecture drawn here is a generic teaching example, not any real aircraft or product, and no failure rates are quoted.",
  },
  references: [
    { title: "SAE ARP4754A, Guidelines for development of civil aircraft and systems", note: "Development assurance, common cause analysis." },
    { title: "SAE ARP4761, Safety assessment process", note: "Failure condition classification, common cause analysis." },
    { title: "Storey, Safety-Critical Computer Systems", note: "Fault tolerance, voting and redundancy in general." },
    { title: "Lesson: FMEA for a small embedded product", note: "Failure modes and effects at product level." },
  ],
  steps: [
    {
      type: "scenario",
      stage: "why",
      title: "Two computers, two answers",
      body: `A small unmanned aircraft has a flight computer that reads a pitch-rate sensor and commands an elevator actuator, 100 times a second. During a test flight the computer reports a pitch rate of 40 degrees per second while the aircraft is flying level.

The team adds a second, identical computer so that one can check the other. On the next test, the two computers disagree: one says 40, the other says 0.

Which one is right? The software cannot say. It can detect that **something** is wrong, but it cannot pick the good channel. And if both computers run the same software, what happens when the fault is in the software itself?

These two questions, which one is right and what if they are all wrong in the same way, explain the whole shape of a redundant flight-control system.`,
    },
    {
      type: "concept",
      stage: "intuition",
      depth: "understand",
      title: "Watches, majorities and the same bad battery",
      body: `You wear one watch. If it stops, you cannot tell: it still shows a time, just the wrong one.

You wear two. If they disagree, you know one is wrong, but not which. You are better informed and still stuck.

You wear three. If one disagrees with the other two, you go with the majority and you know which watch to replace. Now one failure does not even interrupt you.

But suppose all three came from the same shop with the same defective batch of batteries. They all fail the same way, on the same day, and they all agree on the wrong time. The majority is wrong. More watches did not help, because the cause was shared.

Keep both lessons. **Counting** channels lets you detect and then outvote a fault. **Independence** between channels is what makes the count mean anything.`,
    },
    {
      type: "concept",
      stage: "theory",
      depth: "understand",
      title: "The flight-control system as a whole",
      body: `A flight-control system is a loop that closes around the aircraft:

1. **Sensors** measure the state: attitude, rates, air data, position, pilot inputs.
2. **Flight computers** read the sensors, compute control commands, and watch their own health.
3. **Actuators** move the control surfaces or motors in response.
4. **Power** feeds all of the above, and data links join them.

Every part can fail, and the failures have different consequences. A frozen sensor can lead the computer to command a harmful movement. A stopped computer leaves surfaces uncommanded. A jammed actuator holds a surface where it is.

A **hazard analysis** assigns each failure condition a severity, and that decides how many faults the system must tolerate. For the worst conditions, a single fault must not be able to cause one.

That requirement, no **single point of failure** for the most severe conditions, is why every part that could cause one appears more than once: several sensors, several computers, several actuators or actuator windings, several power sources.

Each such copy of a chain from sensor to actuator is called a **channel**.`,
    },
    {
      type: "concept",
      stage: "theory",
      depth: "understand",
      title: "Three ways to fail, and which architecture gives which",
      body: `After a fault the system ends up in one of three kinds of state. The names are used precisely.

- **Fail-operational**: after the fault the function **continues** at its normal required performance. Nothing is lost that the crew or the mission needs.
- **Fail-passive**: after the fault the function **stops commanding** in a way that does no harm: it holds, freezes or disengages. Something else, a pilot or another system, must take over.
- **Fail-safe**: after the fault the system goes to a **defined safe state**, for example a parachute, a return to home, or a de-energised actuator that moves to a neutral position.

Which one you need comes from the hazard analysis, not from taste. A function whose loss is catastrophic needs fail-operational; one that a pilot can take over may only need fail-passive.

The channel count decides what is possible:

| Channels | Can detect | Can pick the good one | After one fault |
|---|---|---|---|
| Simplex (1) | only with self-tests | no | function lost |
| Duplex (2) | yes, by comparing | no | fail-passive |
| Triplex (3) | yes | yes, by majority | continues (fail-operational) |
| Quad (4) | yes | yes | continues, and a second fault too |`,
    },
    {
      type: "figure",
      stage: "how",
      depth: "understand",
      title: "A triplex architecture with cross-channel links",
      diagram: "redundant-channels",
      alt: "A triplex flight-control architecture: three channels A, B and C, each with sensors, a flight computer, a voter and monitor, and an actuator, joined by cross-channel data links.",
      caption: "Three channels, each with its own sensors, computer, voter and actuator. The cross-channel data links (CCDL) let every computer see the other two channels' inputs, so each can vote.",
      body: `Look at the links between the channels. Without them each channel would be alone, and no channel could tell that another had gone wrong. Every channel needs its own copy of the other two's data to vote.`,
    },
    {
      type: "concept",
      stage: "theory",
      depth: "apply",
      title: "Common-mode faults and dissimilarity",
      body: `A **common-mode fault** is one cause that disables several channels at once. Voting cannot outvote it, because all voters see the same wrong thing.

Typical sources:

- **The same software** in all channels: one coding defect is in every copy and triggers in all of them under the same input.
- **The same sensor type or part batch**, with the same weakness at low temperature.
- **The same power source or ground**: one brown-out takes every channel.
- **The same environment**: lightning, electromagnetic interference or heat reaches all channels together.
- **The same design error**: a wrong requirement copied into each channel.

The defence is **dissimilarity**: deliberately different channels. Different processors, different software written by different teams to the same requirements, different sensor technologies, separated power and routing.

Dissimilarity costs money and complexity, so it is applied where the hazard analysis says a common cause is credible and the consequence severe. A **common cause analysis** looks for these shared causes and justifies the choices.

An honest statement: redundancy and dissimilarity make failure less likely and detectable. They do not make it impossible.`,
    },
    {
      type: "example",
      stage: "example",
      depth: "understand",
      title: "Worked example: three channels, two faults",
      body: `The pitch-rate signal, in degrees per second, from three channels:

| Time | A | B | C | Decision |
|---|---|---|---|---|
| 1 | 0.2 | 0.3 | 0.2 | All agree. Use the middle value, 0.2. |
| 2 | 0.2 | 40.0 | 0.3 | B disagrees with A and C. Use the middle value 0.3, flag B. |
| 3 | 0.1 | 40.0 | 0.2 | B still wrong; isolate B after it persists. |
| 4 | 0.1 | (isolated) | 18.0 | Two channels remain: A and C disagree by 17.9. |

**Step 1:** at time 2 the middle of 0.2, 40.0 and 0.3 is 0.3. One wild channel cannot move the output. That is the triplex advantage: one fault, no interruption.

**Step 2:** after B is isolated only A and C remain. At time 4 they disagree by 17.9 degrees per second.

**Step 3:** the system now knows something is wrong and **not which channel is right**. It is back to the duplex situation of the scenario. The only safe action is **fail-passive**: stop trusting the signal, hold a safe command, and hand over or go to the defined safe state.

So a triplex system survives the **first** fault and detects the second. It does not survive two faults.`,
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "understand",
      exercise: {
        kind: "single",
        id: "duplex-conclusion-guided",
        skill: "redundancy",
        objective: "State what a two-channel system can and cannot conclude (guided).",
        prompt: `A duplex system has two channels. Channel 1 reads 100 and channel 2 reads 140. The allowed difference is 5. What can the system conclude?`,
        hints: [
          `Compare the difference with the allowed difference first.`,
          `The difference, 40, is far above 5, so the channels disagree. Does the data say which of the two is closer to the truth?`,
          `With only two values and no third opinion, nothing in the numbers favours either channel.`,
        ],
        options: [
          { id: "a", text: "Channel 1 is right because 100 is the smaller number.", correct: false, feedback: `Nothing about the value says it is more likely to be right. A stuck high or a stuck low are equally plausible.` },
          { id: "b", text: "The channels disagree, so there is a fault, but it cannot tell which channel is wrong; the safe response is fail-passive.", correct: true, feedback: `Right. Two channels can detect a disagreement but not resolve it. With no way to pick, the function must hold or hand over.` },
          { id: "c", text: "The average, 120, is the best estimate and can be used.", correct: false, feedback: `Averaging a good value with a bad one gives a value that is wrong by half the error, and nobody has flagged it. It hides the fault instead of handling it.` },
          { id: "d", text: "There is no fault, because both values are inside the sensor's full range.", correct: false, feedback: `Being in range says nothing about agreement. Two good sensors measuring the same thing should agree within their accuracy; 40 apart is a fault.` },
        ],
      },
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "apply",
      exercise: {
        kind: "multi",
        id: "common-mode-candidates",
        skill: "redundancy",
        objective: "Recognise common-mode risks in a triplex design.",
        prompt: `A triplex flight computer uses three identical processor boards, the same software build, one battery through a single power bus, and three sensors from the same supplier batch. Select **every** item that is a common-mode risk.`,
        options: [
          { id: "a", text: "The same software build in all three channels.", correct: true, feedback: `A defect in the code is in every copy and can trigger in all of them on the same input.` },
          { id: "b", text: "A single power bus feeding all three boards.", correct: true, feedback: `One brown-out or short removes every channel at once.` },
          { id: "c", text: "Three sensors from one supplier batch.", correct: true, feedback: `A batch weakness, for example at low temperature, can affect all three at the same time.` },
          { id: "d", text: "Each channel having its own copy of the cross-channel data.", correct: false, feedback: `Separate copies of the data are what makes voting possible; that is not a shared cause. The shared source of the data is the risk, not the copies.` },
        ],
        solvedFeedback: `Right: shared software, shared power and shared batch are common-mode risks. Having a separate local copy of exchanged data is part of the design, not a risk.`,
      },
    },
    {
      type: "concept",
      stage: "complexity",
      depth: "master",
      title: "What redundancy costs and what it hides",
      body: `Redundancy is not free, and it introduces faults of its own.

**More parts, more failures.** Three channels fail three times as often as one. The design is safe only if the system survives those failures, which is why the voting logic and the isolation rules matter as much as the hardware.

**The voter is a single point of failure.** Whatever picks the middle value must itself be duplicated, monitored or simple enough to be shown correct.

**Latent faults.** A channel that has failed silently, with nobody noticing, turns a triplex into a duplex without anyone knowing. The next fault then has no majority to fall back on. Periodic built-in tests and cross-channel monitoring exist to reveal such faults, and the time a fault can hide is part of the safety analysis.

**Interfaces and timing.** Channels must exchange data and stay aligned in time. Every link is a new place to fail, and every extra comparison needs agreed limits.

**Honest limits.** Redundancy handles independent random faults well. It handles common-mode and design faults only to the extent that dissimilarity and analysis have been applied.`,
    },
    {
      type: "exercise",
      stage: "check",
      depth: "master",
      exercise: {
        kind: "numeric",
        id: "quad-faults-until-fail-passive",
        skill: "redundancy",
        objective: "Count how many faults a voting system survives.",
        prompt: `A quad system has four channels. It uses mid-value voting and isolates each channel that is confirmed faulty. It can only tell which remaining channel is right while at least **three** channels remain. After how many confirmed channel failures can it no longer tell which of the remaining channels is right?`,
        unit: "failures",
        answer: 2,
        tolerance: 0,
        solution: `Four channels minus two failures leaves two channels, and two channels can only detect a disagreement. After **two** confirmed failures it is back to duplex behaviour. The system survived two faults, one more than a triplex, and fail-passive begins at the third disagreement.`,
        solvedFeedback: `Right: two. A quad keeps voting through one fault and then through a second, ending at two channels, where it can only detect.`,
        misconceptions: [
          { value: 1, tolerance: 0, feedback: `After one failure three channels remain, and three can still vote. That is the triplex limit, one more channel gives one more fault.` },
          { value: 3, tolerance: 0, feedback: `After three failures one channel is left, but the system lost the ability to choose earlier, when only two were left, after two failures.` },
        ],
      },
    },
    {
      type: "interview",
      stage: "check",
      depth: "master",
      questionId: "redundancy-architecture-explained",
      intro: `Draw the architecture on a whiteboard and explain why it has the channels it has, what it survives and what it does not.`,
    },
    {
      type: "concept",
      stage: "work",
      depth: "understand",
      title: "Where you will use this",
      body: `- **Embedded development.** Each channel's software is the same code with a monitor wrapped around it; knowing which parts are exchanged and which are private shapes the interfaces you write.
- **Aerospace and UAV systems.** Flight-control, engine-control and braking systems use channel architectures; integration and test plans are organised per channel and per cross-channel link.
- **R&D and design.** Choosing the channel count, deciding where dissimilarity is worth its cost, and designing the isolation rules are architecture decisions backed by the hazard analysis.
- **Verification and interviews.** "Draw it, explain what each failure does" is the standard question; knowing where the architecture stops protecting you is the strongest answer.`,
    },
    {
      type: "recap",
      summary: `- A flight-control system is sensors, computers, actuators and power in a loop; each complete chain from sensor to actuator is a channel.
- Fail-operational continues at full performance, fail-passive stops commanding safely, fail-safe moves to a defined safe state; the hazard analysis decides which is needed.
- Duplex detects but cannot choose; triplex outvotes one fault; quad outvotes two in sequence; a voter with two channels left can only fail-passive.
- Common-mode faults (same software, power, batch, environment, design error) defeat voting; dissimilarity and common cause analysis are the defence.
- Redundancy adds parts, a voter that must itself be trusted, and latent faults that hide until the next one.`,
      cards: [
        { id: "red-1", front: "Fail-operational, fail-passive and fail-safe: what is the difference?", back: "Fail-operational continues at required performance after a fault; fail-passive stops commanding safely and needs hand-over; fail-safe goes to a defined safe state. The hazard analysis decides which is required." },
        { id: "red-2", front: "Why can a duplex system not survive a fault but a triplex can?", back: "Two channels can detect a disagreement but cannot tell which is right. Three can outvote the single wrong channel by majority or mid-value, so the function continues." },
        { id: "red-3", front: "What is a common-mode fault and what defends against it?", back: "One cause that disables several channels at once, such as shared software, power, sensor batch or environment. Voting cannot outvote it; dissimilarity, separation and common cause analysis are the defences." },
        { id: "red-4", front: "What is a latent fault and why does it matter in a redundant system?", back: "A fault that has occurred but is not noticed, so a triplex is really a duplex without anyone knowing. Built-in tests and cross-channel monitoring limit how long it can hide." },
      ],
    },
  ],
};
