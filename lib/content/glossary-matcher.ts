import { glossary, type GlossaryTerm } from "@/content/glossary";

/**
 * Finds glossary terms in Markdown (mdast) text nodes and turns the first
 * occurrence of each term into a link with the special URL `term:<id>`.
 * The UI renders those links as tappable definitions.
 *
 * Rules:
 * - Matching is case-insensitive, except for aliases written in capitals
 *   (ACK, START, CAN...) which must match exactly, so "can" and "start" in prose stay plain.
 * - Code, links and headings are never touched.
 * - One link per term per tree (i.e. per rendered Markdown block).
 */

type MdNode = { type: string; value?: string; children?: MdNode[]; url?: string; depth?: number };

type Entry = { id: string; canonical: string; exact: boolean };

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildMatcher(terms: GlossaryTerm[] = glossary): { regex: RegExp; lookup: Map<string, Entry> } {
  const lookup = new Map<string, Entry>();
  const aliases: string[] = [];
  for (const t of terms) {
    for (const a of [t.term, ...(t.aliases ?? [])]) {
      const key = a.toLowerCase();
      if (lookup.has(key)) continue;
      const exact = a === a.toUpperCase() && /[A-Z]/.test(a);
      lookup.set(key, { id: t.id, canonical: a, exact });
      aliases.push(a);
    }
  }
  aliases.sort((x, y) => y.length - x.length);
  const regex = new RegExp(`(?<![\\w-])(${aliases.map(escapeRe).join("|")})(?![\\w-])`, "giu");
  return { regex, lookup };
}

const SKIP_PARENTS = new Set(["inlineCode", "code", "link", "linkReference", "heading", "html"]);

export function linkTerms(tree: MdNode, matcher = buildMatcher()): string[] {
  const seen = new Set<string>();
  const order: string[] = [];

  const splitText = (value: string): MdNode[] => {
    const out: MdNode[] = [];
    let last = 0;
    matcher.regex.lastIndex = 0;
    for (const m of value.matchAll(matcher.regex)) {
      const text = m[1] ?? "";
      const entry = matcher.lookup.get(text.toLowerCase());
      if (!entry) continue;
      if (entry.exact && text !== entry.canonical) continue;
      if (seen.has(entry.id)) continue;
      seen.add(entry.id);
      order.push(entry.id);
      const start = m.index ?? 0;
      if (start > last) out.push({ type: "text", value: value.slice(last, start) });
      out.push({ type: "link", url: `term:${entry.id}`, children: [{ type: "text", value: text }] });
      last = start + text.length;
    }
    if (out.length === 0) return [{ type: "text", value }];
    if (last < value.length) out.push({ type: "text", value: value.slice(last) });
    return out;
  };

  const walk = (node: MdNode) => {
    if (!node.children) return;
    if (SKIP_PARENTS.has(node.type)) return;
    const next: MdNode[] = [];
    for (const child of node.children) {
      if (child.type === "text" && child.value) next.push(...splitText(child.value));
      else {
        walk(child);
        next.push(child);
      }
    }
    node.children = next;
  };
  walk(tree);
  return order;
}

/** remark plugin factory */
export function remarkGlossary() {
  const matcher = buildMatcher();
  return (tree: unknown) => {
    linkTerms(tree as MdNode, matcher);
  };
}
