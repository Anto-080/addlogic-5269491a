import { useEffect, useRef, useState } from "react";
import { Zap } from "lucide-react";
import { useUserStats, useUpdateUserStats } from "@/hooks/useAppData";

const XP_PER_LEVEL = 500_000;

/**
 * Experience + Crimson Multiplier — backed by the live `user_stats` row.
 *
 * - Dashboard mounts it with `earning={false}` → renders ONCE per stats
 *   refetch. No interval, no per-second re-render. Toggles stay snappy.
 * - Research mounts it with `earning={true}` → 1s in-memory accumulator,
 *   flushed to Supabase every 15s and on unmount.
 */
export function ExperienceBar({
  baseMultiplier,
  earning = false,
  compact = false,
}: {
  baseMultiplier?: number;
  earning?: boolean;
  compact?: boolean;
}) {
  const { cookieAutoAccept, gpsPrecision } = useSettings();
  const { data: stats } = useUserStats();
  const updateStats = useUpdateUserStats();

  const baseLevel = stats?.level ?? 1;
  const baseXp = stats?.xp ?? 0;
  const dbMultiplier = stats?.current_multiplier ?? 1;

  const activeMultiplier =
    (baseMultiplier ?? dbMultiplier) + consentBonus(cookieAutoAccept, gpsPrecision);

  // Local accumulator only used when earning=true. No render impact for
  // dashboard since the effect short-circuits.
  const accumulatedRef = useRef(0);
  const lastTickRef = useRef(Date.now());
  const [, force] = useState(0);

  useEffect(() => {
    if (!earning) return;
    lastTickRef.current = Date.now();
    const tick = window.setInterval(() => {
      const now = Date.now();
      const dt = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;
      if (!document.hidden && dt < 60) {
        accumulatedRef.current += dt * activeMultiplier;
        force((n) => n + 1);
      }
    }, 1000);

    const flush = window.setInterval(() => {
      const gained = Math.floor(accumulatedRef.current);
      if (gained <= 0) return;
      accumulatedRef.current -= gained;
      let xp = baseXp + gained;
      let level = baseLevel;
      while (xp >= XP_PER_LEVEL) {
        xp -= XP_PER_LEVEL;
        level += 1;
      }
      updateStats.mutate({ xp, level, current_multiplier: activeMultiplier });
    }, 15000);

    return () => {
      window.clearInterval(tick);
      window.clearInterval(flush);
      const gained = Math.floor(accumulatedRef.current);
      if (gained > 0) {
        accumulatedRef.current = 0;
        let xp = baseXp + gained;
        let level = baseLevel;
        while (xp >= XP_PER_LEVEL) {
          xp -= XP_PER_LEVEL;
          level += 1;
        }
        updateStats.mutate({ xp, level, current_multiplier: activeMultiplier });
      }
    };
    // Only re-init when earning toggles or the active multiplier changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [earning, activeMultiplier]);

  // When dashboard mounts (earning=false) we still want the multiplier
  // persisted once per change so other pages see the same value.
  useEffect(() => {
    if (earning) return;
    if (!stats) return;
    if (Math.abs((stats.current_multiplier ?? 0) - activeMultiplier) < 0.01) return;
    updateStats.mutate({ current_multiplier: activeMultiplier });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [earning, activeMultiplier, stats?.current_multiplier]);

  const liveXp = baseXp + (earning ? accumulatedRef.current : 0);
  const xpPercent = Math.min(100, (liveXp / XP_PER_LEVEL) * 100);

  const cap = 10;
  const overshootRatio = Math.max(0, activeMultiplier - cap) / cap;
  const markerPercent = Math.max(50, 100 - overshootRatio * 50);
  const fillPercent = Math.min(
    100,
    activeMultiplier <= cap
      ? (activeMultiplier / cap) * markerPercent
      : markerPercent + ((activeMultiplier - cap) / cap) * (100 - markerPercent)
  );

  const barH = compact ? "h-3" : "h-4";

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <div className="flex justify-between text-[11px]">
          <span className="text-muted-foreground inline-flex items-center gap-1">
            <Zap className="h-3 w-3 text-money" /> Experience Level {baseLevel}
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
