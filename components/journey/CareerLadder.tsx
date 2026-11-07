"use client";

import { careerLadder } from "@/lib/content";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(n < 10 ? 2 : 1).replace(/\.?0+$/, ""));

/**
 * The career ladder: role names, the pay the market reports at each rung, and the evidence that moves an
 * engineer up. Every figure carries its source and date; the disclaimer sits with the numbers, not in a
 * footer, because a number without its origin would be a promise.
 */
export function CareerLadder({ currentLevel }: { currentLevel?: string }) {
  const start = currentLevel ?? careerLadder.startingLevel;
  return (
    <section aria-labelledby="ladder-heading" data-testid="career-ladder">
      <h2 id="ladder-heading" className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink-3">
        Where this leads
      </h2>
      <Card className="overflow-hidden">
        <p className="border-b border-line px-4 py-3 text-sm text-ink-2">
          Each stage builds evidence for a rung of this ladder. The pay figures are what public salary sites reported for India in {monthName(careerLadder.asOf)}, in lakhs per year, with the page and date behind each one. They describe the market, not a promise.
        </p>
        <ol className="divide-y divide-line">
          {careerLadder.levels.map((level) => {
            const here = level.id === start;
            const builds = level.id !== start && careerLadder.levels.findIndex((l) => l.id === level.id) === careerLadder.levels.findIndex((l) => l.id === start) + 1;
            return (
              <li key={level.id} data-testid={`ladder-${level.id}`}>
                <details className="group" open={here || builds}>
                  <summary className="flex cursor-pointer list-none items-start gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
                    <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${here ? "bg-accent text-on-accent" : builds ? "bg-accent-soft text-accent" : "bg-surface-2 text-ink-3"}`} aria-hidden>
                      {level.id.replace("level-", "")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold">
                        {level.title}
                        {here && <span className="ml-2 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">You are here</span>}
                        {builds && <span className="ml-2 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">This track builds the evidence</span>}
                      </span>
                      <span className="block text-xs text-ink-3">
                        {level.years} · reported pay about ₹{fmt(level.band.low)} to ₹{fmt(level.band.high)} lakh a year
                      </span>
                    </span>
                    <span aria-hidden className="mt-1 text-ink-3 transition-transform group-open:rotate-90">
                      <Icon name="chevron-right" size={18} />
                    </span>
                  </summary>
                  <div className="border-t border-line bg-surface-2/40 px-4 py-3 text-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-3">Roles on this rung</p>
                    <p className="mt-1 text-ink-2">{level.roles.join(" · ")}</p>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-ink-3">What the market asks for before it pays this</p>
                    <ul className="mt-1 list-disc space-y-1 pl-5 text-ink-2">
                      {level.evidence.map((e) => (
                        <li key={e}>{e}</li>
                      ))}
                    </ul>
                    <p className="mt-3 text-xs text-ink-3">
                      <span className="font-semibold">Built by:</span> {level.builtBy}
                    </p>
                    <details className="mt-3">
                      <summary className="cursor-pointer text-xs font-semibold text-accent underline underline-offset-2">
                        The {level.sources.length} figures behind the band
                      </summary>
                      <ul className="mt-2 space-y-1.5 text-xs text-ink-2">
                        {level.sources.map((src) => (
                          <li key={src.url + src.what}>
                            <a href={src.url} target="_blank" rel="noreferrer" className="font-semibold text-accent underline underline-offset-2">
                              {src.publisher}
                            </a>
                            : {src.what}: ₹{fmt(src.low)}
                            {src.high ? ` to ₹${fmt(src.high)}` : ""} lakh ({monthName(src.dated)}).
                          </li>
                        ))}
                      </ul>
                    </details>
                  </div>
                </details>
              </li>
            );
          })}
        </ol>
        <p className="border-t border-line px-4 py-3 text-xs text-ink-3" data-testid="ladder-disclaimer">
          {careerLadder.disclaimer}
        </p>
      </Card>
    </section>
  );
}

function monthName(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y!, (m ?? 1) - 1, 1)).toLocaleString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
}
