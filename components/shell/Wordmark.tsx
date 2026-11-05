export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true">
        <rect x="2" y="2" width="28" height="28" rx="8" fill="var(--c-accent)" />
        <path d="M8 21 L16 9 L24 21" stroke="var(--c-on-accent)" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M11.5 17.5 H20.5" stroke="var(--c-on-accent)" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="16" cy="24.5" r="1.6" fill="var(--c-on-accent)" />
      </svg>
      <span className="text-[17px] font-bold tracking-tight text-ink">AeroAca</span>
    </span>
  );
}
