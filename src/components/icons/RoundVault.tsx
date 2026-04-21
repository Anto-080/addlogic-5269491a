type Props = { size?: number; className?: string };

// Round bank vault door: outer ring, dial, spokes, hinges, handle
export function RoundVault({ size = 24, className }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {/* outer door ring */}
      <circle cx="12" cy="12" r="9.5" />
      {/* inner door */}
      <circle cx="12" cy="12" r="7" />
      {/* central dial */}
      <circle cx="12" cy="12" r="1.6" />
      {/* spokes */}
      <path d="M12 7v-2.2" />
      <path d="M12 17v2.2" />
      <path d="M7 12h-2.2" />
      <path d="M17 12h2.2" />
      <path d="M8.5 8.5l-1.6-1.6" />
      <path d="M15.5 15.5l1.6 1.6" />
      <path d="M15.5 8.5l1.6-1.6" />
      <path d="M8.5 15.5l-1.6 1.6" />
      {/* hinges (left side) */}
      <path d="M2.2 9.5h1.4" />
      <path d="M2.2 14.5h1.4" />
    </svg>
  );
}
