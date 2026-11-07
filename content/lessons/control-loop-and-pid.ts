import type { Lesson } from "@/lib/content/schema";

export const controlLoopAndPid: Lesson = {
  slug: "control-loop-and-pid",
  moduleId: "flight-control",
  format: "arc",
  prerequisites: ["capacitors-inductors-rc-and-filters", "sil-hil-what-each-proves"],
  title: "The control loop and PID without mystery",
  summary: "The loop that holds an actuator or a speed where you told it to: sensor, controller, actuator, plant. What the proportional, integral and derivative terms each fix and each break, shown by a simulation you can run, including windup when the actuator hits its limit and what derivative does to noise.",
  durationMinutes: 18,
  whyItMatters: "Integration and test engineers on flight-control and motor-control programmes are expected to speak the control vocabulary even when they do not design the laws. 'Explain PID to a new graduate' is a real interview question, and an answer with numbers from a step response is far stronger than 'P is proportional'.",
  objectives: [
    "Draw the loop with its sensor, controller, actuator and plant, and say what the error is.",
    "Say what each of P, I and D contributes and what each one can break.",
    "Read a step response: overshoot, settling time and steady-state error, from numbers.",
    "Explain integrator windup, the fix, and what a gain change means for the evidence you need to re-collect.",
  ],
  review: {
    status: "technically-reviewed",
    note: "The PID form, discrete implementation, steady-state error of proportional control on a first-order plant (Kp divided by 1 plus Kp), windup and conditional-integration anti-windup are standard control engineering. The lab is a SIMULATION of a first-order plant with a fixed time step and a seeded pseudo-random noise source; its numbers are reproducible and are not data from an aircraft, an actuator or a flight-control computer. Real control laws, tuning and flight dynamics belong to control engineers and are outside this lesson.",
  },
  references: [
    { title: "Åström and Murray, Feedback Systems: An Introduction for Scientists and Engineers", note: "Free textbook; chapter on PID control and integrator windup." },
    { title: "Lesson: Capacitors, inductors, RC and filters", note: "The first-order time constant used by the plant in the lab." },
    { title: "Lesson: SIL, HIL and what each proves", note: "Why a simulated loop is evidence of logic, not of the hardware." },
  ],
  steps: [
    {
      type: "scenario",
      stage: "why",
      title: "The actuator that rang after a gain change",
      body: `On a hardware-in-the-loop rig an actuator position loop was calm for weeks. After a small change to one gain, the surface starts to hunt: it overshoots, swings back, overshoots again.

You are the integration engineer. You did not design the control law, but you must decide whether the rig run is valid, what to ask the control engineer, and what to **re-test**. If you cannot say which term could cause the ringing and what a step response should show, you can only ask "is it fine?".

This lesson gives you the vocabulary and a simulation to see each term at work. The numbers are from a simulated first-order plant, not from real hardware, which is why the lab is labelled a simulation.`,
    },
    {
      type: "concept",
      stage: "intuition",
      depth: "understand",
      title: "Holding a speed on a hill",
      body: `You drive and want to hold 100 km/h. You look at the speedometer, compare it with 100, and press the pedal. That is the loop: **measure, compare, act, repeat**.

Three habits describe how a good driver presses.

**Now.** If you are 10 km/h too slow you press hard; 2 km/h too slow, gently. The push is **proportional** to how wrong you are right now.

**The past.** On a long hill you settle 3 km/h slow and stay there: the gentle push is not enough, but you are not wrong enough to push harder. A patient driver notices the **accumulated** shortfall and keeps adding pedal until the error is gone. That is the **integral** habit.

**The trend.** If you are closing in fast on 100, you ease off **before** you arrive, to avoid overshooting. That is the **derivative** habit: it reacts to how quickly the error is changing.

The controller is a driver who is very consistent and does this arithmetic 50 times a second.`,
    },
    {
      type: "concept",
      stage: "theory",
      depth: "understand",
      title: "The loop and the PID law",
      body: `Four boxes make the loop. A **sensor** measures the quantity. The **controller** compares it with the **setpoint**, the wanted value, and computes a command. An **actuator** turns the command into a force or a voltage. The **plant** is the thing being controlled (a surface, a motor, a heater) and its response feeds the sensor again.

The difference is the **error**: e = setpoint − measured. The PID law builds the command from it:

**u = Kp · e + Ki · ∫e dt + Kd · de/dt**

- **P**: proportional to the error now. Fast, but if the plant needs a steady command, P alone leaves a **steady-state error**.
- **I**: proportional to the accumulated error. It removes steady-state error and can cause overshoot.
- **D**: proportional to the rate of change of the error. It damps overshoot and amplifies measurement noise.

On a computer it runs at a fixed rate, every DT seconds: the integral is a running sum \`integral += e · DT\` and the derivative is \`(e − previous e) / DT\`. In the lab the plant is first-order, with time constant τ = 1 s, and DT = 0.02 s.`,
    },
    {
      type: "figure",
      stage: "how",
      depth: "understand",
      title: "The loop with its three terms",
      diagram: "control-loop-pid",
      alt: "Control loop diagram: setpoint minus measurement gives the error, a PID block with proportional (now), integral (past) and derivative (trend) terms feeds the actuator and then the plant, and a sensor with noise and delay closes the loop.",
      caption: "Setpoint minus the sensor's measurement is the error; P, I and D turn it into a command; the actuator and plant respond; the sensor, with its noise and delay, closes the loop.",
      body: `Note the sensor box: it adds **noise** and **delay**. Both matter later: noise is why the D term is dangerous, and delay is why an aggressive loop can start to ring.`,
    },
    {
      type: "example",
      stage: "example",
      depth: "understand",
      title: "Worked example: why P alone stops short",
      body: `The plant is a first-order system: its output x moves toward the command u with time constant 1 s. At rest, x equals u.

**Step 1: P only.** The command is u = Kp · (1 − x) for a setpoint of 1. Take Kp = 2.

**Step 2: find where it settles.** At rest, x = u, so x = 2 · (1 − x). That gives x = 2 − 2x, so 3x = 2 and **x = 0.667**. The loop stops at two thirds of the setpoint.

**Step 3: why.** To keep x at 0.667 the plant needs a command of 0.667. The controller only produces that command if there is an error of 0.333 to multiply. A steady error is the price of a P-only loop. In general x = Kp / (1 + Kp).

**Step 4: add I.** The integral keeps growing while any error remains, so the command keeps rising until the error is zero. In the lab with Kp = 1 and Ki = 4 the output reaches 1.000 at the end, but it overshoots by **20.3 %** on the way.

**Step 5: raise Kp.** With Kp = 3 and Ki = 3 the overshoot is 0 % and the loop settles in 1.3 s.

**The result:** P gives speed, I removes the steady error and costs overshoot, and the balance is the gains.`,
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "understand",
      exercise: {
        kind: "numeric",
        id: "p-only-steady-guided",
        skill: "pid",
        objective: "Predict the steady-state value of a P-only loop (guided).",
        prompt: `On the same first-order plant, with proportional control only and **Kp = 4**, to what value does the output settle when the setpoint is 1?`,
        unit: "(output, setpoint = 1)",
        answer: 0.8,
        tolerance: 0.005,
        hints: [
          `At rest the output equals the command: x = u.`,
          `The command is u = Kp × (1 − x). So x = 4 × (1 − x).`,
          `Solve for x: x = 4 − 4x, so 5x = 4.`,
        ],
        solution: `x = Kp / (1 + Kp) = 4 / 5 = **0.8**. A higher gain shrinks the steady error (0.2 here, against 0.333 for Kp = 2) but never removes it.`,
        solvedFeedback: `Right: 0.8. More proportional gain helps, but a P-only loop always leaves an error; the integral term is what removes it.`,
        misconceptions: [
          { value: 1, tolerance: 0.005, feedback: `1.0 would mean no error, which needs an integral term. With P only, the output is Kp / (1 + Kp) = 0.8.` },
          { value: 0.667, tolerance: 0.005, feedback: `0.667 is the answer for Kp = 2. For Kp = 4 it is 4 / (1 + 4) = 0.8.` },
        ],
      },
    },
    {
      type: "lab",
      stage: "practice",
      depth: "apply",
      title: "Run it yourself: P, PI, noise and windup (a simulation)",
      lab: "py-pid",
      body: `This is a **simulation**: a first-order plant, a fixed time step and a seeded noise source, so every number is the same on every machine. Four experiments: P only; PI with overshoot; PI with a higher Kp; and a limited actuator with and without anti-windup. Between them is a noise test that shows what the derivative term does to the command. Read the last line of each block: peak, overshoot, settling time and final value.`,
      tryNext: `Change experiment 2's Ki from 4 to 8 and predict whether overshoot goes up or down, and whether settling gets faster or slower. Then run it. Next, raise the actuator limit in experiment 4a from 1.2 to 5 and predict what happens to the difference between 4a and 4b.`,
    },
    {
      type: "walkthrough",
      stage: "how",
      depth: "apply",
      title: "The discrete PID, line by line",
      intro: `This is the core of the simulation: the seven lines that run every time step. They are the same seven lines in a real controller, plus bookkeeping.`,
      language: "python",
      code: `e = setpoint - measured
deriv = (e - prev_e) / DT
u_unsat = kp * e + ki * integral + kd * deriv
u = max(-limit, min(limit, u_unsat))
if not (anti_windup and u != u_unsat):
    integral += e * DT
prev_e = e`,
      notes: [
        { lines: "1", text: `The **error**: wanted minus measured. Everything else is built from this one number.` },
        { lines: "2", text: `The **derivative** is the change in error since last time, divided by the step. Any noise in the measurement is divided by a small DT too, which is why this term amplifies noise.` },
        { lines: "3", text: `The unclamped command is the three terms added together, each with its own gain.` },
        { lines: "4", text: `The **actuator limit**: the command cannot exceed what the actuator can do. If this clamps, the loop is asking for more than it can get.` },
        { lines: "5-6", text: `Accumulate the error into the integral, **unless** anti-windup is on and the command was clamped. This single condition is the difference between experiments 4a and 4b.` },
        { lines: "7", text: `Remember this error for the next step's derivative.` },
      ],
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "apply",
      exercise: {
        kind: "numeric",
        id: "derivative-noise-factor",
        skill: "pid",
        objective: "Quantify what the derivative term does to noise, from the lab numbers.",
        prompt: `In the lab's noise test, the mean step-to-step change in the command u is 0.024 with Kd = 0 and 0.508 with Kd = 0.5. By about what factor did adding the derivative term increase the jitter in the command? Give the ratio to the nearest whole number.`,
        unit: "times",
        answer: 21,
        tolerance: 1,
        solution: `0.508 / 0.024 ≈ 21.2, so about **21 times** more jitter in the command from the same measurement noise. An actuator driven by that command would be shaken twenty times harder, for a final value that is, if anything, slightly worse (0.996 against 1.000). This is why the derivative term is used sparingly, filtered, or not at all.`,
        solvedFeedback: `Right: about 21 times. The derivative divides noise by the time step, so a term that damps overshoot can also shake the actuator.`,
        misconceptions: [
          { value: 0.5, tolerance: 0.05, feedback: `0.5 is the value of Kd, not the ratio. The ratio is the jitter with Kd = 0.5 divided by the jitter with Kd = 0: 0.508 / 0.024 ≈ 21.` },
          { value: 7, tolerance: 1, feedback: `Seven is roughly the factor for Kd = 0.2 (0.165 / 0.024). The question uses Kd = 0.5: 0.508 / 0.024 ≈ 21.` },
        ],
      },
    },
    {
      type: "concept",
      stage: "complexity",
      depth: "master",
      title: "Windup, and what the simulation cannot tell you",
      body: `**Windup.** When the actuator is at its limit, the error stays large and the integral keeps growing, though the extra command has no effect. When the plant finally catches up, that stored sum is still there and drives the output far past the setpoint before it unwinds.

The lab shows it. With the actuator limited to ±1.2 and no protection, experiment 4a overshoots by **16.6 %** and settles in 5.9 s. With the integral frozen while the command is clamped (4b), overshoot is **0 %** and it settles in 3.3 s. Another common fix is to clamp the integral to a range.

**What the simulation cannot tell you.** A real loop has sensor delay, actuator rate limits, backlash, several modes and gains that change with flight condition. Delay and rate limits make a loop ring at gains that look fine in a clean simulation. The simulation shows what each term does, **not** how an aircraft behaves.

**What it means for testing.** A gain change is a change to the product. The evidence to re-collect is the step response, at the conditions the requirement names, with command, measurement, timestamps, saturation flags and the gain version recorded together.`,
    },
    {
      type: "exercise",
      stage: "check",
      depth: "master",
      exercise: {
        kind: "multi",
        id: "windup-statements",
        skill: "pid",
        objective: "Separate true statements about windup from myths.",
        prompt: `Select **every** statement that is true.`,
        options: [
          { id: "a", text: "In the lab, with the actuator limited to ±1.2 and no anti-windup, the output overshoots by 16.6 %; freezing the integral while the command is clamped removes the overshoot.", correct: true, feedback: `True, and it is the numbers in experiments 4a and 4b: 16.6 % and settling in 5.9 s against 0 % and 3.3 s.` },
          { id: "b", text: "Windup needs an integral term and an actuator that can saturate.", correct: true, feedback: `True. The integral stores error while the command is clamped; without a limit, the stored error does real work and nothing winds up.` },
          { id: "c", text: "A P-only controller can wind up, because its error stays large when the actuator is clamped.", correct: false, feedback: `False. A P-only controller has no memory: its command is a function of the current error alone, so it cannot store anything to unwind later.` },
          { id: "d", text: "Raising Ki cures windup because the integral reaches zero sooner.", correct: false, feedback: `False. A larger Ki fills the integral faster during saturation, so the overshoot afterwards is usually worse. The cure is to stop or limit the accumulation.` },
        ],
        solvedFeedback: `Right: windup needs an integrator and a limit, the lab shows its size, a P-only loop has no stored error to wind up, and a bigger Ki makes it worse.`,
      },
    },
    {
      type: "interview",
      stage: "check",
      depth: "master",
      questionId: "pid-explained-to-a-new-graduate",
      intro: `Explain PID to a new graduate with numbers: what each term fixes, what each breaks, and what windup is.`,
    },
    {
      type: "concept",
      stage: "work",
      depth: "understand",
      title: "Where you will use this",
      body: `- **Embedded development.** A PID is a few lines of fixed-rate code; the rate, the integer or float arithmetic and the actuator limit are your decisions as the firmware author.
- **Aerospace and UAV systems.** Flight-control integration tests are step responses, mode transitions and saturation cases, and every gain change brings a regression test; reading them needs this vocabulary.
- **R&D and design.** Tuning, filtering the derivative and anti-windup are design choices that trade speed against noise and robustness.
- **Verification and interviews.** "Explain PID to a new graduate" and "what happens when the actuator saturates?" are standard questions; the lab numbers make the answers concrete.`,
    },
    {
      type: "recap",
      summary: `- A control loop measures, compares with the setpoint, computes a command, acts and repeats; the error is setpoint minus measurement.
- P acts on the error now (fast, leaves a steady error: Kp / (1 + Kp) on a first-order plant); I acts on the accumulated error (removes the steady error, can overshoot); D acts on the trend (damps, amplifies noise).
- In the simulated lab: P-only settles at 0.667; PI with Kp = 1, Ki = 4 overshoots 20.3 %; Kp = 3, Ki = 3 has none; the derivative multiplied the command's jitter by about 21.
- Windup: the integral grows while the actuator is clamped. Freezing it during saturation cut overshoot from 16.6 % to 0 % in the lab.
- A simulation shows what each term does, not how an aircraft behaves; a gain change means re-collecting the step response.`,
      cards: [
        { id: "pid-1", front: "What does each of P, I and D fix, and what can each break?", back: "P is fast but leaves a steady-state error; I removes the steady error but can overshoot and wind up; D damps overshoot but amplifies measurement noise." },
        { id: "pid-2", front: "Where does a P-only loop on a first-order plant settle?", back: "At Kp / (1 + Kp) of the setpoint: 0.667 for Kp = 2, 0.8 for Kp = 4. It never reaches the setpoint without an integral term." },
        { id: "pid-3", front: "What is integrator windup and the usual fix?", back: "The integral keeps accumulating while the actuator is saturated, then overshoots when the plant catches up. Freeze or clamp the integral while the command is clamped." },
        { id: "pid-4", front: "What evidence do you re-collect after a gain change?", back: "A step response at the conditions the requirement names, with command, measurement, timestamps, saturation flags and the gain version recorded together." },
      ],
    },
  ],
};
