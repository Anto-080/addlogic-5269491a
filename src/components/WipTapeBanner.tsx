type Props = {
  text?: string;
  className?: string;
};

/**
 * Plastic caution-tape style "Work in Progress" banner — yellow base with
 * diagonal white/transparent end stripes. Rendered as a self-contained
 * inline element so it scales to any container width.
 */
export function WipTapeBanner({ text = "WORK IN PROGRESS", className }: Props) {
  const stripe = `repeating-linear-gradient(
    -45deg,
    #F5C400 0 14px,
    #F5C400 14px 14px,
    #ffffff 14px 22px,
    #F5C400 22px 36px
  )`;
  return (
    <div
      role="img"
      aria-label={text}
      className={className}
      style={{
        position: "relative",
        height: 36,
        width: "100%",
        borderRadius: 4,
        overflow: "hidden",
        boxShadow: "0 2px 6px hsl(0 0% 0% / 0.4)",
      }}
    >
      {/* Diagonal stripes on the very ends */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: stripe,
        }}
      />
      {/* Center yellow plate that hides the middle stripes */}
      <div
        style={{
          position: "absolute",
          left: 28,
          right: 28,
          top: 0,
          bottom: 0,
          background: "#F5C400",
          borderTop: "2px solid #d6a800",
          borderBottom: "2px solid #d6a800",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontFamily: "Impact, 'Arial Black', sans-serif",
            color: "#0E2F1F",
            fontSize: 14,
            letterSpacing: 2,
            fontWeight: 900,
            textShadow: "0 1px 0 hsl(0 0% 100% / 0.25)",
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
}
