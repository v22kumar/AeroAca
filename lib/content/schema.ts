import { z } from "zod";

/**
 * AeroAca content schema.
 *
 * All learning content is plain, serialisable data validated at build/test time
 * with these schemas. Prose fields are Markdown strings. Interactive pieces are
 * structured so the UI can grade them and give answer-specific feedback.
 *
 * Adding a lesson = add a file under content/lessons and register it in
 * content/index.ts. No UI code changes are required.
 */

const markdown = z.string().min(1);
const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be kebab-case");

export const referenceSchema = z.object({
  title: z.string(),
  /** Document identifier such as "RM0090" or "UM10204". */
  id: z.string().optional(),
  url: z.string().url().optional(),
  note: z.string().optional(),
});
export type Reference = z.infer<typeof referenceSchema>;

/* ---------- Visuals (interactive SVG components keyed by id) ---------- */

export const visualIdSchema = z.enum([
  "mcu-boot-chain",
  "i2c-waveform",
  "register-bits",
  "rmw-hazard",
  "uart-frame",
  "spi-modes",
  "iwdg-timeout",
  "aliasing",
  "traceability",
  "startup-sequence",
  "priority-inversion",
  "scpi-console",
  "fmea-worksheet",
  "standards-map",
  "sensor-monitor-lab",
]);
export type VisualId = z.infer<typeof visualIdSchema>;

/* ---------- Exercises ---------- */

const optionSchema = z.object({
  id: z.string(),
  text: markdown,
  correct: z.boolean(),
  /** Shown when this option is selected (right or wrong). Must explain *why*. */
  feedback: markdown,
});

const exerciseBase = {
  id: z.string(),
  /** Short skill tag used for weak-area tracking, e.g. "reset", "i2c-addressing". */
  skill: z.string(),
  objective: z.string(),
  prompt: markdown,
  context: markdown.optional(),
  hint: markdown.optional(),
};

export const singleChoiceSchema = z.object({
  ...exerciseBase,
  kind: z.literal("single"),
  options: z.array(optionSchema).min(2),
});

export const multiChoiceSchema = z.object({
  ...exerciseBase,
  kind: z.literal("multi"),
  options: z.array(optionSchema).min(3),
  /** Shown when the whole set is correct. */
  solvedFeedback: markdown,
});

export const orderSchema = z.object({
  ...exerciseBase,
  kind: z.literal("order"),
  items: z.array(
    z.object({
      id: z.string(),
      text: markdown,
      /** Why this item belongs at its position in the correct order. */
      why: markdown,
    }),
  ).min(3),
  correctOrder: z.array(z.string()).min(3),
  solvedFeedback: markdown,
});

export const numericSchema = z.object({
  ...exerciseBase,
  kind: z.literal("numeric"),
  unit: z.string(),
  answer: z.number(),
  /** Absolute tolerance accepted around the answer. */
  tolerance: z.number().nonnegative(),
  /** Worked solution, shown after a wrong attempt (and after solving). */
  solution: markdown,
  solvedFeedback: markdown,
  /** Feedback for specific common wrong answers. */
  misconceptions: z
    .array(z.object({ value: z.number(), tolerance: z.number(), feedback: markdown }))
    .optional(),
});

export const registerSchema = z.object({
  ...exerciseBase,
  kind: z.literal("register"),
  registerName: z.string(),
  width: z.union([z.literal(8), z.literal(16), z.literal(32)]),
  initial: z.number().int().nonnegative(),
  target: z.number().int().nonnegative(),
  fields: z.array(
    z.object({
      name: z.string(),
      msb: z.number().int(),
      lsb: z.number().int(),
      description: z.string(),
    }),
  ),
  /** Bits that must not change; touching them is a graded mistake. */
  protectedBits: z.array(z.number().int()).optional(),
  solution: markdown,
  solvedFeedback: markdown,
});

export const exerciseSchema = z.discriminatedUnion("kind", [
  singleChoiceSchema,
  multiChoiceSchema,
  orderSchema,
  numericSchema,
  registerSchema,
]);
export type Exercise = z.infer<typeof exerciseSchema>;
export type SingleChoiceExercise = z.infer<typeof singleChoiceSchema>;
export type MultiChoiceExercise = z.infer<typeof multiChoiceSchema>;
export type OrderExercise = z.infer<typeof orderSchema>;
export type NumericExercise = z.infer<typeof numericSchema>;
export type RegisterExercise = z.infer<typeof registerSchema>;

/* ---------- Interview questions ---------- */

export const interviewQuestionSchema = z.object({
  id: z.string(),
  moduleId: z.string(),
  topic: z.string(),
  question: markdown,
  /** Follow-up probes a good interviewer would ask. */
  probes: z.array(z.string()).min(1),
  rubric: z.object({
    strong: z.array(z.string()).min(2),
    weak: z.array(z.string()).min(1),
  }),
  sampleAnswer: markdown,
  relatedLesson: slug.optional(),
  /** How the same question plays out in other sectors, so the answer transfers. */
  industries: z
    .array(
      z.object({
        sector: z.enum(["avionics", "automotive", "medical", "industrial", "consumer"]),
        note: z.string().min(20),
      }),
    )
    .optional(),
});
export type InterviewQuestion = z.infer<typeof interviewQuestionSchema>;

/* ---------- Review cards ---------- */

export const reviewCardSchema = z.object({
  id: z.string(),
  front: markdown,
  back: markdown,
});
export type ReviewCard = z.infer<typeof reviewCardSchema>;

/* ---------- Lesson steps ---------- */

export const lessonStepSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("scenario"), title: z.string(), body: markdown }),
  z.object({
    type: z.literal("concept"),
    title: z.string(),
    body: markdown,
    deeper: z.object({ title: z.string(), body: markdown }).optional(),
  }),
  z.object({
    type: z.literal("visual"),
    title: z.string(),
    visual: visualIdSchema,
    body: markdown.optional(),
    caption: markdown,
  }),
  z.object({
    type: z.literal("example"),
    title: z.string(),
    body: markdown,
  }),
  z.object({ type: z.literal("exercise"), exercise: exerciseSchema }),
  z.object({
    type: z.literal("interview"),
    questionId: z.string(),
    intro: markdown.optional(),
  }),
  z.object({
    type: z.literal("recap"),
    summary: markdown,
    cards: z.array(reviewCardSchema).min(2),
  }),
]);
export type LessonStep = z.infer<typeof lessonStepSchema>;

export const lessonSchema = z
  .object({
    slug,
    moduleId: z.string(),
    title: z.string(),
    /** One sentence hook shown in lists. */
    summary: z.string(),
    durationMinutes: z.number().int().positive(),
    /** One or two sentences on what this unlocks for her work or interviews. */
    whyItMatters: z.string().min(20),
    objectives: z.array(z.string()).min(2),
    prerequisites: z.array(slug).optional(),
    steps: z.array(lessonStepSchema).min(5),
    references: z.array(referenceSchema).min(1),
    /** Review status is shown to the learner — be honest. */
    review: z.object({
      status: z.enum(["technically-reviewed", "draft"]),
      note: z.string().optional(),
    }),
  })
  .superRefine((lesson, ctx) => {
    const types = lesson.steps.map((s) => s.type);
    if (types[0] !== "scenario") {
      ctx.addIssue({ code: "custom", message: "lesson must start with a scenario step" });
    }
    if (types[types.length - 1] !== "recap") {
      ctx.addIssue({ code: "custom", message: "lesson must end with a recap step" });
    }
    if (!types.includes("exercise")) {
      ctx.addIssue({ code: "custom", message: "lesson needs at least one exercise" });
    }
    if (!types.includes("interview")) {
      ctx.addIssue({ code: "custom", message: "lesson needs an interview step" });
    }
    const ids = new Set<string>();
    for (const step of lesson.steps) {
      if (step.type === "exercise") {
        if (ids.has(step.exercise.id)) {
          ctx.addIssue({ code: "custom", message: `duplicate exercise id ${step.exercise.id}` });
        }
        ids.add(step.exercise.id);
        const ex = step.exercise;
        if (ex.kind === "single" && ex.options.filter((o) => o.correct).length !== 1) {
          ctx.addIssue({ code: "custom", message: `single-choice ${ex.id} needs exactly one correct option` });
        }
        if (ex.kind === "multi" && ex.options.filter((o) => o.correct).length < 1) {
          ctx.addIssue({ code: "custom", message: `multi-choice ${ex.id} needs a correct option` });
        }
        if (ex.kind === "order") {
          const itemIds = ex.items.map((i) => i.id).sort();
          const orderIds = [...ex.correctOrder].sort();
          if (JSON.stringify(itemIds) !== JSON.stringify(orderIds)) {
            ctx.addIssue({ code: "custom", message: `order exercise ${ex.id}: correctOrder must be a permutation of items` });
          }
        }
        if (ex.kind === "register") {
          const max = ex.width === 32 ? 0xffffffff : (1 << ex.width) - 1;
          if (ex.initial > max || ex.target > max) {
            ctx.addIssue({ code: "custom", message: `register exercise ${ex.id}: value exceeds width` });
          }
        }
      }
    }
  });
export type Lesson = z.infer<typeof lessonSchema>;

/* ---------- Missions (branching fault isolation) ---------- */

export const missionActionSchema = z.object({
  id: z.string(),
  label: z.string(),
  category: z.enum(["inspect", "measure", "scope", "firmware", "rework", "document"]),
  /** Simulated bench time this action costs. */
  costMinutes: z.number().int().positive(),
  /** Available only after ANY of these actions were performed. */
  requiresAnyOf: z.array(z.string()).optional(),
  /** What the learner observes. Clearly simulated. */
  result: markdown,
  /** How a senior engineer would judge this move at this point. */
  assessment: z.enum(["key", "useful", "neutral", "wasteful", "risky"]),
  assessmentNote: markdown,
  /** Evidence tag collected by this action (used to justify a diagnosis). */
  evidence: z.string().optional(),
});
export type MissionAction = z.infer<typeof missionActionSchema>;

export const missionDiagnosisSchema = z.object({
  id: z.string(),
  label: z.string(),
  correct: z.boolean(),
  /** Evidence tags needed to *justify* this diagnosis (for the correct one). */
  requiresEvidence: z.array(z.string()).optional(),
  feedback: markdown,
});

export const missionFixSchema = z.object({
  id: z.string(),
  label: z.string(),
  quality: z.enum(["best", "acceptable", "wrong"]),
  feedback: markdown,
});

export const missionSchema = z
  .object({
    slug,
    moduleId: z.string(),
    title: z.string(),
    summary: z.string(),
    durationMinutes: z.number().int().positive(),
    /** Simulated time budget a lead would expect for first isolation. */
    budgetMinutes: z.number().int().positive(),
    whyItMatters: z.string().min(20),
    scenario: markdown,
    /** What a correct outcome looks like, shown as the mission goal. */
    goal: markdown,
    actions: z.array(missionActionSchema).min(6),
    diagnoses: z.array(missionDiagnosisSchema).min(3),
    fixes: z.array(missionFixSchema).min(2),
    /** The efficient path a senior engineer would take. */
    optimalPath: z.array(z.string()).min(2),
    debrief: markdown,
    references: z.array(referenceSchema).min(1),
    relatedLesson: slug.optional(),
  })
  .superRefine((m, ctx) => {
    const ids = new Set(m.actions.map((a) => a.id));
    for (const a of m.actions) {
      for (const r of a.requiresAnyOf ?? []) {
        if (!ids.has(r)) ctx.addIssue({ code: "custom", message: `action ${a.id} requires unknown ${r}` });
      }
    }
    for (const p of m.optimalPath) {
      if (!ids.has(p)) ctx.addIssue({ code: "custom", message: `optimalPath references unknown ${p}` });
    }
    if (m.diagnoses.filter((d) => d.correct).length !== 1) {
      ctx.addIssue({ code: "custom", message: "mission needs exactly one correct diagnosis" });
    }
    if (m.fixes.filter((f) => f.quality === "best").length !== 1) {
      ctx.addIssue({ code: "custom", message: "mission needs exactly one best fix" });
    }
    const evidence = new Set(m.actions.map((a) => a.evidence).filter(Boolean));
    for (const d of m.diagnoses) {
      for (const e of d.requiresEvidence ?? []) {
        if (!evidence.has(e)) ctx.addIssue({ code: "custom", message: `diagnosis ${d.id} requires unknown evidence ${e}` });
      }
    }
  });
export type Mission = z.infer<typeof missionSchema>;
export type MissionDiagnosis = z.infer<typeof missionDiagnosisSchema>;
export type MissionFix = z.infer<typeof missionFixSchema>;

/* ---------- Curriculum ---------- */

export const curriculumModuleSchema = z.object({
  id: z.string(),
  number: z.number().int().positive(),
  section: z.enum(["A", "B", "C", "D", "E"]),
  title: z.string(),
  priority: z.enum(["P0", "P1", "P2"]),
  summary: z.string(),
  /** Lessons in intended order. Published ones must exist in the lesson registry. */
  lessons: z.array(
    z.object({
      title: z.string(),
      status: z.enum(["published", "planned"]),
      slug: slug.optional(),
    }),
  ),
  missions: z.array(z.object({ title: z.string(), status: z.enum(["published", "planned"]), slug: slug.optional() })).optional(),
});
export type CurriculumModule = z.infer<typeof curriculumModuleSchema>;

/* ---------- 30-day guided journey ---------- */

export const journeyItemSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("lesson"), slug }),
  z.object({ kind: z.literal("mission"), slug }),
  /** Rehearse these interview questions and rate yourself. */
  z.object({
    kind: z.literal("interview"),
    questionIds: z.array(z.string()).min(1),
    /** Open the question set in timed mock-interview mode. */
    mock: z.boolean().optional(),
  }),
  /** Spaced review of due cards. Complete when nothing is due. */
  z.object({ kind: z.literal("review") }),
  /** A real-world career action the learner ticks off herself. */
  z.object({
    kind: z.literal("apply"),
    id: z.string(),
    title: z.string(),
    detail: z.string(),
    minutes: z.number().int().positive(),
    /** Optional in-app screen that supports the action (for example the portfolio track). */
    href: z.string().optional(),
  }),
  /** Content not yet published; shown as coming soon, never completable. */
  z.object({ kind: z.literal("planned"), title: z.string(), minutes: z.number().int().positive() }),
]);
export type JourneyItem = z.infer<typeof journeyItemSchema>;

export const journeyDaySchema = z.object({
  day: z.number().int().min(1).max(30),
  title: z.string(),
  /** One sentence on what this day is for, in interview-readiness terms. */
  focus: z.string(),
  /** Fast-track block 1–6 (days 1–5, 6–10, ...). */
  block: z.number().int().min(1).max(6),
  items: z.array(journeyItemSchema).min(1),
});
export type JourneyDay = z.infer<typeof journeyDaySchema>;

export const sectionTitles: Record<CurriculumModule["section"], string> = {
  A: "Electronics & hardware engineering",
  B: "Embedded software & firmware",
  C: "Product R&D, integration & debugging",
  D: "Cross-industry specialisation",
  E: "Interviews & career",
};

/* ---------- Portfolio track ---------- */

/**
 * Where a deliverable can be completed. "doc" is written work; "sim" runs in simulation
 * (in-app or on a host PC); "hw" needs the physical board; "both" has a simulation path
 * and a hardware path that are recorded separately and never merged.
 */
export const deliverablePathSchema = z.enum(["doc", "sim", "hw", "both"]);
export type DeliverablePath = z.infer<typeof deliverablePathSchema>;

export const projectDeliverableSchema = z.object({
  id: z.string(),
  title: z.string(),
  detail: markdown,
  path: deliverablePathSchema,
  /** What to record as evidence when this is done (a number, a file, a capture). */
  evidence: z.string(),
});
export type ProjectDeliverable = z.infer<typeof projectDeliverableSchema>;

export const projectStageSchema = z.object({
  id: slug,
  title: z.string(),
  goal: z.string(),
  body: markdown,
  deliverables: z.array(projectDeliverableSchema).min(1),
  /** In-app interactive shown in this stage, if any. */
  visual: visualIdSchema.optional(),
  relatedLessons: z.array(slug).default([]),
});
export type ProjectStage = z.infer<typeof projectStageSchema>;

export const projectSchema = z
  .object({
    slug,
    title: z.string(),
    summary: markdown,
    whyItMatters: markdown,
    /** What the simulation path is and what it can and cannot prove. */
    simulationNote: markdown,
    /** What the hardware path needs and that it is optional. */
    hardwareNote: markdown,
    stages: z.array(projectStageSchema).min(3),
    references: z.array(referenceSchema).default([]),
  })
  .superRefine((p, ctx) => {
    const ids = new Set<string>();
    for (const st of p.stages) {
      if (ids.has(st.id)) ctx.addIssue({ code: "custom", message: `duplicate stage id ${st.id}` });
      ids.add(st.id);
      const dids = new Set<string>();
      for (const d of st.deliverables) {
        if (dids.has(d.id)) ctx.addIssue({ code: "custom", message: `duplicate deliverable id ${st.id}/${d.id}` });
        dids.add(d.id);
      }
    }
  });
export type Project = z.infer<typeof projectSchema>;

