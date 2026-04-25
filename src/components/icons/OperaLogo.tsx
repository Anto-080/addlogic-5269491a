type Props = { size?: number; className?: string };

/**
 * Opera "O" mark — a single red shape with the inner white ellipse cut as a
 * geometric hole using `fillRule="evenodd"`. Drawing both subpaths inside one
 * <path> guarantees the cutout renders correctly on every WebView (Android
 * Opera, iOS WKWebView, Chrome, Safari) — the previous two-shape stack could
 * collapse into a red blob when the gradient defs were stripped by aggressive
 * SVG sanitisers in some published bundles.
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
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        fill="#E60012"
        d="
          M 32 2
          a 30 30 0 1 0 0.0001 0
          Z
          M 32 12
          a 11 20 0 1 0 0.0001 0
          Z
        "
      />
    </svg>
  );
}
