import Link from "next/link";
import type { StartHereLesson } from "@/lib/progress/diagnostic";

export function StartHereList({ lessons }: { lessons: StartHereLesson[] }) {
  if (lessons.length === 0) return null;
  return (
    <ol className="mt-3 flex flex-col gap-2" data-testid="start-here-list">
      {lessons.map((l, i) => (
        <li key={l.slug} className="rounded-xl border border-line bg-surface p-3">
          <Link href={`/lessons/${l.slug}`} className="flex items-start gap-3 text-[15px] font-semibold text-accent underline underline-offset-2" data-testid={`start-here-${l.slug}`}>
            <span className="font-mono text-xs text-ink-3">{i + 1}.</span>
            <span className="min-w-0 flex-1">{l.title}</span>
            <span className="shrink-0 text-xs font-normal text-ink-3">{l.minutes} min</span>
          </Link>
          <p className="mt-1 pl-6 text-xs text-ink-3">
            Because you missed: {l.reasons.join(", ")}
          </p>
        </li>
      ))}
    </ol>
  );
}
