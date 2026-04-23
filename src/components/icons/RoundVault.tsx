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
      <circle cx="26" cy="32" r="24" strokeWidth="3.2" />
      <circle cx="26" cy="32" r="19.3" strokeWidth="2.8" />
      <circle cx="26" cy="32" r="11.6" strokeWidth="2.8" />
      <circle cx="26" cy="32" r="6.1" strokeWidth="2.8" />

      {[
        [26, 12],
        [11, 21],
        [11, 43],
        [26, 52],
      ].map(([cx, cy], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r="2.45" />
          <circle cx={cx} cy={cy} r="0.8" fill="currentColor" stroke="none" />
        </g>
      ))}

      {Array.from({ length: 4 }).map((_, i) => {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        const x1 = 26 + Math.cos(a) * 3.6;
        const y1 = 32 + Math.sin(a) * 3.6;
        const x2 = 26 + Math.cos(a) * 8.2;
        const y2 = 32 + Math.sin(a) * 8.2;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="2.8" />;
      })}

      <circle cx="26" cy="32" r="2.55" fill="currentColor" stroke="none" />

      <path d="M42 17h12c4.1 0 7 2.9 7 7v4.5" strokeWidth="3.2" />
      <path d="M42 47h12c4.1 0 7-2.9 7-7v-4.5" strokeWidth="3.2" />
      <path d="M42 17c-2.8 0-5.1 2.3-5.1 5.1s2.3 5.1 5.1 5.1" strokeWidth="3.2" />
      <path d="M42 47c-2.8 0-5.1-2.3-5.1-5.1s2.3-5.1 5.1-5.1" strokeWidth="3.2" />
      <path d="M42 27.2h4.2c2.5 0 4.5 2 4.5 4.5v0.6c0 2.5-2 4.5-4.5 4.5H42" strokeWidth="3.2" />
      <circle cx="56.5" cy="21.8" r="2.45" />
      <circle cx="56.5" cy="42.2" r="2.45" />
      <circle cx="56.5" cy="21.8" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="56.5" cy="42.2" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}
