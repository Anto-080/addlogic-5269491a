import { ReactNode, useCallback, useEffect, useState } from "react";
import { ShieldAlert, Loader2, RefreshCw, LogOut, ShieldQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearIpVerdictCache, fetchIpVerdict, type IpVerdict } from "@/lib/vpnDetection";
import { getVisitorId } from "@/lib/fingerprint";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

/**
 * App-wide hard gate: any user routed through a VPN, proxy, or datacenter
 * IP is blocked from the entire site (regardless of GPS / cookie toggles,
 * regardless of auth state). This is the primary defense against bot farms
 * draining the regional reward pool. There is no "continue anyway" — the
 * user must disconnect their VPN.
 *
 * Verification source: Abstract API only (see src/lib/vpnDetection.ts).
 * If Abstract is unreachable / rate-limited we show an "unverified" screen
 * with a Retry button — we do NOT silently let traffic through, and we do
 * NOT downgrade to a weaker provider for the block decision.
 */

export function VpnGuard({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const [verdict, setVerdict] = useState<IpVerdict | null>(null);
  const [checking, setChecking] = useState(true);
  const [fp, setFp] = useState<string | null>(null);
  const [continueReady, setContinueReady] = useState(false);
  const [gateActive, setGateActive] = useState(false);

  const runCheck = useCallback(async (force = false) => {
    setChecking(true);
    if (force) clearIpVerdictCache();
    const [next, visitorId] = await Promise.all([fetchIpVerdict(force), getVisitorId()]);
    setFp(visitorId);
    setVerdict(next);
    setContinueReady(next.status === "ok");
    if (next.status !== "ok") {
      setGateActive(true);
    }
    if (next.status === "blocked" && user) {
      try {
        await supabase
          .from("device_telemetry")
          .upsert(
            {
              user_id: user.id,
              vpn_suspected: true,
              asn: next.info?.asn ?? null,
              fingerprint: visitorId,
              ip_country: next.info?.country_code ?? null,
              profile: {},
            },
            { onConflict: "user_id" }
          );
      } catch { /* ignore */ }
    }
    setChecking(false);
  }, [user]);

  useEffect(() => {
    runCheck();
    // Re-check every 60s and whenever the tab regains focus, so a user who
    // turns on a VPN mid-session is caught without needing a reload.
    const onFocus = () => runCheck();
    window.addEventListener("focus", onFocus);
    const interval = window.setInterval(runCheck, 60_000);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.clearInterval(interval);
    };
  }, [runCheck]);

  // While we're doing the very first check, render a small full-screen
  // splash so we don't flash the app to a VPN user.
  if (!verdict && checking) {
    return (
      <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center p-4">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Verifying connection…
        </div>
      </div>
    );
  }

  if (verdict?.status === "ok" && !gateActive) return <>{children}</>;

  const blocked = verdict?.status === "blocked";
  const unverified = verdict?.status === "unverified";
  const clear = verdict?.status === "ok";
  const info = verdict?.info ?? null;

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur flex items-center justify-center p-4 overflow-y-auto">
      <div className={`max-w-md w-full bg-card border ${blocked ? "border-destructive/50" : "border-border/60"} rounded-2xl p-6 space-y-4 shadow-2xl`}>
        <div className="flex justify-center">
          <div className={`h-14 w-14 rounded-full flex items-center justify-center ${blocked ? "bg-destructive/15" : "bg-secondary/60"}`}>
            {blocked ? (
              <ShieldAlert className="h-7 w-7 text-destructive" />
            ) : (
              <ShieldQuestion className="h-7 w-7 text-muted-foreground" />
            )}
          </div>
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-lg font-bold text-foreground">
            {blocked ? "VPN or proxy detected" : clear ? "Connection verified" : "Connection not verified"}
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {blocked ? (
              <>
                Your connection is routed through a <strong>VPN, proxy, or datacenter</strong> network.
                To protect the regional reward pool from bot farms, AddLogic is unavailable on these
                connections. <strong>Please disable your VPN or proxy</strong>, then re-check.
              </>
            ) : (
              <>
                We couldn't verify your network is residential. AddLogic is only available once your
                connection has been verified as not being a VPN/proxy. Please retry.
              </>
            ) : (
              <>
                Your connection has been verified. Continue to re-enter the site.
              </>
            )}
          </p>
        </div>

        {(blocked || unverified || clear) && (
          <div className="rounded-lg border border-border/60 bg-secondary/30 p-3 text-[11px] text-foreground/90 space-y-1">
            <div>
              <strong>Network</strong>: {info?.org ?? info?.asn ?? "unknown"}
            </div>
            {info?.country_name && (
              <div>
                <strong>Country</strong>: {info.country_name}
              </div>
            )}
            {blocked && verdict?.info?.reason && (
              <div className="text-destructive">
                <strong>Reason</strong>: {verdict.info.reason}
              </div>
            )}
            {unverified && verdict?.unverifiedReason && (
              <div className="text-muted-foreground">
                <strong>Status</strong>: {verdict.unverifiedReason}
              </div>
            )}
            {clear && (
              <div className="text-money">
                <strong>Status</strong>: residential connection confirmed
              </div>
            )}
            {fp && (
              <div className="text-muted-foreground">
                <strong>Device</strong>: <code className="text-[10px]">{fp.slice(0, 12)}…</code>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Button onClick={() => runCheck(true)} disabled={checking} className="w-full gap-2">
            {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Re-check connection
          </Button>
          <Button
            disabled={!continueReady || checking}
            onClick={() => {
              setGateActive(false);
              setContinueReady(false);
            }}
            variant="secondary"
            className="w-full"
          >
            {continueReady ? "Continue" : blocked ? "Waiting for VPN to be disabled…" : "Waiting for verification…"}
          </Button>
          {user && (
            <Button onClick={signOut} variant="secondary" className="w-full gap-2">
              <LogOut className="h-4 w-4" /> Sign out
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
