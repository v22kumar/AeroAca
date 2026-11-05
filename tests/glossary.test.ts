import { describe, expect, it } from "vitest";
import { unified } from "unified";
import remarkParse from "remark-parse";
import { glossary } from "@/content/glossary";
import { buildMatcher, linkTerms } from "@/lib/content/glossary-matcher";
import { lessons, missions, interviewQuestions } from "@/content";

type Node = { type: string; value?: string; url?: string; children?: Node[] };
const parse = (md: string) => unified().use(remarkParse).parse(md) as unknown as Node;
const collect = (n: Node, out: string[] = []): string[] => {
  if (n.type === "link" && n.url?.startsWith("term:")) out.push(n.url.slice(5));
  n.children?.forEach((c) => collect(c, out));
  return out;
};
/** Parse, run the matcher, return linked term ids in document order. */
const links = (n: Node): string[] => {
  linkTerms(n, buildMatcher());
  return collect(n);
};

describe("glossary matcher", () => {
  it("links the first occurrence of a term only, and skips code and headings", () => {
    const tree = parse("### NRST heading\n\nMeasure NRST, then NRST again. `NRST` in code stays. A pull-up and more pull-ups.");
    const order = linkTerms(tree, buildMatcher());
    expect(order).toEqual(["nrst", "pull-up"]);
    expect(collect(tree)).toEqual(["nrst", "pull-up"]);
  });

  it("treats capitalised aliases as case-sensitive so prose words stay plain", () => {
    expect(links(parse("You can start now."))).toEqual([]);
    expect(links(parse("A START condition, then CAN bus."))).toEqual(["start-stop", "can"]);
  });

  it("does not match inside longer words or existing links", () => {
    expect(links(parse("The scoped variable and [a scope link](https://example.com)."))).toEqual([]);
    expect(links(parse("Look at it on the scope."))).toEqual(["oscilloscope"]);
  });

  it("has unique ids and aliases, and every related lesson exists", () => {
    const ids = glossary.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
    const aliases = glossary.flatMap((g) => [g.term, ...(g.aliases ?? [])].map((a) => a.toLowerCase()));
    expect(new Set(aliases).size).toBe(aliases.length);
    const slugs = new Set(lessons.map((l) => l.slug));
    for (const g of glossary) {
      if (g.relatedLesson) expect(slugs.has(g.relatedLesson), g.id).toBe(true);
      expect(g.short.length).toBeGreaterThan(30);
      expect(g.why.length).toBeGreaterThan(30);
    }
    expect(glossary.length).toBeGreaterThanOrEqual(60);
  });

  it("every lesson, mission and interview question contains tappable terms", () => {
    for (const lesson of lessons) {
      const text = lesson.steps.map((s) => ("body" in s ? s.body : s.type === "recap" ? s.summary : "")).join("\n\n");
      expect(links(parse(text)).length, lesson.slug).toBeGreaterThan(8);
    }
    for (const m of missions) expect(links(parse(m.scenario)).length, m.slug).toBeGreaterThan(2);
    for (const q of interviewQuestions.filter((x) => x.relatedLesson)) expect(links(parse(q.question + "\n\n" + q.sampleAnswer)).length, q.id).toBeGreaterThan(1);
  });
});
