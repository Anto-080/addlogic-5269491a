import { useSettings, XP_PER_LEVEL } from "@/contexts/SettingsContext";
import { Zap } from "lucide-react";

/**
 * Shared Experience + Multiplier display — identical numbers on every page
 * because all values are read from SettingsContext.
 *
 *   ┌─────────────────────────────── Experience Bar (amber, clean) ──┐
 *   │■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■░░░░░░░░░░░░░░░░░░░░░░│
 *   └─────────────────────────────────────────────────────────────────┘
 *   ┌─────── Crimson Multiplier Bar (with black x10 cap marker) ─────┐
 *   │██████████████████████████████████████████│←black marker        │
 *   └─────────────────────────────────────────────────────────────────┘
 *
 * The black marker lives on the *Crimson Multiplier bar*. While the
 * multiplier is ≤ 10, the marker sits at the right edge (the cap). Once
 * boosters push the multiplier above 10× (e.g. x12, x14, x15), the marker
 * slides left so the crimson fill visibly extends past it — exactly like
 * Lovable's token bar shows usage above the limit.
 */
export function ExperienceBar({ compact = false }: { compact?: boolean }) {
  const { liveXp, level, activeMultiplier } = useSettings();
  const xpPercent = Math.min(100, (liveXp / XP_PER_LEVEL) * 100);

  // Crimson bar scaling: 0..cap fills 0..100% of the marker zone. Above the
  // cap, the bar visually extends further but never overflows the container.
  const cap = 10;
  const overshootRatio = Math.max(0, activeMultiplier - cap) / cap; // 0 when ≤cap
  // Marker slides left as overshoot grows (down to 50% at 2× the cap).
  const markerPercent = Math.max(50, 100 - overshootRatio * 50);
  // Crimson fill: at cap → reaches markerPercent. Above cap → extends past it.
  const fillPercent = Math.min(
    100,
    activeMultiplier <= cap
      ? (activeMultiplier / cap) * markerPercent
      : markerPercent + (activeMultiplier - cap) / cap * (100 - markerPercent)
  );

  const barH = compact ? "h-3" : "h-4";

  return (
    <div className="space-y-2">
      {/* === Experience Bar (amber) === */}
      <div className="space-y-1">
        <div className="flex justify-between text-[11px]">
          <span className="text-muted-foreground inline-flex items-center gap-1">
            <Zap className="h-3 w-3 text-money" /> Experience Level {level}
          </span>
          <span className="text-foreground/80 font-medium">
            {Math.floor(liveXp).toLocaleString()} / {XP_PER_LEVEL.toLocaleString()} XP
          </span>
        </div>
        <div className={`relative w-full overflow-hidden rounded-full bg-secondary/60 ${barH}`}>
          <div
            className="xp-fluid h-full transition-[width] duration-700 ease-out"
            style={{ width: `${xpPercent}%` }}
          />
        </div>
      </div>

      {/* === Crimson Multiplier Bar (with x10 black marker) === */}
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
          {/* Black x10 cap marker — sits on the crimson bar, slides left when surpassed */}
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
