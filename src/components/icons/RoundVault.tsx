type Props = { size?: number; className?: string; style?: React.CSSProperties };

/**
 * Round bank-vault door inspired by the user's reference image:
 * - circular outer rim
 * - inner door with central spinning dial
 * - cross-spokes radiating from the dial
 * - six bolt dots around the perimeter
 * - hinge bracket on the right
 *
 * Uses currentColor for strokes/fills so callers control color via
 * `color: '#B0903D'` (passed inline or via className).
 */
export function RoundVault({ size = 24, className, style }: Props) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden
    >
      {/* outer rim */}
      <circle cx="15" cy="16" r="13" />
      {/* inner door */}
      <circle cx="15" cy="16" r="10" />
      {/* central dial */}
      <circle cx="15" cy="16" r="2.2" fill="currentColor" />
      {/* cross spokes from the dial */}
      <line x1="15" y1="8.5" x2="15" y2="23.5" />
      <line x1="7.5" y1="16" x2="22.5" y2="16" />
      <line x1="9.7" y1="10.7" x2="20.3" y2="21.3" />
      <line x1="20.3" y1="10.7" x2="9.7" y2="21.3" />
      {/* perimeter bolts */}
      <circle cx="15" cy="4.2" r="0.6" fill="currentColor" />
      <circle cx="15" cy="27.8" r="0.6" fill="currentColor" />
      <circle cx="3.2" cy="16" r="0.6" fill="currentColor" />
      <circle cx="26.8" cy="16" r="0.6" fill="currentColor" />
      <circle cx="6.5" cy="7.5" r="0.6" fill="currentColor" />
      <circle cx="23.5" cy="24.5" r="0.6" fill="currentColor" />
      {/* hinge bracket on the right */}
      <path d="M28.5 12.5 h2 v3 h-2 z" fill="currentColor" stroke="none" />
      <path d="M28.5 16.5 h2 v3 h-2 z" fill="currentColor" stroke="none" />
    </svg>
  );
}
