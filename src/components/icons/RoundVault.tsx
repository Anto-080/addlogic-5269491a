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
      {/* LEFT hinge bracket — square, vertically aligned with the door center (y=32) */}
      <rect x="2" y="22" width="6" height="20" rx="1.2" />
      <line x1="5" y1="27" x2="5" y2="27.01" />
      <line x1="5" y1="37" x2="5" y2="37.01" />

      {/* RIGHT latch bolt — square block + protruding bolt */}
      <rect x="50" y="28" width="6" height="8" rx="1" />
      <line x1="56" y1="32" x2="60" y2="32" strokeWidth="3.5" />

      {/* Outer thick door ring */}
      <circle cx="28" cy="32" r="22" strokeWidth="3.6" />

      {/* Inner recessed plate */}
      <circle cx="28" cy="32" r="17" strokeWidth="1.8" fill="currentColor" fillOpacity="0.08" />

      {/* 8 perimeter rivets (filled dots on the outer ring) */}
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
        const cx = 28 + Math.cos(a) * 22;
        const cy = 32 + Math.sin(a) * 22;
        return <circle key={i} cx={cx} cy={cy} r="1.6" fill="currentColor" stroke="none" />;
      })}

      {/* Central 5-spoke turning handle */}
      {Array.from({ length: 5 }).map((_, i) => {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
        const x1 = 28 + Math.cos(a) * 3.2;
        const y1 = 32 + Math.sin(a) * 3.2;
        const x2 = 28 + Math.cos(a) * 11;
        const y2 = 32 + Math.sin(a) * 11;
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        );
      })}
      {/* Round hub */}
      <circle cx="28" cy="32" r="3.2" fill="currentColor" stroke="none" />

      {/* Keyhole below the hub */}
      <circle cx="28" cy="42.5" r="1.4" fill="currentColor" stroke="none" />
      <path d="M28 43.6 L28 46" strokeWidth="1.6" />
    </svg>
  );
}
