type Props = { size?: number; className?: string };

/** Stylised sandglass / hourglass in money color. */
export function SandglassIcon({ size = 32, className }: Props) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      stroke="#9A7246"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {/* Top & bottom plates */}
      <line x1="7" y1="4" x2="25" y2="4" />
      <line x1="7" y1="28" x2="25" y2="28" />
      {/* Glass body — two trapezoids meeting at the neck */}
      <path d="M9 4 L23 4 L17.5 16 L23 28 L9 28 L14.5 16 Z" />
      {/* Sand top (filled) */}
      <path d="M11 6 L21 6 L17 12.5 L15 12.5 Z" fill="#9A7246" stroke="none" />
      {/* Sand bottom pile */}
      <path d="M12 26 L20 26 L17.5 22 L14.5 22 Z" fill="#9A7246" stroke="none" />
      {/* Falling grains */}
      <line x1="16" y1="14.5" x2="16" y2="19.5" />
    </svg>
  );
}
