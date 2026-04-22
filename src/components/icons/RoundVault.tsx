import vaultPng from "@/assets/vault-door.png";

type Props = { size?: number; className?: string; style?: React.CSSProperties };

/**
 * Renders the user-supplied round bank-vault door asset, tinted via
 * CSS mask so the silhouette always inherits the caller's `color`
 * (defaults to inherit, the Vault gold #B0903D when passed in).
 */
export function RoundVault({ size = 24, className, style }: Props) {
  return (
    <span
      className={className}
      style={{
        display: "inline-block",
        width: size,
        height: size,
        backgroundColor: "currentColor",
        WebkitMaskImage: `url(${vaultPng})`,
        maskImage: `url(${vaultPng})`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        ...style,
      }}
      aria-hidden
    />
  );
}
