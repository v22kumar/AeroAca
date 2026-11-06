"use client";

import { useState } from "react";
import { Button } from "./Button";

/** A code or terminal block with a copy button. Trusted, repository-authored text only. */
export function CodeBlock({ code, label, language, testId }: { code: string; label?: string; language?: string; testId?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className="overflow-hidden rounded-xl border border-line" data-testid={testId}>
      <div className="flex items-center justify-between gap-2 border-b border-line bg-surface-2/60 px-3 py-1.5 text-xs text-ink-3">
        <span className="font-semibold">{label ?? language ?? "code"}</span>
        <Button size="sm" variant="secondary" onClick={copy} aria-label={`Copy ${label ?? "code"}`}>
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <pre className="m-0 overflow-x-auto rounded-none border-0 p-3 text-[13px] leading-relaxed" tabIndex={0} role="region" aria-label={`${label ?? "code"}, scrollable`}>
        <code className={language ? `language-${language}` : undefined}>{code}</code>
      </pre>
    </div>
  );
}
