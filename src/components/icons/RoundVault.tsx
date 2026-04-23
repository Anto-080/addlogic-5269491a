type Props = { size?: number; className?: string; style?: React.CSSProperties };

/**
 * Faithful round bank-vault door redrawn from the user's reference:
 * - Circular outer ring with a subtle inner ring
 * - 6 perimeter bolts evenly distributed
 * - Right-side rectangular hinge/locking bracket (square loop, not curvy)
 * - Central spoked dial with hub
 *
 * Strokes use currentColor so the caller controls the gold (#B0903D).
 */
export function RoundVault({ size = 24, className, style }: Props) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden
    >
      {/* Outer door ring */}
      <circle cx="28" cy="32" r="22" />
      {/* Inner ring (thin gap, like the reference) */}
      <circle cx="28" cy="32" r="19" strokeWidth="1.6" />

      {/* Right-side rectangular hinge / locking bracket */}
      <path d="M46 18 h10 a2 2 0 0 1 2 2 v10 a2 2 0 0 1 -2 2 h-4 a2 2 0 0 0 -2 2 v4 a2 2 0 0 0 2 2 h4 a2 2 0 0 1 2 2 v10 a2 2 0 0 1 -2 2 h-10" />

      {/* Six perimeter bolts (open rings, like the reference) */}
      <circle cx="28" cy="14" r="2" />
      <circle cx="42" cy="20" r="2" />
      <circle cx="42" cy="44" r="2" />
      <circle cx="28" cy="50" r="2" />
      <circle cx="14" cy="44" r="2" />
      <circle cx="14" cy="20" r="2" />

      {/* Central dial — outer ring */}
      <circle cx="28" cy="32" r="8.5" />
      {/* 8 spokes */}
      <line x1="28" y1="25.5" x2="28" y2="28.5" />
      <line x1="28" y1="35.5" x2="28" y2="38.5" />
      <line x1="21.5" y1="32" x2="24.5" y2="32" />
      <line x1="31.5" y1="32" x2="34.5" y2="32" />
      <line x1="23.4" y1="27.4" x2="25.5" y2="29.5" />
      <line x1="30.5" y1="34.5" x2="32.6" y2="36.6" />
      <line x1="32.6" y1="27.4" x2="30.5" y2="29.5" />
      <line x1="25.5" y1="34.5" x2="23.4" y2="36.6" />
      {/* Hub */}
      <circle cx="28" cy="32" r="2.4" fill="currentColor" />
    </svg>
  );
}
