type Props = { size?: number; className?: string };

/**
 * US-DIA-style seal recreation: a globe wrapped by a crimson Möbius-strip
 * ribbon, surmounted by a sky-blue infinity symbol (#00BFFF) and surrounded
 * by stars.
 */
export function DiaSeal({ size = 200, className }: Props) {
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={className}
      aria-hidden
    >
      {/* Stars surrounding the seal */}
      {Array.from({ length: 14 }).map((_, i) => {
        const angle = (i / 14) * Math.PI * 2 - Math.PI / 2;
        const r = 92;
        const x = 100 + Math.cos(angle) * r;
        const y = 100 + Math.sin(angle) * r;
        return (
          <polygon
            key={i}
            points={`${x},${y - 3} ${x + 1},${y - 1} ${x + 3},${y - 1} ${x + 1.2},${y + 0.6} ${x + 2},${y + 3} ${x},${y + 1.6} ${x - 2},${y + 3} ${x - 1.2},${y + 0.6} ${x - 3},${y - 1} ${x - 1},${y - 1}`}
            fill="#D4B95E"
          />
        );
      })}

      {/* Globe */}
      <circle cx="100" cy="108" r="50" fill="#0E2A47" stroke="#D4B95E" strokeWidth="2" />
      {/* Latitude lines */}
      <ellipse cx="100" cy="108" rx="50" ry="14" fill="none" stroke="#3A6FA0" strokeWidth="1" />
      <ellipse cx="100" cy="108" rx="50" ry="28" fill="none" stroke="#3A6FA0" strokeWidth="1" />
      <line x1="50" y1="108" x2="150" y2="108" stroke="#3A6FA0" strokeWidth="1" />
      {/* Longitude */}
      <ellipse cx="100" cy="108" rx="14" ry="50" fill="none" stroke="#3A6FA0" strokeWidth="1" />
      <ellipse cx="100" cy="108" rx="28" ry="50" fill="none" stroke="#3A6FA0" strokeWidth="1" />
      {/* Continent suggestion */}
      <path d="M78 92 q12 -6 22 2 q10 6 8 18 q-2 12 -16 14 q-14 2 -20 -10 q-6 -12 6 -24 z"
            fill="#1F4A2F" opacity="0.85" />

      {/* Crimson Möbius ribbon */}
      <path
        d="M30 140 C 60 110, 140 110, 170 140 C 140 170, 60 170, 30 140 Z"
        fill="none"
        stroke="#B91C2E"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <path
        d="M40 142 C 70 124, 130 158, 160 142"
        fill="none"
        stroke="#7A0F1A"
        strokeWidth="3"
      />

      {/* Sky-blue infinity (replaces flaming torch) */}
      <path
        d="M70 42 C 70 24, 96 24, 100 42 C 104 60, 130 60, 130 42 C 130 24, 104 24, 100 42 C 96 60, 70 60, 70 42 Z"
        fill="none"
        stroke="#00BFFF"
        strokeWidth="6"
        strokeLinecap="round"
      />
    </svg>
  );
}
