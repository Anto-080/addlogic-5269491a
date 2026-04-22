type Props = { size?: number; className?: string };

/** Opera "O" mark — generic recreation: red ring with vertical white ellipse cut-out. */
export function OperaLogo({ size = 24, className }: Props) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={className}
      aria-hidden
    >
      <circle cx="16" cy="16" r="14" fill="#FF1B2D" />
      <ellipse cx="16" cy="16" rx="6" ry="10" fill="#FFFFFF" />
    </svg>
  );
}
