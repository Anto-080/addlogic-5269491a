type Props = { size?: number; className?: string; style?: React.CSSProperties };

/**
 * Faithful round bank-vault door, redrawn to match the user's reference.
 *
 * Layout (64x64 viewBox, vault centered around x=28 to leave room for the
 * right-side latch arm):
 *  - Thick outer ring (gold via currentColor)
 *  - 8 perimeter rivets evenly distributed around the ring
 *  - Inner recessed circle (subtle fill so it reads as a recessed plate)
 *  - 5-spoke central turning handle with round hub and rounded spoke ends
 *  - Square hinge bracket on the LEFT, vertically centered with the door
 *  - Latch bolt on the right
 *  - Small keyhole below the handle hub
 */
export function RoundVault({ size = 24, className, style }: Props) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden
    >
      <path d="M2 32a30 30 0 0 1 60 0" strokeWidth="5.25" />
      <path d="M8.25 32a23.75 23.75 0 0 1 47.5 0" strokeWidth="3.9" />
      <circle cx="32" cy="32" r="15.75" strokeWidth="3.2" />
      <circle cx="32" cy="32" r="14.2" fill="currentColor" fillOpacity="0.08" stroke="none" />

      {[
        [18.5, 18.8],
        [31.9, 15.2],
        [45.3, 18.8],
        [48.7, 32],
        [45.3, 45.2],
        [31.9, 48.8],
        [18.5, 45.2],
        [15.1, 32],
      ].map(([cx, cy], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r="2.55" />
          <circle cx={cx} cy={cy} r="0.82" fill="currentColor" stroke="none" />
        </g>
      ))}

      {[
        [32, 32, 32, 21.1],
        [32, 32, 41.7, 26.5],
        [32, 32, 39.8, 40.1],
        [32, 32, 24.2, 40.1],
        [32, 32, 22.3, 26.5],
      ].map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="3" />
      ))}
      <circle cx="32" cy="32" r="3.9" fill="currentColor" stroke="none" />

      <path d="M8 24.8h6.8v14.4H8" strokeWidth="3.2" />
      <path d="M49.8 30h11.2" strokeWidth="3.2" />
      <path d="M49.8 34h11.2" strokeWidth="3.2" />
      <path d="M31 39.9c0-1.3 0.7-2 1.8-2s1.8 0.7 1.8 2v1.3h-3.6z" strokeWidth="2.2" />
      <circle cx="32.8" cy="44.3" r="1.25" fill="currentColor" stroke="none" />
    </svg>
  );
}
