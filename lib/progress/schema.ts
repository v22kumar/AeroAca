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
