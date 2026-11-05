import type { SVGProps } from "react";

export type IconName = "home" | "book" | "mic" | "chart" | "chevron-right" | "chevron-left" | "check" | "x" | "bolt" | "clock" | "refresh" | "cards" | "info" | "target" | "download";

const paths: Record<IconName, string> = {
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  book: "M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5zM4 19.5V4.5M20 15H6.5A2.5 2.5 0 0 0 4 17.5",
  mic: "M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zM19 11a7 7 0 0 1-14 0M12 18v3M8 21h8",
  chart: "M4 20V10M10 20V4M16 20v-8M22 20H2",
  "chevron-right": "M9 5l7 7-7 7",
  "chevron-left": "M15 5l-7 7 7 7",
  check: "M4 12.5l5 5L20 7",
  x: "M6 6l12 12M18 6L6 18",
  bolt: "M13 2 4 14h7l-1 8 9-12h-7z",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 7v5l3 2",
  refresh: "M20 11A8 8 0 0 0 5.6 6.5L4 8M4 4v4h4M4 13a8 8 0 0 0 14.4 4.5L20 16M20 20v-4h-4",
  cards: "M4 7h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2zM8 7V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-2",
  info: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-5M12 8h.01",
  target: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12h.01",
  download: "M12 3v12M7 10l5 5 5-5M4 21h16",
};

export function Icon({ name, size = 20, ...rest }: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path d={paths[name]} />
    </svg>
  );
}
