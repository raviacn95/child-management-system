/** Abstract Willow tree — never a child face. Safe for share cards and TV. */
export function FamilyMark({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 160 96"
      role="img"
      aria-label="Willow mark"
      data-testid="family-mark"
    >
      <rect width="160" height="96" rx="16" fill="var(--color-pine-soft)" />
      <path d="M80 78 V38" stroke="var(--color-pine)" strokeWidth="4" strokeLinecap="round" />
      <path
        d="M80 42 C58 42 48 28 52 16 C64 20 72 14 80 10 C88 14 96 20 108 16 C112 28 102 42 80 42 Z"
        fill="var(--color-pine)"
      />
      <circle cx="56" cy="72" r="7" fill="var(--color-clay)" />
      <circle cx="80" cy="70" r="8" fill="var(--color-gold)" />
      <circle cx="104" cy="72" r="7" fill="var(--color-sky)" />
    </svg>
  )
}
