import { ShieldAlert, Loader2, CheckCircle2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { clearIpVerdictCache, fetchIpVerdict, type IpVerdict } from "@/lib/vpnDetection";

type Props = {
  open: boolean;
  onSatisfied: () => void;
};

/**
 * GPS-toggle-bound VPN gate — mirror of AdBlockConsentSlide.
 *
 * When the GPS precision toggle is ON, a residential connection is
 * required (region-priced rewards). If a VPN/proxy/datacenter IP is
 * detected, this slide locks the app until the user disables the VPN.
 * Re-checks every 5s; Continue stays dark until the verdict is clean.
 */
export function VpnConsentSlide({ open, onSatisfied }: Props) {
  const [verdict, setVerdict] = useState<IpVerdict | null>(null);
  const [checking, setChecking] = useState(false);
  const blockedByTransportFailure = verdict?.info?.reason === "VPN/Proxy traffic detected. Please deactivate your VPN to access the site.";

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const run = async (force = false) => {
      setChecking(true);
      if (force) clearIpVerdictCache();
      const v = await fetchIpVerdict(force);
      if (!cancelled) {
        setVerdict(v);
        setChecking(false);
      }
    };
    run();
    const id = window.setInterval(() => run(true), 5000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [open]);

  if (!open) return null;

  const blocked = verdict?.status === "blocked";
  const unverified = verdict?.status === "unverified";
  const canContinue = verdict?.status === "ok";

  return (
    <div className="fixed inset-0 z-[80] bg-background/95 backdrop-blur flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-md w-full bg-card border border-destructive/40 rounded-2xl p-6 space-y-4 shadow-2xl my-8">
        <div className="flex justify-center">
          <div className="h-14 w-14 rounded-full bg-destructive/15 flex items-center justify-center">
            <ShieldAlert className="h-7 w-7 text-destructive" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-lg font-bold text-foreground">Disable VPN to keep researching</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {blockedByTransportFailure ? (
              <>
                <span className="text-destructive font-semibold">VPN/Proxy traffic detected.</span> Please deactivate your VPN to access the site.
              </>
            ) : (
              <>
                GPS-precision rewards are <span className="text-destructive font-semibold">region-priced</span>.
                A VPN, proxy, or datacenter IP lets a user spoof a high-CPM region and drains the
                redistributed pool. Disable your VPN (or turn off GPS precision) to continue.
              </>
            )}
          </p>
        </div>

        <div className="rounded-lg border border-border/60 bg-secondary/30 p-3 text-[11px] text-foreground/90 space-y-1">
          <div><strong>Network</strong>: {verdict?.info?.org ?? verdict?.info?.asn ?? "checking…"}</div>
          {verdict?.info?.country_name && (
            <div><strong>Country</strong>: {verdict.info.country_name}</div>
          )}
          {blocked && verdict?.info?.reason && (
            <div className="text-destructive"><strong>Reason</strong>: {verdict.info.reason}</div>
          )}
          {unverified && verdict?.unverifiedReason && (
            <div className="text-muted-foreground"><strong>Status</strong>: {verdict.unverifiedReason}</div>
          )}
        </div>

        <div className="flex items-center justify-center gap-2 text-xs">
          {checking && (
            <><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /><span className="text-muted-foreground">Re-checking…</span></>
          )}
          {!checking && blocked && (
            <><ShieldAlert className="h-4 w-4 text-destructive" /><span className="text-destructive font-semibold">VPN/proxy detected — still active</span></>
          )}
          {!checking && unverified && (
            <><ShieldAlert className="h-4 w-4 text-muted-foreground" /><span className="text-muted-foreground font-semibold">Cloudflare check unavailable — retrying</span></>
          )}
          {!checking && canContinue && (
            <><CheckCircle2 className="h-4 w-4 text-money" /><span className="text-money font-semibold">All clear</span></>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Button
            variant="secondary"
            disabled={checking}
            onClick={() => {
              clearIpVerdictCache();
              setChecking(true);
              fetchIpVerdict(true).then((v) => { setVerdict(v); setChecking(false); });
            }}
            className="w-full gap-2"
          >
            {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Re-check now
          </Button>
          <Button disabled={!canContinue} onClick={onSatisfied} className="w-full">
            {canContinue ? "Continue" : "Waiting for VPN to be disabled…"}
          </Button>
        </div>
      </div>
    </div>
  );
}
