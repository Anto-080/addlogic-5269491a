import { SVGProps } from "react";

/**
 * Gold shield with a small star inside — used to mark "Suggested Guidance
 * Protocols" for dual-use technologies (formerly the red ShieldAlert warning).
 */
export function ShieldStar({
  size = 16,
  className,
  ...props
}: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Shield outline (matches lucide Shield) */}
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      {/* Small star centred in the shield */}
      <polygon
        points="12,8.5 13.06,10.65 15.43,11 13.71,12.67 14.12,15.03 12,13.92 9.88,15.03 10.29,12.67 8.57,11 10.94,10.65"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}
