import { ReactNode, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { GeoConsentSlide } from "@/components/GeoConsentSlide";
import { fetchIpInfo } from "@/lib/vpnDetection";
import { useSettings } from "@/contexts/SettingsContext";

/**
 * Single post-login chokepoint: forces every authenticated user through the
 * GeoConsentSlide entrance card before they reach any protected page. Choice
 * is remembered for the browser session so it doesn't re-prompt on every
 * navigation, but a refresh re-checks that the IP hasn't changed (catches a
 * VPN being toggled mid-session).
 */
export function PostLoginGate({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { setGpsPrecision } = useSettings();
  const [satisfied, setSatisfied] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) {
      setSatisfied(false);
      return;
    }
    let cancelled = false;
    const key = `addlogic.gate.satisfied.${user.id}`;
    const stored = sessionStorage.getItem(key);
    if (!stored) {
      setSatisfied(false);
      return;
    }
    // Re-validate that the approximate IP hasn't changed since the user
    // satisfied the gate. If it has, force them through the card again.
    fetchIpInfo().then((info) => {
      if (cancelled) return;
      try {
        const parsed = JSON.parse(stored) as { ip?: string };
        if (info?.ip && parsed.ip && info.ip === parsed.ip) {
          setSatisfied(true);
        } else {
          sessionStorage.removeItem(key);
          setSatisfied(false);
        }
      } catch {
        sessionStorage.removeItem(key);
        setSatisfied(false);
      }
    });
    return () => { cancelled = true; };
  }, [user]);

  const onSatisfied = async () => {
    if (!user) return;
    const info = await fetchIpInfo();
    sessionStorage.setItem(
      `addlogic.gate.satisfied.${user.id}`,
      JSON.stringify({ ip: info?.ip ?? null, at: Date.now() })
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
          // Precise GPS branch implicitly turns on the GPS-precision setting.
          if (coords.source === "gps") setGpsPrecision(true);
          onSatisfied();
        }}
      />
    </>
  );
}
