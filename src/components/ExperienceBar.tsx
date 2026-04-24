import { useEffect, useRef, useState } from "react";
import { Zap } from "lucide-react";
import {
  XP_PER_LEVEL,
  getXpSnapshot,
  addXpForSeconds,
  setMultiplier,
  consentBonus,
  useSettings,
} from "@/contexts/SettingsContext";

/**
 * Self-contained Experience + Crimson Multiplier display.
 *
 * - Reads/writes XP to the module-level store (NOT React context), so
 *   toggles elsewhere never re-render when XP ticks.
 * - When mounted, ticks XP locally once per second so progress is visible
 *   live on whatever page the user happens to be on (Dashboard or
 *   Research). When unmounted, no work happens.
 * - The crimson bar's black marker shows the x10 cap; if the multiplier
 *   surpasses 10×, the marker slides left and crimson fill extends past it.
 */
export function ExperienceBar({
  baseMultiplier,
  earning = false,
  compact = false,
}: {
  /** Tier multiplier from the current page (Research selects one; Dashboard uses primary tier). */
  baseMultiplier?: number;
  /** Whether to actively tick XP. Dashboard passes false; Research passes true. */
  earning?: boolean;
  compact?: boolean;
}) {
  const { cookieAutoAccept, gpsPrecision } = useSettings();
  const snap = getXpSnapshot();
  const initialBase = baseMultiplier ?? snap.multiplier;
  const activeMultiplier = initialBase + consentBonus(cookieAutoAccept, gpsPrecision);

  // Sync new multiplier into the persisted store whenever inputs change.
  useEffect(() => {
    setMultiplier(activeMultiplier);
  }, [activeMultiplier]);

  // Local display state — refreshed by interval; never affects other components.
  const [, force] = useState(0);
  const lastTickRef = useRef(Date.now());

  useEffect(() => {
    const id = window.setInterval(() => {
      const now = Date.now();
      const dt = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;
      if (earning && !document.hidden && dt < 60) {
        addXpForSeconds(dt);
      }
      force((n) => n + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [earning]);

  const live = getXpSnapshot();
  const xpPercent = Math.min(100, (live.xp / XP_PER_LEVEL) * 100);

  const cap = 10;
  const overshootRatio = Math.max(0, activeMultiplier - cap) / cap;
  const markerPercent = Math.max(50, 100 - overshootRatio * 50);
  const fillPercent = Math.min(
    100,
    activeMultiplier <= cap
      ? (activeMultiplier / cap) * markerPercent
      : markerPercent + (activeMultiplier - cap) / cap * (100 - markerPercent)
  );

  const barH = compact ? "h-3" : "h-4";

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <div className="flex justify-between text-[11px]">
          <span className="text-muted-foreground inline-flex items-center gap-1">
            <Zap className="h-3 w-3 text-money" /> Experience Level {live.level}
          </span>
          <span className="text-foreground/80 font-medium">
            {Math.floor(live.xp).toLocaleString()} / {XP_PER_LEVEL.toLocaleString()} XP
          </span>
        </div>
        <div className={`relative w-full overflow-hidden rounded-full bg-secondary/60 ${barH}`}>
          <div
            className="xp-fluid h-full transition-[width] duration-700 ease-out"
            style={{ width: `${xpPercent}%` }}
          />
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-[11px]">
          <span className="text-muted-foreground">Crimson Multiplier</span>
          <span className="font-semibold" style={{ color: "hsl(348 83% 60%)" }}>
            x{activeMultiplier.toFixed(2)}
            {activeMultiplier > cap && (
              <span className="ml-1 text-[10px] text-foreground/60 font-normal">
                (cap x{cap} surpassed)
              </span>
            )}
          </span>
        </div>
        <div className={`relative w-full overflow-hidden rounded-full bg-secondary/60 ${barH}`}>
          <div
            className="multiplier-fluid h-full transition-[width] duration-700 ease-out"
            style={{ width: `${fillPercent}%` }}
          />
          <div
            className="absolute top-0 bottom-0 w-[3px] bg-black/90 pointer-events-none"
            style={{ left: `calc(${markerPercent}% - 1.5px)` }}
            aria-label={`x${cap} multiplier cap marker`}
            title={`x${cap} multiplier cap${overshootRatio > 0 ? ` — surpassed by ${(activeMultiplier - cap).toFixed(1)}×` : ""}`}
          />
        </div>
      </div>
    </div>
  );
}
