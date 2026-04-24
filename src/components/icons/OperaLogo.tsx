type Props = { size?: number; className?: string };

/**
 * Authentic Opera "O" mark — solid red ring with a tall central white
 * ellipse cut-out, matching the brand mark used on com.opera.browser.
 * Used because we route searches through the actual Opera WebView and are
 * therefore licensed to display the trademark.
 */
export function OperaLogo({ size = 24, className }: Props) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      aria-label="Opera"
      role="img"
    >
      <defs>
        <radialGradient id="opera-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FF1B2D" />
          <stop offset="100%" stopColor="#C9001F" />
        </radialGradient>
      </defs>
      {/* Outer red disc */}
      <circle cx="32" cy="32" r="30" fill="url(#opera-grad)" />
      {/* Inner white ellipse cut-out — drawn directly so masks aren't needed */}
      <ellipse cx="32" cy="32" rx="11" ry="20" fill="#ffffff" />
    </svg>
  );
}
