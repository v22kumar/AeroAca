import { describe, expect, it } from "vitest";
import { ProgressStore } from "@/lib/progress/store";
import { journeyState } from "@/lib/progress/journey";
import { projectState } from "@/lib/progress/portfolio";
import { recommendations } from "@/lib/progress/recommend";
import { projects } from "@/content";

/** A backup written by Release 0.1 (schema version 1, before activeRuns, applyDone, journeyDone and project ticks existed). */
const release01Backup = JSON.stringify({
  version: 1,
  createdAt: 1_790_000_000_000,
  updatedAt: 1_790_100_000_000,
  lessons: {
    "mcu-board-does-not-boot": {
      startedAt: 1_790_000_000_000,
      completedAt: 1_790_050_000_000,
      lastStep: 9,
      stepsSeen: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      exercises: { "first-check": { attempts: [{ at: 1_790_010_000_000, correct: false }, { at: 1_790_011_000_000, correct: true }], solvedAt: 1_790_011_000_000 } },
    },
    "i2c-sensor-not-acknowledging": { startedAt: 1_790_060_000_000, lastStep: 5, stepsSeen: [0, 1, 2, 3, 4, 5], exercises: { "first-byte-0x4a": { attempts: [{ at: 1_790_061_000_000, correct: false }] } } },
  },
  missions: {
    "fresh-board-no-sign-of-life": {
      startedAt: 1_790_070_000_000,
      runs: [{ startedAt: 1_790_070_000_000, finishedAt: 1_790_071_000_000, actions: ["rails", "reset", "hsi"], minutesUsed: 20, diagnosisId: "boot0", fixId: "pullup-override", correct: true, evidenceBacked: true, score: 90 }],
    },
  },
  interview: { "mcu-no-boot-walkthrough": { confidence: "shaky", ratedAt: 1_790_080_000_000 } },
  review: { "boot-1": { box: 1, due: 1_790_200_000_000, reviews: 1, lastResult: "good" } },
  activeDays: ["2026-09-22", "2026-09-23"],
});

const now = () => 1_800_000_000_000;

describe("progress backups from earlier releases", () => {
  it("a Release 0.1 backup imports unchanged and every later feature derives from it without a migration step", () => {
    const s = new ProgressStore(null, now);
    expect(s.importJson(release01Backup)).toBe(true);
    const st = s.getState();
    expect(st.lessons["mcu-board-does-not-boot"]?.completedAt).toBeDefined();
    expect(st.activeRuns).toBeUndefined();
    expect(st.applyDone).toBeUndefined();
    // Journey (0.2) derives from the old facts: day 1's lesson is done, the rest is not.
    const js = journeyState(st, now());
    expect(js.days[0]!.items[0]).toMatchObject({ done: true });
    expect(js.completedDays).toBe(0);
    // Targeted review and recommendations (0.2, 0.9) see the old wrong attempt.
    const recs = recommendations(st, 10);
    expect(recs.some((r) => r.kind === "retry" && r.href.includes("i2c-sensor-not-acknowledging"))).toBe(true);
    // Portfolio (0.7) starts empty rather than failing.
    expect(projectState(st, projects[0]!).completeCount).toBe(0);
    // Round trip keeps everything and adds nothing the schema does not know.
    const again = new ProgressStore(null, now);
    expect(again.importJson(s.exportJson())).toBe(true);
    expect(again.getState()).toEqual(st);
  });

  it("rejects a backup with an unknown version instead of corrupting the current state", () => {
    const s = new ProgressStore(null, now);
    s.startLesson("mcu-board-does-not-boot");
    const before = s.getState();
    expect(s.importJson(release01Backup.replace('"version":1', '"version":2'))).toBe(false);
    expect(s.getState()).toEqual(before);
  });
});
