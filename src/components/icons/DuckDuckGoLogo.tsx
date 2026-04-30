type Props = { size?: number; className?: string };

/**
 * Inline DuckDuckGo-style mark (simplified duck silhouette in a circle).
 * Not the official logo — a distinguishable in-app substitute.
 */
export function DuckDuckGoLogo({ size = 20, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      aria-hidden="true"
    >
      <circle cx="16" cy="16" r="15" fill="#DE5833" />
      <circle cx="16" cy="16" r="15" fill="none" stroke="#fff" strokeOpacity="0.3" />
      <path
        d="M11 18c0-4 3-7 6-7 2 0 3 1 3 2s-1 2-2 2c-2 0-3 1-3 3v3h-2v-2c-1 0-2-0-2-1z"
        fill="#fff"
      />
      <circle cx="18" cy="13" r="1" fill="#1a1a1a" />
    </svg>
  );
}
