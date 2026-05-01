import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTierProgress, useUpdateTierProgress } from "@/hooks/useTierProgress";
import { bumpInterestSignal, tierLevelFromSeconds, TIER_XP_PER_LEVEL } from "@/lib/zeroPartyCookies";
import { useSettings, consentBonus } from "@/contexts/SettingsContext";
import { useResearchSession } from "@/contexts/ResearchSessionContext";

type Props = {
  tierId: number;
  tierMultiplier: number;
  /**
   * Reserved — historically toggled by "card open". Kept for API stability,
   * but the bar now only ticks when the global ResearchSession matches this tier.
   */
  active?: boolean;
};

const HEARTBEAT_MS = 15_000;

/**
 * Per-tier lifetime experience bar. XP only accumulates while the global
 * ResearchSession active.tierId === this tier (i.e. the user is *actually*
 * researching it: typing in the search bar, OR has an open outbound visit).
 *
 * - 1 validated second of research = 1 XP (no per-tier multiplier on XP).
 * - Every TIER_XP_PER_LEVEL XP = +1 cosmetic level (no upper cap).
 * - Every SECONDS_PER_BUMP cumulative seconds = permanent multiplier +1.
 * - Pingback every HEARTBEAT_MS — if the tab was hidden in between, those
 *   seconds are discarded.
 */
export function TierExperienceBar({ tierId, tierMultiplier }: Props) {
  const { user } = useAuth();
  const { cookieAutoAccept, gpsPrecision } = useSettings();
  const { active: session } = useResearchSession();
  const { data: row } = useTierProgress(tierId);
  const update = useUpdateTierProgress();

  const baseSeconds = row?.seconds_active ?? 0;
  const baseBonus = row?.multiplier_bonus ?? 0;

  const accRef = useRef(0);
  const lastTickRef = useRef(Date.now());
  const [, force] = useState(0);

  const isActiveForThisTier = session?.tierId === tierId;

  useEffect(() => {
    if (!isActiveForThisTier) return;
    lastTickRef.current = Date.now();

    const tick = window.setInterval(() => {
      const now = Date.now();
      const dt = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;
      // Discard the interval if the tab was hidden or the gap is unreasonable
      // (machine sleep, throttled background tab, etc.).
      if (!document.hidden && dt < HEARTBEAT_MS / 1000 + 5) {
        accRef.current += dt;
        force((n) => n + 1);
      }
    }, 1_000);

    const flush = window.setInterval(() => {
      const gained = Math.floor(accRef.current);
      if (gained <= 0) return;
      accRef.current -= gained;
      const totalSeconds = baseSeconds + gained;
      const { multiplierBonus } = bumpInterestSignal(tierId, gained);
      if (user) {
        update.mutate({
          tier_id: tierId,
          seconds_active: totalSeconds,
          multiplier_bonus: Math.max(baseBonus, multiplierBonus),
        });
      }
    }, HEARTBEAT_MS);

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
  }, [isActiveForThisTier, tierId, baseSeconds, baseBonus, user]);

  const liveSeconds = baseSeconds + (isActiveForThisTier ? accRef.current : 0);
  const { level, xpInLevel, percent } = tierLevelFromSeconds(liveSeconds);
  // 1h of validated research = +1 permanent multiplier (lifetime).
  const liveBonus = Math.max(baseBonus, Math.floor(liveSeconds / 3600));
  const activeMultiplier = tierMultiplier + liveBonus + consentBonus(cookieAutoAccept, gpsPrecision);

  // Color spectrum: tier 1 (top) = deep emerald, tier 17 (bottom) = pale pea green.
  const ramp = Math.max(0, Math.min(1, (tierId - 1) / 16));
  const hue = 150;
  const lightness = 22 + ramp * 45;
  const saturation = 70 - ramp * 25;
  const fillColor = `hsl(${hue} ${saturation}% ${lightness}%)`;

  return (
    <div className="space-y-2 mb-3">
      <div className="space-y-1">
        <div className="flex justify-between text-[11px]">
          <span className="text-muted-foreground">
            Field Experience · <span className="text-foreground/90 font-medium">Lv </span>
            <span className="font-bold" style={{ color: "hsl(45 90% 55%)" }}>{level}</span>
            {isActiveForThisTier && (
              <span className="ml-1.5 inline-flex items-center gap-1 text-[10px]" style={{ color: "hsl(140 60% 55%)" }}>
                <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" /> live
              </span>
            )}
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

      {!isActiveForThisTier && (
        <p className="text-[10px] text-muted-foreground italic">
          XP grows only while you actively research this tier — search for it in DuckDuckGo or open an outbound link from this tier.
        </p>
      )}
    </div>
  );
}
