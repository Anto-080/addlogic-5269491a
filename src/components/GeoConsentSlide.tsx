import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2, CheckCircle2, Info, Globe, ShieldAlert, Fingerprint, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import {
  readGeolocationPermission,
  requestWebGeolocation,
  requestIpGeolocation,
  type Coords,
  type GeolocationPermissionState,
} from "@/lib/webGeolocation";
import { persistTelemetry, snapshotDeviceProfile } from "@/lib/geolocation";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { fetchIpInfo, reverseGeocodeCountry, verifyIpForApproximateLocation, type IpInfo } from "@/lib/vpnDetection";
import { setApprovedSession } from "@/lib/sessionWatcher";
import { getVisitorId } from "@/lib/fingerprint";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onSatisfied: (coords: Coords) => void;
};

/**
 * Post-login entrance gate. Two outcomes:
 *  - Precise GPS → user is trusted, app unlocks, no IP/VPN check is run.
 *  - Approximate (IP) → MaxMind minFraud (when configured) + FingerprintJS
 *    Pro Smart Signals decide. Pass → unlock. Fail → user must disable VPN.
 */
export function GeoConsentSlide({ open, onSatisfied }: Props) {
  const { user } = useAuth();
  const [permission, setPermission] = useState<GeolocationPermissionState>("prompt");
  const [working, setWorking] = useState(false);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [ipInfo, setIpInfo] = useState<IpInfo | null>(null);
  const [fp, setFp] = useState<string | null>(null);
  const [gpsCountry, setGpsCountry] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [ipBlock, setIpBlock] = useState<{ reason: string } | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    readGeolocationPermission().then((s) => { if (!cancelled) setPermission(s); });
    return () => { cancelled = true; };
  }, [open]);

  // Lazy-load the anti-fraud details (visitorId + IP info) ONLY when the
  // user opens the details panel. No Fingerprint/IP call fires on mount,
  // and no call fires at all if the user picks Precise GPS.
  useEffect(() => {
    if (!open || !detailsOpen) return;
    let cancelled = false;
    if (!fp) getVisitorId().then((id) => { if (!cancelled) setFp(id); });
    if (!ipInfo) fetchIpInfo().then((info) => { if (!cancelled) setIpInfo(info); });
    return () => { cancelled = true; };
  }, [open, detailsOpen, fp, ipInfo]);

  const finalize = async (c: Coords, resolvedGpsCountry: string | null = gpsCountry) => {
    setCoords(c);
    if (user) {
      try {
        await persistTelemetry(user.id, c, snapshotDeviceProfile());
        await supabase
          .from("device_telemetry")
          .update({
            fingerprint: fp,
            ip_country: ipInfo?.country_code ?? null,
            gps_country: resolvedGpsCountry,
            vpn_suspected: false,
            asn: ipInfo?.asn ?? null,
          })
          .eq("user_id", user.id);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to record telemetry");
      }
    }
    // Seed the session watcher so mid-session IP changes for mobile users
    // don't re-trigger the VPN block card.
    try {
      const visitorId = fp ?? (await getVisitorId());
      setApprovedSession(user?.id ?? null, { visitorId, ip: ipInfo?.ip ?? null });
    } catch { /* ignore */ }
    onSatisfied(c);
  };


  const tryGps = async () => {
    setWorking(true);
    setIpBlock(null);
    try {
      const c = await requestWebGeolocation();
      const newPerm = await readGeolocationPermission();
      setPermission(newPerm);
      if (c) {
        const cc = await reverseGeocodeCountry(c.lat, c.lng);
        setGpsCountry(cc);
        await finalize(c, cc);
        toast.success("Precise location active");
      } else if (newPerm === "denied") {
        toast.error("Location blocked by browser. Use approximate (IP) instead, or unblock and retry.");
      } else {
        toast.error("Could not get location");
      }
    } finally {
      setWorking(false);
    }
  };

  const tryIp = async () => {
    setWorking(true);
    setIpBlock(null);
    try {
      const verdict = await verifyIpForApproximateLocation();
      if (!verdict.ok) {
        setIpBlock({ reason: verdict.reason ?? "VPN/proxy detected" });
        toast.error("VPN or proxy detected — please disable it to continue.");
        return;
      }
      const c = await requestIpGeolocation();
      if (c) {
        await finalize(c);
        toast.success("Approximate location active");
      } else {
        toast.error("IP-based lookup failed");
      }
    } finally {
      setWorking(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-md w-full bg-card border border-[#9A7246]/50 rounded-2xl p-6 space-y-4 shadow-2xl my-8">
        <div className="flex justify-center">
          <div className="h-14 w-14 rounded-full bg-[#9A7246]/15 flex items-center justify-center">
            <MapPin className="h-7 w-7" style={{ color: "#9A7246" }} />
          </div>
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-lg font-bold text-foreground">Choose your location mode</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong>Activate GPS</strong> for more precise, better-paid ads and regional offers,{" "}
            <strong>or</strong> share your <strong>approximate location</strong> so we can verify
            you're not on a VPN/proxy used by bot farms to drain the regional reward pool.
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            In the proximate future: Geolocation will allow you to check Places of Interest usually
            frequented by individuals sharing the same types of interests. You'll also be enabled
            to better connect with users of similar interest affinity who accepted to exchange
            Contact Cards with you.
          </p>
        </div>

        {ipBlock && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-[11px] text-destructive flex items-start gap-2">
            <ShieldAlert className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>
              <strong>VPN/Proxy traffic detected.</strong> Please deactivate your VPN to access the site.
              <span className="block text-destructive/80 mt-1">{ipBlock.reason}</span>
            </span>
          </div>
        )}

        <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
          <CollapsibleTrigger asChild>
            <button type="button" className="w-full flex items-center justify-between text-[11px] text-muted-foreground hover:text-foreground">
              <span>Show anti-fraud details</span>
              {detailsOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="rounded-lg border border-border/60 bg-secondary/30 p-3 mt-2 text-[11px] text-foreground/90 space-y-2">
              <p className="text-muted-foreground leading-relaxed">
                Region-priced rewards mean a user on a VPN can spoof a high-CPM region and drain
                the redistributed pool. We only run a fraud check when you choose <em>approximate
                location</em>; precise GPS skips it entirely.
              </p>
              <div className="flex items-start gap-2 pt-1 border-t border-border/40">
                <Fingerprint className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: fp ? "hsl(var(--money))" : "hsl(var(--muted-foreground))" }} />
                <span>
                  <strong>Browser fingerprint</strong>:{" "}
                  {fp ? <code className="text-[10px]">{fp.slice(0, 12)}…</code> : "computing…"}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Globe className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${ipInfo ? "text-money" : "text-muted-foreground"}`} />
                <span className="flex-1 min-w-0">
                  <strong>IP / ASN</strong>:{" "}
                  {ipInfo ? (
                    <>{ipInfo.country_name ?? "?"} · {ipInfo.org ?? ipInfo.asn ?? "unknown"}</>
                  ) : "checking…"}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Info className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <span className="text-muted-foreground">No contacts, no IMEI, no browsing history, no name.</span>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {permission === "denied" && !coords && (
          <p className="text-[11px] text-destructive flex items-start gap-1">
            <Info className="h-3 w-3 mt-0.5 shrink-0" />
            <span>
              Your browser is blocking precise location for this site. Tap the lock/info icon next to the
              address bar → Site settings → Location → Allow. Or use approximate location below.
            </span>
          </p>
        )}

        <div className="flex flex-col gap-2">
          <Button onClick={tryGps} disabled={working || !!coords} className="w-full gap-2">
            {working ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
            {coords?.source === "gps" ? "Precise location active" : "Use precise location (GPS)"}
          </Button>
          <Button
            onClick={tryIp}
            disabled={working || !!coords}
            variant="secondary"
            className="w-full gap-2"
          >
            {working ? <Loader2 className="h-4 w-4 animate-spin" /> : ipBlock ? <RefreshCw className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
            {coords?.source === "ip"
              ? "Approximate location active"
              : ipBlock
                ? "Re-check (after disabling VPN)"
                : "Use approximate location (IP)"}
          </Button>
        </div>
      </div>
    </div>
  );
}
