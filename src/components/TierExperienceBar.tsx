import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTierProgress, useUpdateTierProgress } from "@/hooks/useTierProgress";
import { bumpInterestSignal, tierLevelFromSeconds, TIER_XP_PER_LEVEL } from "@/lib/zeroPartyCookies";
import { useSettings, consentBonus } from "@/contexts/SettingsContext";

type Props = {
  tierId: number;
  tierMultiplier: number;
  /** When true, accumulate 1 sec per real second. */
  active: boolean;
  /** Optional color for the level number (defaults to gold). */
};

/**
 * Per-tier lifetime experience bar.
 * - 1 second of active research = 1 XP.
 * - Every 10 000 XP = +1 cosmetic level (no upper cap).
 * - Every 8 hours (28 800s) of cumulative seconds = permanent multiplier +1
 *   (also no cap — lifetime field experience).
 * - The XP fluid is colored by tier rank: pale-pea-green at the bottom
 *   (Adult Content) → deep emerald at top (Biological Systems).
 * - Level number is rendered in gold to the right of the bar label.
 */
export function TierExperienceBar({ tierId, tierMultiplier, active }: Props) {
  const { user } = useAuth();
  const { cookieAutoAccept, gpsPrecision } = useSettings();
  const { data: row } = useTierProgress(tierId);
  const update = useUpdateTierProgress();

  const baseSeconds = row?.seconds_active ?? 0;
  const baseBonus = row?.multiplier_bonus ?? 0;

  const accRef = useRef(0);
  const lastTickRef = useRef(Date.now());
  const [, force] = useState(0);

  useEffect(() => {
    if (!active) return;
    lastTickRef.current = Date.now();
    const tick = window.setInterval(() => {
      const now = Date.now();
      const dt = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;
      if (!document.hidden && dt < 60) {
        accRef.current += dt;
        force((n) => n + 1);
      }
    }, 1000);

    const flush = window.setInterval(() => {
      const gained = Math.floor(accRef.current);
      if (gained <= 0) return;
      accRef.current -= gained;
      const totalSeconds = baseSeconds + gained;
      const { multiplierBonus } = bumpInterestSignal(tierId, gained);
      // Persist to Supabase (RLS-protected own row).
      if (user) {
        update.mutate({
          tier_id: tierId,
          seconds_active: totalSeconds,
          multiplier_bonus: Math.max(baseBonus, multiplierBonus),
        });
      }
    }, 15000);

    return () => {
      window.clearInterval(tick);
      window.clearInterval(flush);
      const gained = Math.floor(accRef.current);
      if (gained > 0) {
        accRef.current = 0;
        const totalSeconds = baseSeconds + gained;
        const { multiplierBonus } = bumpInterestSignal(tierId, gained);
        if (user) {
          update.mutate({
            tier_id: tierId,
            seconds_active: totalSeconds,
            multiplier_bonus: Math.max(baseBonus, multiplierBonus),
          });
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, tierId, baseSeconds, baseBonus, user]);

  const liveSeconds = baseSeconds + (active ? accRef.current : 0);
  const { level, xpInLevel, percent } = tierLevelFromSeconds(liveSeconds);
  const liveBonus = Math.max(baseBonus, Math.floor(liveSeconds / (8 * 3600)));
  const activeMultiplier = tierMultiplier + liveBonus + consentBonus(cookieAutoAccept, gpsPrecision);

  // Color spectrum: tier 1 (top) = deep emerald, tier 17 (bottom) = pale pea green.
  const ramp = Math.max(0, Math.min(1, (tierId - 1) / 16));
  const hue = 150;
  const lightness = 22 + ramp * 45; // 22% (deep) → 67% (pale)
  const saturation = 70 - ramp * 25; // 70% → 45%
  const fillColor = `hsl(${hue} ${saturation}% ${lightness}%)`;

  return (
    <div className="space-y-2 mb-3">
      <div className="space-y-1">
        <div className="flex justify-between text-[11px]">
          <span className="text-muted-foreground">
            Field Experience · <span className="text-foreground/90 font-medium">Lv </span>
            <span className="font-bold" style={{ color: "hsl(45 90% 55%)" }}>{level}</span>
          </span>
          <span className="text-foreground/80 font-medium">
            {xpInLevel.toLocaleString()} / {TIER_XP_PER_LEVEL.toLocaleString()} XP
          </span>
        </div>
        <div className="relative w-full h-3 overflow-hidden rounded-full bg-secondary/60">
          <div
            className="h-full transition-[width] duration-700 ease-out"
            style={{ width: `${percent}%`, backgroundColor: fillColor }}
          />
        </div>
      </div>

      <div className="flex justify-between text-[11px]">
        <span className="text-muted-foreground">
          Lifetime multiplier · base x{tierMultiplier} + bonus x{liveBonus}
        </span>
        <span className="font-semibold" style={{ color: "hsl(348 83% 60%)" }}>
          x{activeMultiplier.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
