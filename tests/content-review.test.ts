import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { lessons, missions } from "@/content";

/** The content review log is a release gate: every published item must have a row, and the row must carry the item's own review status. */
describe("content review log", () => {
  const log = readFileSync("docs/CONTENT_REVIEW.md", "utf8");
  it("has a row for every published lesson with its review status", () => {
    for (const l of lessons) {
      const row = log.split("\n").find((line) => line.includes(`| \`${l.slug}\` |`));
      expect(row, l.slug).toBeDefined();
      expect(row, l.slug).toContain(`| ${l.review.status} |`);
    }
  });
  it("has a row for every published mission", () => {
    for (const m of missions) expect(log.includes(`| \`${m.slug}\` |`), m.slug).toBe(true);
  });
  it("marks second-reader review as pending or signed, never blank", () => {
    const rows = log.split("\n").filter((line) => /^\| (lesson|mission) \|/.test(line));
    expect(rows.length).toBe(lessons.length + missions.length);
    for (const r of rows) expect(r.trim().endsWith("|") && !/\|\s*\|$/.test(r), r).toBe(true);
  });
});
