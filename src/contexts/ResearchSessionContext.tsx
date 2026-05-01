/**
 * ResearchSessionContext — single source of truth for "is the user actively
 * researching for tier X right now?". Other components write their own
 * activity hints (search bar typed, outbound visit opened, etc.); the
 * `<TierExperienceBar>` reads the active tier and accumulates XP only when
 * a real activity is in progress AND the tab is visible.
 *
 * This decouples XP from the visual state of "tier card open" — opening a
 * card no longer fakes research time.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from "react";

type Source = "outbound" | "search" | "video";

type ActiveSession = {
  tierId: number;
  source: Source;
  startedAt: number;
  expiresAt: number; // auto-clear if no heartbeat refresh
};

type Ctx = {
  active: ActiveSession | null;
  /** Mark this tier as actively being researched. Auto-extends a sliding window. */
  pulse: (tierId: number, source: Source, ttlMs?: number) => void;
  /** Stop tracking immediately (e.g. user returned from outbound). */
  stop: () => void;
};

const ResearchSessionCtx = createContext<Ctx | undefined>(undefined);

export function ResearchSessionProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<ActiveSession | null>(null);
  const tickRef = useRef<number | null>(null);

  const pulse = useCallback((tierId: number, source: Source, ttlMs = 90_000) => {
    const now = Date.now();
    setActive((prev) => {
      if (prev && prev.tierId === tierId && prev.source === source) {
        return { ...prev, expiresAt: now + ttlMs };
      }
      return { tierId, source, startedAt: now, expiresAt: now + ttlMs };
    });
  }, []);

  const stop = useCallback(() => setActive(null), []);

  // Expire stale sessions every 5s.
  useEffect(() => {
    tickRef.current = window.setInterval(() => {
      setActive((prev) => (prev && prev.expiresAt < Date.now() ? null : prev));
    }, 5_000);
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, []);

  const value = useMemo(() => ({ active, pulse, stop }), [active, pulse, stop]);
  return <ResearchSessionCtx.Provider value={value}>{children}</ResearchSessionCtx.Provider>;
}

export function useResearchSession() {
  const ctx = useContext(ResearchSessionCtx);
  if (!ctx) throw new Error("useResearchSession must be inside ResearchSessionProvider");
  return ctx;
}
