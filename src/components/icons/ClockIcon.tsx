type Props = { size?: number; className?: string };

/** Stylised analogue clock at 10:10 in money color. */
export function ClockIcon({ size = 32, className }: Props) {
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
      <circle cx="16" cy="16" r="12" />
      {/* hour ticks at 12 / 3 / 6 / 9 */}
      <line x1="16" y1="5"  x2="16" y2="7" />
      <line x1="27" y1="16" x2="25" y2="16" />
      <line x1="16" y1="27" x2="16" y2="25" />
      <line x1="5"  y1="16" x2="7"  y2="16" />
      {/* hands at 10:10 */}
      <line x1="16" y1="16" x2="10" y2="11" />
      <line x1="16" y1="16" x2="22" y2="11" />
      <circle cx="16" cy="16" r="1.4" fill="#9A7246" stroke="none" />
    </svg>
  );
}
