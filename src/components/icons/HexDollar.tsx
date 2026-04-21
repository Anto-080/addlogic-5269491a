type Props = { size?: number; className?: string };

// Stylised gold hexagon with a $ inside — for the Dashboard "All Time" badge.
export function HexDollar({ size = 32, className }: Props) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-label="All-time earnings">
      <polygon
        points="16,2 28,9 28,23 16,30 4,23 4,9"
        fill="none"
        stroke="#9A7246"
        strokeWidth="2"
        strokeLinejoin="round"
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
