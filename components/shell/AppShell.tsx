import Link from "next/link";
import type { ReactNode } from "react";
import { BottomNav, SideNav } from "./BottomNav";
import { Wordmark } from "./Wordmark";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-3 focus:py-2 focus:text-on-accent"
      >
        Skip to content
      </a>
      <div className="mx-auto flex w-full max-w-5xl md:gap-8 md:px-6">
        <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col gap-6 py-8 md:flex">
          <Link href="/" className="px-3" aria-label="AeroAca home">
            <Wordmark />
          </Link>
          <SideNav />
          <p className="mt-auto px-3 text-xs leading-relaxed text-ink-3">
            Progress is stored on this device only.
          </p>
        </aside>
        <div className="min-w-0 flex-1">
          <header className="flex items-center justify-between px-4 pt-safe pb-2 pt-4 md:hidden">
            <Link href="/" aria-label="AeroAca home">
              <Wordmark />
            </Link>
          </header>
          <main id="main" className="px-4 pb-28 md:px-0 md:py-8">
            {children}
          </main>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
