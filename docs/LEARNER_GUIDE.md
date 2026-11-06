# Learner guide: where to start, what to do when stuck, what is essential

Short answers to the questions that stop people. Each answer names the page or module to open next.

## Where should I start?

1. **Read the [career-switch guide](SUSHMITA_CAREER_SWITCH_GUIDE.md)** once. Ten minutes.
2. **Take the starting-level diagnostic** at `/start` in the app, or skip it. It asks 14 questions over the foundations; wrong answers become a "Start here" list on Today. It never produces a score or a level.
3. **Pick a depth.** Lessons written in the 2.0 format offer Understand → Apply → Master at the top. Start at Understand for anything new, Apply for anything you have done at work, Master when you want the failure modes and trade-offs. You can switch any time without losing anything.
4. **Follow Today.** The Today page gives one next step. If it points at a foundation you already know, open it, confirm the exercise in two minutes, move on.

## What if I don't understand this topic?

Work down this list; stop when it clicks.

1. **Switch the lesson to Understand depth.** The intuition step and the picture come first; theory is hidden until you want it.
2. **Tap the dotted words.** Every technical term opens a plain-language definition without leaving the page.
3. **Open "Before this lesson".** The prerequisites card at the top links to the lessons this one rests on, with your completion state. The one you have not done is usually the missing piece.
4. **Use the hints** on the guided exercise. They are recorded honestly ("solved with 2 hints") and cost nothing.
5. **Look at the diagram** for the topic in the [diagram index](DIAGRAM_INDEX.md); many concepts are easier as a picture than as a paragraph.
6. **Find the topic's row** in the [topic breakdown](MODULE_TOPIC_BREAKDOWN.md): each topic has a one-sentence Understand explanation written to be read on its own.
7. **Run the lab** if the lesson has one. Seeing the program print the expected output, then changing one line, teaches what reading cannot.
8. If none of that works, the lesson is at fault, not you. Note the step; it goes into the pilot findings and the lesson is rewritten.

## What foundation should I revise first?

In this order, only where the diagnostic or a lesson's prerequisite card shows a gap:

| If this feels shaky | Revise this first | Then |
|---|---|---|
| Voltages, currents, "why does the rail sag" | Module 1: circuit laws, RC, power tree | Module 10: multimeter and scope |
| Reading a board or a schematic | Module 2: schematic review, datasheet triage | Module 1: logic levels, protection |
| "What is the chip doing at reset" | Module 3: board does not boot, first STM32 project, clock tree | Module 7: reset vector to main |
| Bus traces that look like noise | Module 4: UART, SPI, I2C, CAN lessons in that order | Module 10: logic analysers |
| C that compiles but misbehaves | Module 5: C foundations, fixed-width integers, pointers to hardware | Module 5: stack and heap, state machines |
| Tasks, priorities, "why is it late" | Module 8: priority inversion, ISR handoff | Module 20 when published |

## Which modules are essential for my target role?

| Target role family | Essential modules | Useful | Optional for later |
|---|---|---|---|
| Avionics / UAV systems integration | 4, 10, 11, 18, 19, 20, 21, 25 | 3, 5, 12, 17, 24 | 26, 27, 30 |
| Embedded systems engineer | 3, 5, 7, 8, 20, 23, 25 | 1, 4, 6, 22 | 9, 29 |
| Electronics R&D / hardware validation | 1, 2, 10, 11, 25 | 3, 4, 12 | 26, 31 |
| Verification & validation (DO-178C) | 12, 17, 21, 25 | 11, 18, 19, 22 | 14 depth, 31 |
| Embedded test automation | 13, 22, 12, 25 | 4, 10, 21 | 29 |

Module 16 (communication) and 25 (interviews for experienced engineers) are essential for every family: they are how the rest becomes visible.

## Which are advanced or specialised, and which are optional for later?

- **Foundations (1 to 16):** everybody's; refresh, do not relearn. Status: published in the app.
- **Advanced, essential for Pathways A and B (17 to 25):** written here as a blueprint; published lesson by lesson after the pilot gate. Module 18 lesson 1 (MIL-STD-1553B) is already published.
- **Extensions (26 to 31):** 26 and 27 serve Pathway B when control and estimation matter for the role; 28 to 30 are Pathway C, optional, after the core; 31 is Pathway D, grows with reviewed work. None is required to apply for the roles in the table above.

## How do I know a module is "done" for me?

You can do its exit task without the lesson open: explain the concept in your own words, solve an unseen exercise with zero hints, run or change its lab, and say where you would use it at work. The app records what you did ("completed at Apply depth"); you decide whether that is enough for the role you want. Nothing in the app will tell you that you are ready for a job, because nothing in an app can know that.
