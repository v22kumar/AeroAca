"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { projects, getLesson, getMission } from "@/lib/content";
import type { DeliverablePath } from "@/lib/content/schema";
import { useProgress } from "@/lib/progress/ProgressProvider";
import { projectState, projectKey, evidenceTable, type Path } from "@/lib/progress/portfolio";
import { Card } from "@/components/ui/Card";
import { Markdown } from "@/components/ui/Markdown";
import { Disclosure } from "@/components/ui/Disclosure";

import { Visual } from "@/components/visuals/Visual";
import { Skeleton } from "@/components/ui/Skeleton";
import { Icon } from "@/components/ui/Icon";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { getLab } from "@/lib/labs/generated";

const pathLabel: Record<Path, string> = { doc: "Written", sim: "Simulation", hw: "Hardware" };

/** A details element whose children are rendered only after it has been opened once, so the page parses one stage's Markdown at a time. */
function StageDisclosure({ title, defaultOpen, children }: { title: string; defaultOpen: boolean; children: ReactNode }) {
  const [opened, setOpened] = useState(defaultOpen);
  return (
    <details className="group" open={defaultOpen || undefined} onToggle={(e) => { if ((e.currentTarget as HTMLDetailsElement).open) setOpened(true); }}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-[15px] font-semibold text-ink marker:hidden [&::-webkit-details-marker]:hidden">
        <span>{title}</span>
        <span aria-hidden className="text-ink-3 transition-transform group-open:rotate-180">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6l5 5 5-5" /></svg>
        </span>
      </summary>
      <div className="px-4 pb-4">{opened ? children : null}</div>
    </details>
  );
}
const pathBadge: Record<DeliverablePath, string> = { doc: "Written work", sim: "Simulation path", hw: "Hardware path (optional)", both: "Simulation and hardware paths, recorded separately" };

export function PortfolioView() {
  const { state, store, hydrated } = useProgress();
  const project = projects[0]!;
  const ps = useMemo(() => projectState(state, project), [state, project]);
  const rows = useMemo(() => evidenceTable(ps), [ps]);

  if (!hydrated) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4" aria-busy="true">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">Portfolio track</p>
        <h1 className="mt-1 text-[26px] font-bold leading-tight tracking-tight md:text-3xl">{project.title}</h1>
        <div className="mt-2 text-[15px] text-ink-2">
          <Markdown>{project.summary}</Markdown>
        </div>
        <p className="mt-2 text-sm text-ink-3" data-testid="portfolio-progress">
          {ps.completeCount} of {ps.total} deliverables complete · simulation {ps.sim.done}/{ps.sim.total} · hardware {ps.hw.done}/{ps.hw.total} · written {ps.doc.done}/{ps.doc.total}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card className="p-4 text-sm">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ok">Simulation path</p>
          <Markdown size="sm">{project.simulationNote}</Markdown>
        </Card>
        <Card className="p-4 text-sm">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber">Hardware path</p>
          <Markdown size="sm">{project.hardwareNote}</Markdown>
        </Card>
      </div>

      <div className="rounded-xl border border-accent/25 bg-accent-soft/50 px-3 py-2 text-sm">
        <Markdown size="sm">{project.whyItMatters}</Markdown>
      </div>

      <h2 className="sr-only">Project stages</h2>
      <ol className="flex flex-col gap-4" aria-label="Project stages">
        {project.stages.map((st, i) => {
          const ss = ps.stages[i]!;
          const current = ps.currentStage === st.id;
          return (
            <li key={st.id}>
              <Card className={`overflow-hidden ${current ? "border-accent" : ""}`} data-testid={`stage-${st.id}`}>
                <StageDisclosure title={`${i + 1}. ${st.title} · ${ss.doneCount}/${ss.total}${ss.complete ? " · complete" : current ? " · current" : ""}`} defaultOpen={current}>
                  <p className="text-sm font-semibold">{st.goal}</p>
                  <div className="mt-2">
                    <Markdown>{st.body}</Markdown>
                  </div>
                  {st.visual && (
                    <div className="mt-4 rounded-xl border border-line bg-surface p-3">
                      <Visual id={st.visual} />
                    </div>
                  )}
                  {st.buildIt && (
                    <div className="mt-4 rounded-xl border border-accent/25 bg-accent-soft/30 p-3" data-testid={`build-it-${st.id}`}>
                      <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">Build it</h3>
                      <div className="mt-1 text-sm">
                        <Markdown size="sm">{st.buildIt.intro}</Markdown>
                      </div>
                      <ol className="mt-3 flex flex-col gap-4">
                        {st.buildIt.steps.map((b, k) => {
                          const lab = getLab(b.lab);
                          return (
                            <li key={`${b.lab}-${k}`} className="flex flex-col gap-2">
                              <p className="text-[15px] font-semibold">
                                {k + 1}. {b.title}
                              </p>
                              {lab ? (
                                <>
                                  <p className="text-xs text-ink-3">
                                    In <code>{lab.dir}</code>, run:
                                  </p>
                                  <CodeBlock code={lab.command} label="Command" language="bash" />
                                  <CodeBlock code={lab.expectedOutput} label="Expected output" />
                                </>
                              ) : (
                                <p className="text-danger text-sm">Lab {b.lab} is missing.</p>
                              )}
                              {b.note && (
                                <div className="text-sm text-ink-2">
                                  <Markdown size="sm">{b.note}</Markdown>
                                </div>
                              )}
                            </li>
                          );
                        })}
                      </ol>
                    </div>
                  )}
                  <h3 className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-ink-3">Deliverables</h3>
                  <ul className="mt-2 divide-y divide-line rounded-xl border border-line">
                    {ss.deliverables.map((d) => (
                      <li key={d.deliverable.id} className="p-3" data-testid={`deliverable-${d.deliverable.id}`}>
                        <p className={`text-[15px] ${d.complete ? "text-ink-2 line-through decoration-line-2" : "font-medium"}`}>{d.deliverable.title}</p>
                        <p className="mt-0.5 text-xs text-ink-3">{pathBadge[d.deliverable.path]}</p>
                        <div className="mt-1 text-sm text-ink-2">
                          <Markdown size="sm">{d.deliverable.detail}</Markdown>
                        </div>
                        <p className="mt-1 text-xs text-ink-3">
                          <span className="font-semibold">Evidence to keep:</span> {d.deliverable.evidence}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-3">
                          {d.paths.map((p) => (
                            <label key={p} className="flex cursor-pointer items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={d.done[p]}
                                onChange={(e) => store.setApplyDone(projectKey(project.slug, st.id, d.deliverable.id, p), e.target.checked)}
                                className="h-4 w-4 accent-[var(--c-accent)]"
                                data-testid={`tick-${d.deliverable.id}-${p}`}
                                aria-label={`${d.deliverable.title}: ${pathLabel[p]} done`}
                              />
                              {pathLabel[p]} done
                            </label>
                          ))}
                        </div>
                      </li>
                    ))}
                  </ul>
                  {st.relatedLessons.length > 0 && (
                    <p className="mt-3 text-xs text-ink-3">
                      Grounded in:{" "}
                      {st.relatedLessons.map((slug, k) => {
                        const l = getLesson(slug);
                        const m = l ? undefined : getMission(slug);
                        const href = l ? `/lessons/${slug}` : m ? `/missions/${slug}` : null;
                        const title = l?.title ?? m?.title ?? slug;
                        return (
                          <span key={slug}>
                            {k > 0 ? " · " : ""}
                            {href ? (
                              <Link href={href} className="font-semibold text-accent underline underline-offset-2">
                                {title}
                              </Link>
                            ) : (
                              title
                            )}
                          </span>
                        );
                      })}
                    </p>
                  )}
                </StageDisclosure>
              </Card>
            </li>
          );
        })}
      </ol>

      <Card className="p-4" data-testid="evidence-table">
        <h2 className="text-lg font-bold">Your evidence table: simulated versus hardware</h2>
        <p className="mt-1 text-sm text-ink-2">Derived only from the boxes you ticked above. The app never fills this in. Copy it into the stage-7 report as it stands.</p>
        <div className="mt-3 overflow-x-auto" tabIndex={0} role="region" aria-label="Scrollable table">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className="border border-line bg-surface-2 p-2 text-left font-semibold">Deliverable</th>
                <th className="border border-line bg-surface-2 p-2 text-left font-semibold">Written</th>
                <th className="border border-line bg-surface-2 p-2 text-left font-semibold">Simulation</th>
                <th className="border border-line bg-surface-2 p-2 text-left font-semibold">Hardware</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={`${r.stage}-${r.deliverable}`}>
                  <td className="border border-line p-2">
                    <span className="block text-ink-3">{r.stage}</span>
                    {r.deliverable}
                  </td>
                  {(["doc", "sim", "hw"] as const).map((p) => (
                    <td key={p} className={`border border-line p-2 ${r[p] === "done" ? "text-ok" : r[p] === "not done" ? "text-amber" : "text-ink-3"}`}>
                      {r[p] === "done" ? (
                        <span className="inline-flex items-center gap-1 font-semibold"><Icon name="check" size={12} /> done</span>
                      ) : (
                        r[p]
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-ink-3" data-testid="evidence-summary">
          Simulation {ps.sim.done}/{ps.sim.total} · hardware {ps.hw.done}/{ps.hw.total}.{" "}
          {ps.hw.done === 0 ? "Hardware path not attempted: say so in the report; the simulation evidence stands on its own." : ps.hw.done < ps.hw.total ? "Hardware path partly done: list what ran on the board and what did not." : "Hardware path complete."}
        </p>
      </Card>

      {project.references.length > 0 && (
        <Disclosure title="References">
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {project.references.map((r) => (
              <li key={r.title}>
                {r.title}
                {r.id ? ` (${r.id})` : ""}
                {r.note ? `: ${r.note}` : ""}
              </li>
            ))}
          </ul>
        </Disclosure>
      )}
      <p className="text-xs text-ink-3">Training is not employment: describe this project as a self-built project, with the table above, and never as professional experience.</p>
    </div>
  );
}
