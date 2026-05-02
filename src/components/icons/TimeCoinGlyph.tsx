import glyph from "@/assets/time-coin-glyph.jpeg";

type Props = {
  size?: number;
  className?: string;
  alt?: string;
};

/**
 * Small circular Time-Coin glyph (the mono hourglass-infinity coin) intended
 * to sit inline next to a `$` value to reinforce the Time-Coin tokenisation
 * narrative. Defaults to 14px so it pairs visually with surrounding text.
 */
export function TimeCoinGlyph({ size = 14, className, alt = "Time-Coin" }: Props) {
  return (
    <img
      src={glyph}
      alt={alt}
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        borderRadius: 9999,
        objectFit: "cover",
        display: "inline-block",
        verticalAlign: "-2px",
      }}
      className={className}
      draggable={false}
    />
  );
}
