import { describe, expect, it } from "vitest";
import { careerLadder, journeyStages } from "@/content";
import { careerLadderSchema } from "@/lib/content/schema";

/**
 * The career ladder shows pay figures to a learner, so it is held to a stricter standard than prose:
 * every number has a public source and a date, bands rise with the rungs, the summary band is inside
 * the figures behind it, and the words never promise an outcome.
 */
describe("career ladder", () => {
  it("passes the schema, with ids in order and the starting level present", () => {
    const r = careerLadderSchema.safeParse(careerLadder);
    expect(r.success, r.success ? "" : JSON.stringify(r.error.issues, null, 2)).toBe(true);
    expect(careerLadder.levels.map((l) => l.id)).toEqual(["level-1", "level-2", "level-3", "level-4"]);
    expect(careerLadder.levels.some((l) => l.id === careerLadder.startingLevel)).toBe(true);
  });

  it("bands rise with each rung and each band lies within the figures that support it", () => {
    let prevLow = 0;
    for (const l of careerLadder.levels) {
      expect(l.band.high).toBeGreaterThan(l.band.low);
      expect(l.band.low, l.id).toBeGreaterThan(prevLow);
      prevLow = l.band.low;
      const lows = l.sources.map((s) => s.low);
      const highs = l.sources.map((s) => s.high ?? s.low);
      expect(l.band.low, `${l.id} band low vs sources`).toBeGreaterThanOrEqual(Math.min(...lows));
      expect(l.band.high, `${l.id} band high vs sources`).toBeLessThanOrEqual(Math.max(...highs));
    }
  });

  it("every source names a publisher, a dated month no older than a year before asOf, and a public page", () => {
    const asOf = Date.parse(`${careerLadder.asOf}-01T00:00:00Z`);
    for (const l of careerLadder.levels) {
      for (const s of l.sources) {
        const d = Date.parse(`${s.dated}-01T00:00:00Z`);
        expect(d, `${l.id}: ${s.what}`).toBeLessThanOrEqual(asOf);
        expect(asOf - d, `${l.id}: ${s.what} is older than a year`).toBeLessThanOrEqual(366 * 24 * 3600 * 1000);
        expect(s.url.startsWith("https://")).toBe(true);
        expect(s.publisher.length).toBeGreaterThan(3);
      }
    }
  });

  it("never promises an outcome, and says what the numbers are", () => {
    const text = JSON.stringify(careerLadder).toLowerCase();
    for (const banned of ["guarantee", "guaranteed", "you will earn", "you will get", "assured", "placement"]) expect(text, banned).not.toContain(banned);
    expect(careerLadder.disclaimer).toMatch(/not .*promise|not a promise/i);
    expect(careerLadder.disclaimer).toMatch(/lakh/i);
  });

  it("every stage of the journey points at a level that exists, and the stages build towards the next rung", () => {
    const ids = new Set(careerLadder.levels.map((l) => l.id));
    for (const st of journeyStages) expect(ids.has(st.ladderLevel), `stage ${st.stage}`).toBe(true);
    expect(journeyStages.at(-1)!.ladderLevel).toBe("level-2");
  });
});
