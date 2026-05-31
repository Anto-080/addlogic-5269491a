import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { GeoConsentSlide } from "@/components/GeoConsentSlide";
import {
  checkSessionDrift,
  clearApprovedSession,
  setApprovedSession,
} from "@/lib/sessionWatcher";
import { useSettings } from "@/contexts/SettingsContext";
import { verifyFingerprintRuleset, fetchTransportIpInfo, type FpSignals, type IpInfo } from "@/lib/vpnDetection";
import { getVisitorId } from "@/lib/fingerprint";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Loader2, RefreshCw, Fingerprint, Globe } from "lucide-react";

/**
 * Site-wide post-login chokepoint.
 *
 * Order of operations on every authenticated session:
 *   1. Run the FingerprintJS Pro workspace ruleset (rs_kd5z5fhUgyMT49)
 *      — the SOLE block authority. If `rulesetAction === "block"`, show
 *      the ban card with visitorId + IP. The user can disable their VPN
 *      and "Re-check" to force a fresh event.
 *   2. Once allowed, show the GeoConsentSlide (precise GPS vs IP).
 *   3. After entry, run the lightweight drift watcher (30 s + focus) so
 *      mobile IP rotation is silent, but a device-id change reopens the
 *      ruleset check.
 */
export function PostLoginGate({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { setGpsPrecision } = useSettings();

  const [rulesetChecked, setRulesetChecked] = useState(false);
  const [blocked, setBlocked] = useState<{
    reason: string;
    ruleName: string | null;
    visitorId: string | null;
    ip: string | null;
  } | null>(null);
  const [rechecking, setRechecking] = useState(false);

  const [geoSatisfied, setGeoSatisfied] = useState<boolean | null>(null);

  const runRulesetCheck = useCallback(async () => {
    setRechecking(true);
    try {
      const [verdict, ipInfo, visitorId] = await Promise.all([
        verifyFingerprintRuleset(),
        fetchTransportIpInfo(),
        getVisitorId(),
      ]);
      if (!verdict.ok) {
        setBlocked({
          reason: verdict.reason ?? "Blocked by FingerprintJS ruleset",
          ruleName: verdict.ruleName ?? null,
          visitorId,
          ip: ipInfo?.ip ?? verdict.signals?.ipFromFp ?? null,
        });
      } else {
        setBlocked(null);
        if (user) {
          setApprovedSession(user.id, { visitorId, ip: ipInfo?.ip ?? null });
        }
      }
    } finally {
      setRulesetChecked(true);
      setRechecking(false);
    }
  }, [user]);

  // Step 1 — run the ruleset check whenever a user session appears.
  useEffect(() => {
    if (!user) {
      setRulesetChecked(false);
      setBlocked(null);
      setGeoSatisfied(false);
      return;
    }
    setRulesetChecked(false);
    runRulesetCheck();
  }, [user, runRulesetCheck]);

  // Step 2 — geo gate state (only relevant once ruleset has allowed).
  useEffect(() => {
    if (!user || !rulesetChecked || blocked) return;
    const key = `addlogic.gate.satisfied.${user.id}`;
    const stored = sessionStorage.getItem(key);
    setGeoSatisfied(!!stored);
  }, [user, rulesetChecked, blocked]);

  // Step 3 — drift watcher (silent for IP rotation; device change → re-run ruleset).
  useEffect(() => {
    if (!user || !geoSatisfied || blocked) return;
    const tick = async () => {
      const drift = await checkSessionDrift(user.id);
      if (drift === "device-changed" || drift === "both-changed") {
        clearApprovedSession(user.id);
        sessionStorage.removeItem(`addlogic.gate.satisfied.${user.id}`);
        setGeoSatisfied(false);
        setRulesetChecked(false);
        runRulesetCheck();
      }
    };
    const onFocus = () => { tick(); };
    window.addEventListener("focus", onFocus);
    const interval = window.setInterval(tick, 30_000);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.clearInterval(interval);
    };
  }, [user, geoSatisfied, blocked, runRulesetCheck]);

  const onGeoSatisfied = (source: "gps" | "ip") => {
    if (!user) return;
    sessionStorage.setItem(
      `addlogic.gate.satisfied.${user.id}`,
      JSON.stringify({ source, at: Date.now() }),
    );
    setGeoSatisfied(true);
  };

  // ── Render ────────────────────────────────────────────────────────
  if (!user) return <>{children}</>;

  if (!rulesetChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Verifying session…
        </div>
      </div>
    );
  }

  if (blocked) {
    return (
      <div className="fixed inset-0 z-[70] bg-background/95 backdrop-blur flex items-center justify-center p-4 overflow-y-auto">
        <div className="max-w-md w-full bg-card border border-destructive/40 rounded-2xl p-6 space-y-4 shadow-2xl">
          <div className="flex justify-center">
            <div className="h-14 w-14 rounded-full bg-destructive/15 flex items-center justify-center">
              <ShieldAlert className="h-7 w-7 text-destructive" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-lg font-bold text-foreground">VPN / proxy detected</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Region-priced rewards mean traffic coming through a VPN, Tor exit
              node, or datacenter proxy can spoof a high-CPM region and drain
              the redistributed pool. Please disable your VPN/proxy and re-check.
            </p>
          </div>

          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-[11px] text-foreground/90 space-y-2">
            <div className="flex items-start gap-2">
              <ShieldAlert className="h-3.5 w-3.5 mt-0.5 shrink-0 text-destructive" />
              <span><strong>Reason:</strong> {blocked.reason}</span>
            </div>
            <div className="flex items-start gap-2">
              <Fingerprint className="h-3.5 w-3.5 mt-0.5 shrink-0 text-money" />
              <span>
                <strong>Session / visitor ID:</strong>{" "}
                <code className="text-[10px]">{blocked.visitorId ? `${blocked.visitorId.slice(0, 16)}…` : "unavailable"}</code>
              </span>
            </div>
            <div className="flex items-start gap-2">
              <Globe className="h-3.5 w-3.5 mt-0.5 shrink-0 text-money" />
              <span><strong>IP:</strong> {blocked.ip ?? "unavailable"}</span>
            </div>
          </div>

          <Button onClick={runRulesetCheck} disabled={rechecking} className="w-full gap-2">
            {rechecking ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Re-check (after disabling VPN)
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      <GeoConsentSlide
        open={geoSatisfied === false}
        onSatisfied={(coords) => {
          if (coords.source === "gps") setGpsPrecision(true);
          onGeoSatisfied(coords.source === "gps" ? "gps" : "ip");
        }}
      />
    </>
  );
}
