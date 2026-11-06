import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { unified } from "unified";
import remarkParse from "remark-parse";
import { lessonSchema } from "@/lib/content/schema";
import { buildMatcher, linkTerms } from "@/lib/content/glossary-matcher";
import { glossary } from "@/content/glossary";
import { DEPTHS } from "@/lib/content/schema";
import { exerciseIdsAt, visibleStepIndices } from "@/lib/content/depth";
import { labs as generatedLabs } from "@/lib/labs/generated";
import { hilArchitectureAndBenchDesign } from "@/content/lessons/hil-architecture-and-bench-design";
import { fromFmeaToFaultInjection } from "@/content/lessons/from-fmea-to-fault-injection";
import { logsToEvidence } from "@/content/lessons/logs-to-evidence";
import { pytestForHardwareTests } from "@/content/lessons/pytest-for-hardware-tests";
import { architectureOfATestFramework } from "@/content/lessons/architecture-of-a-test-framework";
const arc = [hilArchitectureAndBenchDesign, fromFmeaToFaultInjection, logsToEvidence, pytestForHardwareTests, architectureOfATestFramework];
const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
type Node = { type: string; url?: string; children?: Node[] };
const collect = (n: Node, out: string[] = []): string[] => { if (n.type === "link" && n.url?.startsWith("term:")) out.push(n.url.slice(5)); n.children?.forEach((c) => collect(c, out)); return out; };
describe("f3 lessons", () => {
  for (const l of arc) it(l.slug, () => {
    const r = lessonSchema.safeParse(l); expect(r.success, JSON.stringify(r.success ? "" : r.error.issues)).toBe(true);
    for (const s of l.steps) {
      if (s.type === "concept") expect(words(s.body), `${s.title}`).toBeLessThanOrEqual(220);
      if (s.type === "figure") expect(existsSync(`public/diagrams/${s.diagram}.svg`)).toBe(true);
      if (s.type === "lab") expect(Object.keys(generatedLabs).includes(s.lab), s.lab).toBe(true);
      if (s.type === "walkthrough") { const n = s.code.split("\n").length; let last = 0; for (const note of s.notes) { const [a, b] = note.lines.split("-").map(Number); expect(a).toBeGreaterThan(last); expect(b ?? a).toBeLessThanOrEqual(n); last = b ?? a!; } }
      if (s.type !== "recap") { expect(s.stage, s.type).toBeDefined(); if (s.type !== "scenario") expect(s.depth, s.type).toBeDefined(); }
      const body = (s as { body?: unknown }).body;
      if (typeof body === "string") for (const b of body.match(/```[\s\S]*?```/g) ?? []) expect(b.split("\n").length - 2 <= 6 || l.steps.some((x) => x.type === "walkthrough")).toBe(true);
    }
    const stages = l.steps.map((s) => s.stage ?? (s.type === "recap" ? "recap" : undefined));
    expect(l.steps[0]!.type).toBe("scenario"); expect(l.steps.at(-1)!.type).toBe("recap");
    expect(stages.indexOf("theory")).toBeGreaterThan(stages.indexOf("intuition")); expect(stages.indexOf("intuition")).toBeGreaterThan(0);
    const fe = l.steps.findIndex((s) => s.type === "exercise"), fx = l.steps.findIndex((s) => s.type === "example");
    expect(fx).toBeGreaterThanOrEqual(0); expect(fx).toBeLessThan(fe);
    for (const st of ["complexity", "check", "work"]) expect(stages.indexOf(st)).toBeGreaterThan(0);
    const first = l.steps[fe] as { depth?: string; exercise: { hints?: unknown[] } };
    expect(first.depth).toBe("understand"); expect(first.exercise.hints?.length ?? 0).toBeGreaterThanOrEqual(2);
    expect(l.steps.filter((s) => s.type === "exercise").slice(1).some((s) => !(s as { exercise: { hints?: unknown } }).exercise.hints)).toBe(true);
    for (const d of DEPTHS) { const idx = visibleStepIndices(l, d); expect(exerciseIdsAt(l, d).length).toBeGreaterThan(0); expect(l.steps[idx.at(-1)!]!.type).toBe("recap"); }
    expect(exerciseIdsAt(l, "apply").length).toBeGreaterThan(exerciseIdsAt(l, "understand").length);
    expect(exerciseIdsAt(l, "master").length).toBeGreaterThan(exerciseIdsAt(l, "apply").length);
    const work = l.steps.find((s) => s.stage === "work") as { body: string };
    for (const re of [/development/i, /aerospace|UAV|avionics/i, /R&D|design/i, /verification|interview/i]) expect(work.body).toMatch(re);
    const text = l.steps.map((s) => ("body" in s ? s.body : s.type === "recap" ? s.summary : "")).join("\n\n");
    const tree = unified().use(remarkParse).parse(text) as unknown as Node; linkTerms(tree, buildMatcher());
    const terms = collect(tree); console.log(l.slug, terms.length, terms.join(","));
    expect(terms.length).toBeGreaterThanOrEqual(6);
    const terms2 = new Set(glossary.map((g) => g.term.toLowerCase()));
    for (const s of l.steps) if (s.type === "concept" && s.stage === "intuition") { const bolds = [...s.body.matchAll(/\*\*([^*]+)\*\*/g)].map((m) => m[1]!.toLowerCase()); for (const b of bolds.filter((x) => terms2.has(x))) expect(bolds.filter((x) => x === b).length).toBe(1); }
    const ids = l.steps.flatMap((s) => (s.type === "exercise" ? [s.exercise.id] : [])); expect(new Set(ids).size).toBe(ids.length);
  });
});
