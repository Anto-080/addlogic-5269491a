import { ReactNode, useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { GeoConsentSlide } from "@/components/GeoConsentSlide";
import {
  checkSessionDrift,
  clearApprovedSession,
  getApprovedSession,
} from "@/lib/sessionWatcher";
import { useSettings } from "@/contexts/SettingsContext";

/**
 * Single post-login chokepoint. The entrance card (GeoConsentSlide) is the
 * ONLY place a VPN/Fingerprint check can run:
 *   - Precise GPS    → no Fingerprint call, no IP verdict, instant unlock.
 *   - Approximate IP → Fingerprint Smart Signals decide; on block the user
 *                      stays on the card with a "Re-check" button.
 *
 * After entry, a lightweight watcher runs ONLY for approximate-branch
 * users: IP-only rotation is silently allowed (mobile carriers); a
 * device-id change forces a fresh Fingerprint event + re-evaluation by
 * reopening the entrance card.
 */
export function PostLoginGate({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { setGpsPrecision } = useSettings();
  const [satisfied, setSatisfied] = useState<boolean | null>(null);
  const enteredViaIpRef = useRef(false);

  useEffect(() => {
    if (!user) {
      setSatisfied(false);
      return;
    }
    const key = `addlogic.gate.satisfied.${user.id}`;
    const stored = sessionStorage.getItem(key);
    if (!stored) {
      setSatisfied(false);
      return;
    }
    try {
      const parsed = JSON.parse(stored) as { source?: "gps" | "ip" };
      enteredViaIpRef.current = parsed.source === "ip";
      setSatisfied(true);
    } catch {
      sessionStorage.removeItem(key);
      setSatisfied(false);
    }
  }, [user]);

  // Drift watcher — armed only for approximate-branch users. GPS users
  // never get a Fingerprint call, ever.
  useEffect(() => {
    if (!user || !satisfied || !enteredViaIpRef.current) return;
    const tick = async () => {
      const drift = await checkSessionDrift(user.id);
      if (drift === "device-changed" || drift === "both-changed") {
        // Force the user back through the entrance card; they'll re-pick
        // Approximate and Fingerprint will re-evaluate.
        clearApprovedSession(user.id);
        sessionStorage.removeItem(`addlogic.gate.satisfied.${user.id}`);
        setSatisfied(false);
      }
      // "same" / "ip-changed" / "no-session" → no action.
    };
    const onFocus = () => { tick(); };
    window.addEventListener("focus", onFocus);
    const interval = window.setInterval(tick, 30_000);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.clearInterval(interval);
    };
  }, [user, satisfied]);

  const onSatisfied = (source: "gps" | "ip") => {
    if (!user) return;
    enteredViaIpRef.current = source === "ip";
    sessionStorage.setItem(
      `addlogic.gate.satisfied.${user.id}`,
      JSON.stringify({ source, at: Date.now() }),
    );
    setSatisfied(true);
  };

  if (satisfied === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm">Verifying session…</p>
      </div>
    );
  }

  return (
    <>
      {children}
      <GeoConsentSlide
        open={!satisfied}
        onSatisfied={(coords) => {
          if (coords.source === "gps") setGpsPrecision(true);
          onSatisfied(coords.source === "gps" ? "gps" : "ip");
        }}
      />
    </>
  );
}
