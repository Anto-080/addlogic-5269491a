type Props = { size?: number; className?: string };

/**
 * Gold hexagon with a "$" inside — used for the Dashboard "All Time" badge.
 * Color matches money tone (#9A7246).
 */
export function HexDollar({ size = 32, className }: Props) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M16 2.5 L28 9.25 L28 22.75 L16 29.5 L4 22.75 L4 9.25 Z"
        stroke="#9A7246"
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill="#9A7246"
        fillOpacity="0.08"
      />
      <text
        x="16"
        y="21"
        textAnchor="middle"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fontWeight="700"
        fontSize="15"
        fill="#9A7246"
      >
        $
      </text>
    </svg>
  );
}
