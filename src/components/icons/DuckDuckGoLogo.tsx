import duckLogo from "@/assets/duck-logo.jpeg";

type Props = { size?: number; className?: string };

/**
 * Personalised DuckDuckGo-style mark — twin crowned ducks with wings,
 * gold-on-black heraldic emblem. Used wherever the in-app search is shown.
 */
export function DuckDuckGoLogo({ size = 20, className }: Props) {
  return (
    <img
      src={duckLogo}
      width={size}
      height={size}
      alt="In-app search emblem"
      className={className}
      style={{ objectFit: "contain", borderRadius: "9999px" }}
    />
  );
}
