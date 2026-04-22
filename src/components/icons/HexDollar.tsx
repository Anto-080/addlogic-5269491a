type Props = { size?: number; className?: string };

/**
 * Tiny stylised badge: a hexagon outlined in amber/gold with a "$" inside,
 * matching the rest of the dashboard amber palette. Used for the "All Time"
 * earnings card icon.
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
      {/* hexagon */}
      <path
        d="M16 2.5 L28 9.25 L28 22.75 L16 29.5 L4 22.75 L4 9.25 Z"
        stroke="hsl(var(--primary))"
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill="hsl(var(--primary) / 0.08)"
      />
      <text
        x="16"
        y="21"
        textAnchor="middle"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fontWeight="700"
        fontSize="15"
        fill="hsl(var(--primary))"
      >
        $
      </text>
    </svg>
  );
}
