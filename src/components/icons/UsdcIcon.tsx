type Props = { size?: number; className?: string };

// Stylised USDC token: blue circle with white "$" — generic representation
export function UsdcIcon({ size = 16, className }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-label="USDC"
    >
      <circle cx="12" cy="12" r="11" fill="#2775CA" />
      <circle cx="12" cy="12" r="9" fill="none" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="0.8" />
      <text
        x="12"
        y="16.2"
        textAnchor="middle"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fontWeight="700"
        fontSize="13"
        fill="#ffffff"
      >
        $
      </text>
    </svg>
  );
}
