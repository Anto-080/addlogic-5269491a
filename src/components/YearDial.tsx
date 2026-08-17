import { useEffect, useRef, useState } from "react";

const ASH_GOLD = "#8C6F54";

/**
 * Mechanical combination-lock dial: numbers 1..10 on spinning wheels.
 * Swipe / drag left-right (or scroll) to turn the wheel.
 */
export function YearDial({
  value,
  onChange,
  min = 1,
  max = 10,
  label = "Years projected",
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  label?: string;
}) {
  const drag = useRef<{ x: number; start: number } | null>(null);
  const [spin, setSpin] = useState(0);

  const clamp = (n: number) => Math.min(max, Math.max(min, n));

  const set = (n: number) => {
    const v = clamp(n);
    if (v !== value) {
      setSpin((s) => s + (v > value ? 1 : -1));
      onChange(v);
    }
  };

  useEffect(() => {
    const up = () => (drag.current = null);
    window.addEventListener("pointerup", up);
    return () => window.removeEventListener("pointerup", up);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, start: value };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const steps = Math.round((e.clientX - drag.current.x) / 26);
    set(drag.current.start + steps);
  };

  const wheel = (n: number) => (n < min ? null : n > max ? null : n);
  const prev = wheel(value - 1);
  const next = wheel(value + 1);

  return (
    <div className="space-y-2 select-none">
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</span>
        <span className="text-[10px] text-muted-foreground">swipe the dial</span>
      </div>

      <div
        role="slider"
        tabIndex={0}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label={label}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") set(value + 1);
          if (e.key === "ArrowLeft") set(value - 1);
        }}
        onWheel={(e) => {
          e.preventDefault();
          set(value + (e.deltaY > 0 || e.deltaX > 0 ? 1 : -1));
        }}
        className="mx-auto flex w-fit cursor-grab touch-none items-stretch overflow-hidden rounded-[6px] active:cursor-grabbing"
        style={{
          border: `2px solid #0d0d0d`,
          background: "linear-gradient(180deg,#3b3b3b 0%,#111 18%,#c9c9c9 48%,#efefef 55%,#9d9d9d 72%,#1a1a1a 100%)",
          boxShadow: "inset 0 2px 6px rgba(0,0,0,.7), 0 2px 8px rgba(0,0,0,.45)",
        }}
      >
        {[prev, value, next].map((n, i) => (
          <div
            key={`${i}-${n ?? "x"}`}
            className="relative flex h-14 w-12 items-center justify-center"
            style={{
              borderLeft: i ? "2px solid #0d0d0d" : undefined,
              background:
                i === 1
                  ? "linear-gradient(180deg,#2a2a2a 0%,#0f0f0f 16%,#d8d8d8 48%,#ffffff 54%,#a8a8a8 74%,#161616 100%)"
                  : undefined,
            }}
          >
            <span
              key={`${spin}-${n}`}
              className="animate-fade-in font-mono text-[26px] font-bold leading-none"
              style={{
                color: "#111",
                opacity: n == null ? 0.15 : i === 1 ? 1 : 0.45,
                textShadow: "0 1px 0 rgba(255,255,255,.55)",
              }}
            >
              {n ?? "—"}
            </span>
          </div>
        ))}
      </div>

      <p className="text-center text-[11px] text-muted-foreground">
        <span className="font-semibold" style={{ color: ASH_GOLD }}>
          {value}
        </span>{" "}
        year{value > 1 ? "s" : ""} · {value * 12} months projected
      </p>
    </div>
  );
}
