import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Movement-based vertical switch. Thumb slides UP when active.
 * Track color: red when off, green when on.
 * Drag (touch/mouse) or click to toggle.
 */
type Props = {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  className?: string;
  ariaLabel?: string;
  /** label rendered under the switch */
  label?: string;
};

export const VerticalSwitch = React.forwardRef<HTMLButtonElement, Props>(
  ({ checked, onCheckedChange, className, ariaLabel, label }, ref) => {
    const trackRef = React.useRef<HTMLDivElement | null>(null);
    const draggingRef = React.useRef(false);
    const startYRef = React.useRef(0);
    const movedRef = React.useRef(false);

    const handleStart = (clientY: number) => {
      draggingRef.current = true;
      startYRef.current = clientY;
      movedRef.current = false;
    };
    const handleMove = (clientY: number) => {
      if (!draggingRef.current) return;
      const dy = startYRef.current - clientY; // up positive
      if (Math.abs(dy) > 8) movedRef.current = true;
      if (dy > 16 && !checked) onCheckedChange(true);
      else if (dy < -16 && checked) onCheckedChange(false);
    };
    const handleEnd = () => {
      draggingRef.current = false;
    };

    return (
      <div className={cn("inline-flex flex-col items-center gap-1.5 select-none", className)}>
        <button
          ref={ref}
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label={ariaLabel}
          onClick={(e) => {
            if (movedRef.current) { e.preventDefault(); return; }
            onCheckedChange(!checked);
          }}
          onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture?.(e.pointerId); handleStart(e.clientY); }}
          onPointerMove={(e) => handleMove(e.clientY)}
          onPointerUp={handleEnd}
          onPointerCancel={handleEnd}
          className={cn(
            "relative h-16 w-8 rounded-full border-2 transition-colors duration-200 touch-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            checked
              ? "bg-emerald-500/30 border-emerald-500"
              : "bg-red-500/25 border-red-500/80",
          )}
        >
          <span
            ref={trackRef as never}
            className={cn(
              "absolute left-1/2 -translate-x-1/2 h-6 w-6 rounded-full shadow-lg transition-all duration-200",
              checked
                ? "top-1 bg-emerald-400"
                : "top-[calc(100%-1.75rem)] bg-red-400",
            )}
          />
        </button>
        {label && (
          <span className={cn("text-[10px] font-medium", checked ? "text-emerald-400" : "text-red-400")}>
            {label}
          </span>
        )}
      </div>
    );
  },
);
VerticalSwitch.displayName = "VerticalSwitch";
