import { useSettings, XP_PER_LEVEL } from "@/contexts/SettingsContext";
import { Zap } from "lucide-react";

/**
 * Shared Experience Bar — identical numbers on every page.
 * Crimson XP bar with a black "x10 limit" marker. When the active multiplier
 * exceeds 10×, the marker slides left so the crimson fill can extend past it,
 * visualising that the cap is being surpassed.
 */
export function ExperienceBar({ compact = false }: { compact?: boolean }) {
  const { liveXp, level, activeMultiplier } = useSettings();
  const xpPercent = Math.min(100, (liveXp / XP_PER_LEVEL) * 100);

  // Marker position: at 100% when multiplier ≤ 10, slides left as it grows.
  // Mirrors how Lovable's token bar shifts the limit indicator.
  const cap = 10;
  const overshoot = Math.max(0, activeMultiplier - cap);
  // Squeeze marker by up to ~50% as multiplier doubles past the cap.
  const markerPercent = Math.max(50, 100 - (overshoot / cap) * 50);

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[11px]">
        <span className="text-muted-foreground inline-flex items-center gap-1">
          <Zap className="h-3 w-3 text-money" /> Experience Level {level}
        </span>
        <span className="text-foreground/80 font-medium">
          {Math.floor(liveXp).toLocaleString()} / {XP_PER_LEVEL.toLocaleString()} XP
          <span className="ml-2 font-semibold" style={{ color: "hsl(348 83% 60%)" }}>
            x{activeMultiplier.toFixed(2)}
          </span>
        </span>
      </div>
      <div className={`relative w-full overflow-hidden rounded-full bg-secondary/60 ${compact ? "h-3" : "h-4"}`}>
        <div className="xp-fluid h-full transition-[width] duration-700 ease-out" style={{ width: `${xpPercent}%` }} />
        {/* Black x10 limit marker */}
        <div
          className="absolute top-0 bottom-0 w-[3px] bg-black/90 pointer-events-none"
          style={{ left: `calc(${markerPercent}% - 1.5px)` }}
          aria-label={`x${cap} multiplier limit marker`}
          title={`x${cap} multiplier limit${overshoot > 0 ? ` — surpassed by ${overshoot.toFixed(1)}×` : ""}`}
        />
      </div>
    </div>
  );
}
