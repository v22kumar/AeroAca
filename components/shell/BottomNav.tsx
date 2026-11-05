"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/Icon";

const items: { href: string; label: string; icon: IconName; match: (p: string) => boolean }[] = [
  { href: "/", label: "Today", icon: "home", match: (p) => p === "/" },
  { href: "/curriculum", label: "Learn", icon: "book", match: (p) => p.startsWith("/curriculum") || p.startsWith("/lessons") || p.startsWith("/missions") },
  { href: "/interview", label: "Interview", icon: "mic", match: (p) => p.startsWith("/interview") },
  { href: "/progress", label: "Progress", icon: "chart", match: (p) => p.startsWith("/progress") || p.startsWith("/review") },
  { href: "/glossary", label: "Terms", icon: "search", match: (p) => p.startsWith("/glossary") },
];

export function BottomNav() {
  const pathname = usePathname() ?? "/";
  return (
    <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur pb-safe md:hidden">
      <ul className="mx-auto grid max-w-2xl grid-cols-5">
        {items.map((it) => {
          const active = it.match(pathname);
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${active ? "text-accent" : "text-ink-3 hover:text-ink"}`}
              >
                <Icon name={it.icon} size={22} />
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function SideNav() {
  const pathname = usePathname() ?? "/";
  return (
    <nav aria-label="Primary" className="hidden md:block">
      <ul className="flex flex-col gap-1">
        {items.map((it) => {
          const active = it.match(pathname);
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-semibold ${active ? "bg-accent-soft text-accent" : "text-ink-2 hover:bg-surface-2 hover:text-ink"}`}
              >
                <Icon name={it.icon} size={20} />
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
