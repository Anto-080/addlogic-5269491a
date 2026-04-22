type Props = { size?: number; className?: string; style?: React.CSSProperties };

/**
 * Faithful round bank-vault door drawn as inline SVG so it always renders
 * crisply in the active text color (defaults to currentColor, set by caller
 * to the Vault gold #B0903D). Mirrors the user-supplied reference: circular
 * outer ring, ring of 6 bolts, central spoked dial, side hinge/locking
 * mechanism on the right.
 */
export function RoundVault({ size = 24, className, style }: Props) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden
    >
      {/* Outer door ring */}
      <circle cx="30" cy="32" r="22" />

      {/* Hinge / locking arm on the right */}
      <path d="M48 22 h6 a3 3 0 0 1 3 3 v4 a3 3 0 0 1 -3 3 h-3 a3 3 0 0 0 -3 3 v4 a3 3 0 0 0 3 3 h3 a3 3 0 0 1 3 3 v4 a3 3 0 0 1 -3 3 h-6" />

      {/* Bolt ring (6 bolts around the perimeter) */}
      <circle cx="30" cy="14" r="1.6" fill="currentColor" />
      <circle cx="44" cy="20" r="1.6" fill="currentColor" />
      <circle cx="44" cy="44" r="1.6" fill="currentColor" />
      <circle cx="30" cy="50" r="1.6" fill="currentColor" />
      <circle cx="16" cy="44" r="1.6" fill="currentColor" />
      <circle cx="16" cy="20" r="1.6" fill="currentColor" />

      {/* Central dial — outer */}
      <circle cx="30" cy="32" r="9" />
      {/* Spokes */}
      <line x1="30" y1="25" x2="30" y2="29" />
      <line x1="30" y1="35" x2="30" y2="39" />
      <line x1="23" y1="32" x2="27" y2="32" />
      <line x1="33" y1="32" x2="37" y2="32" />
      <line x1="25.2" y1="27.2" x2="27.5" y2="29.5" />
      <line x1="32.5" y1="34.5" x2="34.8" y2="36.8" />
      <line x1="34.8" y1="27.2" x2="32.5" y2="29.5" />
      <line x1="27.5" y1="34.5" x2="25.2" y2="36.8" />
      {/* Hub */}
      <circle cx="30" cy="32" r="2.2" fill="currentColor" />
    </svg>
  );
}
