import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2, CheckCircle2, Info, Globe, ShieldAlert, Fingerprint, ChevronDown, ChevronUp } from "lucide-react";
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
import { fetchIpInfo, reverseGeocodeCountry, type IpInfo } from "@/lib/vpnDetection";
import { getVisitorId } from "@/lib/fingerprint";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onSatisfied: (coords: Coords) => void;
  onCancel: () => void;
};

/**
 * Full-screen consent slide shown after the GPS toggle is turned on.
 * Three real anti-fraud steps:
 *   1. FingerprintJS v5 OSS — derives a stable visitorId for this browser.
 *   2. ipapi.co — reads the IP, ASN/org, and country; flags datacenter / VPN ASNs.
 *   3. GPS fix (or IP fallback) — reverse geocoded country must match the IP country.
 *
 * Mismatches and detected VPNs disable the GPS multiplier bonus (low-trust
 * mode) but the user can still proceed. This protects the regional reward
 * pool from being drained by botfarms / VPN spoofing.
 */
export function GeoConsentSlide({ open, onSatisfied, onCancel }: Props) {
  const { user } = useAuth();
  const [permission, setPermission] = useState<GeolocationPermissionState>("prompt");
  const [working, setWorking] = useState(false);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [ipInfo, setIpInfo] = useState<IpInfo | null>(null);
  const [fp, setFp] = useState<string | null>(null);
  const [gpsCountry, setGpsCountry] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    readGeolocationPermission().then((s) => { if (!cancelled) setPermission(s); });
    // Run fingerprint + IP info upfront — needed regardless of GPS choice.
    getVisitorId().then((id) => { if (!cancelled) setFp(id); });
    fetchIpInfo().then((info) => { if (!cancelled) setIpInfo(info); });
    return () => { cancelled = true; };
  }, [open]);

  const countryMismatch =
    !!gpsCountry && !!ipInfo?.country_code && gpsCountry !== ipInfo.country_code;
  const lowTrust = (ipInfo?.vpn_suspected ?? false) || countryMismatch;

  const finalize = async (c: Coords) => {
    setCoords(c);
    if (user) {
      try {
        // Standard non-PII profile.
        await persistTelemetry(user.id, c, snapshotDeviceProfile());
        // Plus the new anti-fraud fields.
        await supabase
          .from("device_telemetry")
          .update({
            fingerprint: fp,
            ip_country: ipInfo?.country_code ?? null,
            gps_country: gpsCountry,
            vpn_suspected: lowTrust,
            asn: ipInfo?.asn ?? null,
          })
          .eq("user_id", user.id);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to record telemetry");
      }
    }
    onSatisfied(c);
  };

  const tryGps = async () => {
    setWorking(true);
    try {
      const c = await requestWebGeolocation();
      const newPerm = await readGeolocationPermission();
      setPermission(newPerm);
      if (c) {
        const cc = await reverseGeocodeCountry(c.lat, c.lng);
        setGpsCountry(cc);
        await finalize(c);
        toast.success(lowTrust ? "Location active — low-trust mode" : "Precise location active");
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
    try {
      const c = await requestIpGeolocation();
      if (c) {
        // No GPS country in this branch — only the IP.
        await finalize(c);
        toast.success(lowTrust ? "IP location active — low-trust mode" : "Approximate location active (IP-based)");
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
          <h2 className="text-lg font-bold text-foreground">Geolocation &amp; anti-fraud check</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Unlocks regional ads + the location multiplier. To protect the reward pool from
            botfarms and VPN-spoofed regions, we run three checks first.
          </p>
        </div>

        <div className="rounded-lg border border-border/60 bg-secondary/30 p-3 text-[11px] text-foreground/90 space-y-2">
          <div className="flex items-start gap-2">
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
                <>
                  {ipInfo.country_name ?? "?"} · {ipInfo.org ?? ipInfo.asn ?? "unknown"}
                </>
              ) : "checking…"}
            </span>
          </div>
          {ipInfo?.vpn_suspected && (
            <div className="flex items-start gap-2 pt-2 border-t border-destructive/30">
              <ShieldAlert className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
              <span className="text-destructive">
                <strong>VPN / datacenter IP detected.</strong> {ipInfo.reason}.
                Disable your VPN to earn the full GPS multiplier; otherwise the location
                bonus is withheld and you continue in <em>low-trust mode</em>.
              </span>
            </div>
          )}
          {countryMismatch && (
            <div className="flex items-start gap-2 pt-2 border-t border-destructive/30">
              <ShieldAlert className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
              <span className="text-destructive">
                GPS country (<code>{gpsCountry}</code>) doesn't match IP country
                (<code>{ipInfo?.country_code}</code>) — low-trust mode.
              </span>
            </div>
          )}
          <div className="flex items-start gap-2 pt-1 border-t border-border/40">
            <CheckCircle2 className="h-3.5 w-3.5 text-money mt-0.5 shrink-0" />
            <span><strong>Coarse geolocation</strong> via your phone GPS (or IP fallback).</span>
          </div>
          <div className="flex items-start gap-2">
            <Info className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
            <span className="text-muted-foreground">No contacts, no IMEI, no browsing history, no name.</span>
          </div>
        </div>

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
          <Button
            onClick={tryGps}
            disabled={working || !!coords}
            className="w-full gap-2"
          >
            {working ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
            {coords?.source === "gps" ? "Precise location active" : "Use precise location (GPS)"}
          </Button>
          <Button
            onClick={tryIp}
            disabled={working || !!coords}
            variant="secondary"
            className="w-full gap-2"
          >
            <Globe className="h-4 w-4" />
            {coords?.source === "ip" ? "Approximate location active" : "Use approximate location (IP)"}
          </Button>
          <button
            onClick={onCancel}
            className="text-[11px] text-muted-foreground hover:text-foreground self-center mt-1"
          >
            Cancel and turn GPS toggle off
          </button>
        </div>
      </div>
    </div>
  );
}
