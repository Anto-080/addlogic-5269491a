import { ReactNode, useCallback, useEffect, useState } from "react";
import { ShieldAlert, Loader2, RefreshCw, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchIpInfo, evaluateBlock, type IpInfo } from "@/lib/vpnDetection";
import { getVisitorId } from "@/lib/fingerprint";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

/**
 * App-wide hard gate: any user routed through a VPN, proxy, or datacenter
 * IP is blocked from the app entirely (regardless of GPS / cookie toggles).
 * This is the primary defense against bot farms draining the regional reward
 * pool. There is no "continue anyway" — the user must disconnect their VPN.
 *
 * Network/lookup failures are NOT a block (offline-friendly); only a clearly
 * suspect IP triggers the screen.
 */

let cachedClean: IpInfo | null = null; // session-cached PASS only

export function VpnGuard({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const [info, setInfo] = useState<IpInfo | null>(null);
  const [checking, setChecking] = useState(true);
  const [fp, setFp] = useState<string | null>(null);

  const runCheck = useCallback(async () => {
    setChecking(true);
    const [next, visitorId] = await Promise.all([fetchIpInfo(), getVisitorId()]);
    setFp(visitorId);
    setInfo(next);
    const { block } = evaluateBlock(next);
    if (block && user) {
      try {
        await supabase
          .from("device_telemetry")
          .upsert(
            {
              user_id: user.id,
              vpn_suspected: true,
              asn: next?.asn ?? null,
              fingerprint: visitorId,
              ip_country: next?.country_code ?? null,
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

  const { block, reason } = evaluateBlock(info);

  if (!block) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-md w-full bg-card border border-destructive/50 rounded-2xl p-6 space-y-4 shadow-2xl">
        <div className="flex justify-center">
          <div className="h-14 w-14 rounded-full bg-destructive/15 flex items-center justify-center">
            <ShieldAlert className="h-7 w-7 text-destructive" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-lg font-bold text-foreground">Unusual traffic detected</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your connection appears to be routed through a VPN, proxy, or datacenter network.
            To protect the regional reward pool from bot farms, ResearchRewards is unavailable
            on these connections. Please disable your VPN or proxy and re-check.
          </p>
        </div>

        <div className="rounded-lg border border-border/60 bg-secondary/30 p-3 text-[11px] text-foreground/90 space-y-1">
          <div>
            <strong>Network</strong>: {info?.org ?? info?.asn ?? "unknown"}
          </div>
          {info?.country_name && (
            <div>
              <strong>Country</strong>: {info.country_name}
            </div>
          )}
          {reason && (
            <div className="text-destructive">
              <strong>Reason</strong>: {reason}
            </div>
          )}
          {fp && (
            <div className="text-muted-foreground">
              <strong>Device</strong>: <code className="text-[10px]">{fp.slice(0, 12)}…</code>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={runCheck} disabled={checking} className="w-full gap-2">
            {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Re-check connection
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
