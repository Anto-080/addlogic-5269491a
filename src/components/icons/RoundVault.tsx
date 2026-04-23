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
      <path d="M3.5 32a22.5 22.5 0 1 1 45 0" strokeWidth="3.6" />
      <path d="M8.8 32a17.2 17.2 0 1 1 34.4 0" strokeWidth="3" />
      <circle cx="26" cy="32" r="11.5" strokeWidth="3" />
      <circle cx="26" cy="32" r="3.25" fill="currentColor" stroke="none" />

      {[
        [14.8, 22.5],
        [26, 18.1],
        [37.2, 22.5],
        [14.8, 41.5],
        [37.2, 41.5],
      ].map(([cx, cy], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r="2.45" />
          <circle cx={cx} cy={cy} r="0.82" fill="currentColor" stroke="none" />
        </g>
      ))}

      {[
        [0, -6.2, 0, -9.2],
        [6.2, 0, 9.2, 0],
        [0, 6.2, 0, 9.2],
        [-6.2, 0, -9.2, 0],
      ].map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={26 + x1} y1={32 + y1} x2={26 + x2} y2={32 + y2} strokeWidth="3" />
      ))}

      <path d="M40.5 21.5h15.2c2.8 0 5 2.2 5 5v11" strokeWidth="3.4" />
      <path d="M40.5 42.5h15.2c2.8 0 5-2.2 5-5v-11" strokeWidth="3.4" />
      <path d="M40.5 21.5c-2.8 0-5.1 2.3-5.1 5.1S37.7 31.7 40.5 31.7" strokeWidth="3.4" />
      <path d="M40.5 42.5c-2.8 0-5.1-2.3-5.1-5.1s2.3-5.1 5.1-5.1" strokeWidth="3.4" />
      <circle cx="55.2" cy="23.8" r="2.35" />
      <circle cx="55.2" cy="40.2" r="2.35" />
      <circle cx="55.2" cy="23.8" r="0.82" fill="currentColor" stroke="none" />
      <circle cx="55.2" cy="40.2" r="0.82" fill="currentColor" stroke="none" />
    </svg>
  );
}
