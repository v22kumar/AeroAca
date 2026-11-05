"use client";

import { Button, LinkButton } from "@/components/ui/Button";
import { PageHeader } from "@/components/shell/PageHeader";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader eyebrow="Something went wrong" title="This page hit an error" lede="Your saved progress on this device is not affected. You can retry, or go back to Today." />
      <p className="mb-6 rounded-xl border border-line bg-surface-2 p-3 font-mono text-xs text-ink-2 break-words">{error.message || "Unknown error"}</p>
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => reset()}>Try again</Button>
        <LinkButton href="/" variant="secondary">
          Go to Today
        </LinkButton>
      </div>
    </div>
  );
}
