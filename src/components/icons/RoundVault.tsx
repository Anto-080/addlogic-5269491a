type Props = { size?: number; className?: string; color?: string };

// Round bank vault door modeled after the uploaded reference:
// outer ring, inner door ring, central wheel/dial with cross-spokes,
// six bolt dots around the perimeter, hinge bracket on the right.
export function RoundVault({ size = 24, className, color }: Props) {
  const stroke = color ?? "currentColor";
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      stroke={stroke}
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {/* outer door */}
      <circle cx="29" cy="32" r="24" />
      {/* inner door rim */}
      <circle cx="29" cy="32" r="20" />
      {/* hinge bracket on the right side */}
      <path d="M49 17 h8 a2 2 0 0 1 2 2 v6 a2 2 0 0 1 -2 2 h-6" />
      <path d="M49 47 h8 a2 2 0 0 0 2 -2 v-6 a2 2 0 0 0 -2 -2 h-6" />
      {/* central wheel */}
      <circle cx="29" cy="32" r="7" />
      <circle cx="29" cy="32" r="2.2" fill={stroke} stroke="none" />
      {/* spokes on wheel */}
      <path d="M29 25 v-3" />
      <path d="M29 39 v3" />
      <path d="M22 32 h-3" />
      <path d="M36 32 h3" />
      {/* six bolt dots around perimeter */}
      <circle cx="29" cy="14" r="1.6" fill={stroke} stroke="none" />
      <circle cx="29" cy="50" r="1.6" fill={stroke} stroke="none" />
      <circle cx="14" cy="23" r="1.6" fill={stroke} stroke="none" />
      <circle cx="14" cy="41" r="1.6" fill={stroke} stroke="none" />
      <circle cx="44" cy="22" r="1.6" fill={stroke} stroke="none" />
      <circle cx="44" cy="42" r="1.6" fill={stroke} stroke="none" />
    </svg>
  );
}
