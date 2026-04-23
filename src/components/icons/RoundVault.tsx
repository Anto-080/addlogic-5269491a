type Props = { size?: number; className?: string; style?: React.CSSProperties };

/**
 * Faithful redraw of the uploaded vault-door reference.
 *
 * Reference layout (64x64 viewBox):
 *  - Two concentric outer rings forming the door rim (slightly broken on the
 *    upper-left to mimic the stylistic gap in the source — closed here so it
 *    reads cleanly at small sizes).
 *  - 6 perimeter rivets evenly spaced around the inner ring.
 *  - Central round handle plate with a 4-spoke wheel and a small hub.
 *  - Square hinge/latch bracket on the RIGHT side, with two rounded "C"
 *    cut-outs and 3 small bolts.
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
      {/* Outer rim — two concentric circles centered slightly left of middle */}
      <circle cx="28" cy="32" r="26" strokeWidth="3" />
      <circle cx="28" cy="32" r="22" strokeWidth="2.4" />

      {/* 6 perimeter rivets on the inner band */}
      {[
        [28, 14],
        [42, 22],
        [42, 42],
        [28, 50],
        [14, 42],
        [14, 22],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="1.9" strokeWidth="2.2" />
      ))}

      {/* Central handle plate */}
      <circle cx="28" cy="32" r="9" strokeWidth="2.4" />

      {/* 4-spoke wheel handle with rounded knobs */}
      {[
        [28, 25.2],
        [34.8, 32],
        [28, 38.8],
        [21.2, 32],
      ].map(([x2, y2], i) => (
        <line key={i} x1="28" y1="32" x2={x2} y2={y2} strokeWidth="2.2" />
      ))}
      {[
        [28, 25.2],
        [34.8, 32],
        [28, 38.8],
        [21.2, 32],
      ].map(([cx, cy], i) => (
        <circle key={`k-${i}`} cx={cx} cy={cy} r="1.4" fill="currentColor" stroke="none" />
      ))}
      <circle cx="28" cy="32" r="1.6" fill="currentColor" stroke="none" />

      {/* Right-side hinge/latch bracket — outer rounded square */}
      <path
        d="M44 18 H58 a2 2 0 0 1 2 2 V44 a2 2 0 0 1 -2 2 H44"
        strokeWidth="2.8"
      />
      {/* Inner cut-outs forming the two "C" notches that hug the door */}
      <path
        d="M52 24 a6 6 0 0 0 -6 6 a6 6 0 0 0 6 6"
        strokeWidth="2.4"
      />
      {/* 3 small bolts on the bracket */}
      <circle cx="55" cy="22.5" r="1.2" strokeWidth="1.8" />
      <circle cx="55" cy="32" r="1.2" strokeWidth="1.8" />
      <circle cx="55" cy="41.5" r="1.2" strokeWidth="1.8" />
    </svg>
  );
}
