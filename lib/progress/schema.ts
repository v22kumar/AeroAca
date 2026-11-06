import { z } from "zod";

export const PROGRESS_VERSION = 1 as const;
export const STORAGE_KEY = "aeroaca.progress.v1";

const attempt = z.object({ at: z.number(), correct: z.boolean() });

export const lessonProgressSchema = z.object({
  startedAt: z.number(),
  completedAt: z.number().optional(),
  /** Highest step index the learner has reached (0-based). */
  lastStep: z.number().int().nonnegative(),
  stepsSeen: z.array(z.number().int().nonnegative()),
  exercises: z.record(
    z.string(),
    z.object({
      attempts: z.array(attempt),
      solvedAt: z.number().optional(),
    }),
  ),
});
export type LessonProgress = z.infer<typeof lessonProgressSchema>;

export const missionRunSchema = z.object({
  startedAt: z.number(),
  finishedAt: z.number(),
  actions: z.array(z.string()),
  minutesUsed: z.number(),
  diagnosisId: z.string(),
  fixId: z.string().optional(),
  correct: z.boolean(),
  evidenceBacked: z.boolean(),
  score: z.number(),
});
export type MissionRun = z.infer<typeof missionRunSchema>;

export const missionProgressSchema = z.object({
  startedAt: z.number(),
  runs: z.array(missionRunSchema),
});
export type MissionProgress = z.infer<typeof missionProgressSchema>;

/** A mission run in progress (or just finished), kept so a reload on a phone does not lose the bench log. */
export const activeMissionRunSchema = z.object({
  startedAt: z.number(),
  phase: z.enum(["investigate", "diagnose", "fix", "debrief"]),
  performed: z.array(z.string()),
  minutesUsed: z.number(),
  diagnosisId: z.string().optional(),
  fixId: z.string().optional(),
  /** Set once the finished run has been appended to history, so a reload cannot record it twice. */
  recorded: z.boolean().optional(),
});
export type ActiveMissionRun = z.infer<typeof activeMissionRunSchema>;

export const confidenceSchema = z.enum(["not-yet", "shaky", "confident"]);
export type Confidence = z.infer<typeof confidenceSchema>;

export const reviewEntrySchema = z.object({
  box: z.number().int().min(0).max(5),
  due: z.number(),
  reviews: z.number().int().nonnegative(),
  lastResult: z.enum(["again", "good"]).optional(),
});
export type ReviewEntry = z.infer<typeof reviewEntrySchema>;

export const progressStateSchema = z.object({
  version: z.literal(PROGRESS_VERSION),
  createdAt: z.number(),
  updatedAt: z.number(),
  lessons: z.record(z.string(), lessonProgressSchema),
  missions: z.record(z.string(), missionProgressSchema),
  interview: z.record(z.string(), z.object({ confidence: confidenceSchema, ratedAt: z.number() })),
  review: z.record(z.string(), reviewEntrySchema),
  /** ISO dates (YYYY-MM-DD, local) with any learning activity. */
  activeDays: z.array(z.string()),
  profile: z.object({ name: z.string().max(40).optional() }).optional(),
  activeRuns: z.record(z.string(), activeMissionRunSchema).optional(),
  /** Journey career actions ticked by the learner, keyed "d<day>:<id>" → timestamp. */
  applyDone: z.record(z.string(), z.number()).optional(),
  /** Journey review/interview items completed in context, keyed "d<day>:review" or "d<day>:interview" → timestamp. */
  journeyDone: z.record(z.string(), z.number()).optional(),
});
export type ProgressState = z.infer<typeof progressStateSchema>;

export function emptyProgress(now = Date.now()): ProgressState {
  return {
    version: PROGRESS_VERSION,
    createdAt: now,
    updatedAt: now,
    lessons: {},
    missions: {},
    interview: {},
    review: {},
    activeDays: [],
  };
}
