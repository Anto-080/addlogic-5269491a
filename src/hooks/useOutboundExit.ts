import { useCallback, useEffect, useRef, useState } from "react";
import { useRecordOutboundOpen, useRecordOutboundReturn } from "@/hooks/useResearchChronology";
import { pickNativeAd } from "@/lib/nativeAds";
import type { NativeAd } from "@/components/NativeAdSlot";
import { useResearchSession } from "@/contexts/ResearchSessionContext";

type ExitState = {
  open: boolean;
  url: string;
  host: string;
  tierId: number;
  ad: NativeAd | null;
};

/**
 * Controller for the exit interstitial flow. Centralizes:
 *   1. Showing the interstitial.
 *   2. Recording an `outbound_visits` row when the user confirms.
 *   3. Opening the URL in a new browser tab (window.open).
 *   4. Pinging back when the tab regains focus → updates `dwell_seconds`.
 */
export function useOutboundExit(fallbackTierIds: number[] = []) {
  const [state, setState] = useState<ExitState>({ open: false, url: "", host: "", tierId: 0, ad: null });
  const recordOpen = useRecordOutboundOpen();
  const recordReturn = useRecordOutboundReturn();
  const session = useResearchSession();
  const pendingRef = useRef<{ id: string; openedAt: number; tierId: number } | null>(null);

  const requestExit = useCallback((url: string, tierId: number) => {
    let host = url;
    try { host = new URL(url).host; } catch { /* ignore */ }
    const ad = pickNativeAd(tierId, fallbackTierIds);
    setState({ open: true, url, host, tierId, ad });
  }, [fallbackTierIds]);

  const cancel = useCallback(() => {
    setState((s) => ({ ...s, open: false }));
  }, []);

  const confirm = useCallback(async () => {
    const { url, tierId } = state;
    setState((s) => ({ ...s, open: false }));
    try {
      const id = await recordOpen.mutateAsync({ url, tierId, sponsorId: state.ad?.sponsorId ?? null });
      if (id) pendingRef.current = { id, openedAt: Date.now(), tierId };
    } catch {
      /* ignore — we still open the URL */
    }
    // Mark this tier as actively researched while the outbound tab is open.
    // TTL refreshed on every visibility ping below.
    session.pulse(tierId, "outbound", 5 * 60_000);
    try { window.open(url, "_blank", "noopener,noreferrer"); } catch { /* noop */ }
  }, [state, recordOpen, session]);

  // Ping back when the user returns to the tab — closes the dwell interval.
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) {
        // Tab hidden = user is on the outbound site → keep refreshing the pulse.
        const p = pendingRef.current;
        if (p) session.pulse(p.tierId, "outbound", 5 * 60_000);
        return;
      }
      const p = pendingRef.current;
      if (!p) return;
      pendingRef.current = null;
      recordReturn.mutate({ id: p.id, openedAt: p.openedAt });
      session.stop();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onVis);
    };
  }, [recordReturn, session]);

  return { state, requestExit, cancel, confirm };
}
