import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2, CheckCircle2, Info, Globe } from "lucide-react";
import {
  readGeolocationPermission,
  requestWebGeolocation,
  requestIpGeolocation,
  type Coords,
  type GeolocationPermissionState,
} from "@/lib/webGeolocation";
import { persistTelemetry, snapshotDeviceProfile } from "@/lib/geolocation";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onSatisfied: (coords: Coords) => void;
  onCancel: () => void;
};

/**
 * Full-screen consent slide shown after the user enables the GPS toggle.
 * Cannot be dismissed until either:
 *   1. navigator.geolocation returns coords, or
 *   2. The IP fallback (ipapi.co) returns coords.
 * Once satisfied, persists non-PII telemetry and calls onSatisfied().
 */
export function GeoConsentSlide({ open, onSatisfied, onCancel }: Props) {
  const { user } = useAuth();
  const [permission, setPermission] = useState<GeolocationPermissionState>("prompt");
  const [working, setWorking] = useState(false);
  const [coords, setCoords] = useState<Coords | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    readGeolocationPermission().then((s) => { if (!cancelled) setPermission(s); });
    return () => { cancelled = true; };
  }, [open]);

  const finalize = async (c: Coords) => {
    setCoords(c);
    if (user) {
      try {
        await persistTelemetry(user.id, c, snapshotDeviceProfile());
      } catch (e) {
        // Non-fatal — surface but don't block consent.
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
        await finalize(c);
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
    try {
      const c = await requestIpGeolocation();
      if (c) {
        await finalize(c);
        toast.success("Approximate location active (IP-based)");
      } else {
        toast.error("IP-based lookup failed");
      }
    } finally {
      setWorking(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card border border-[#9A7246]/50 rounded-2xl p-6 space-y-4 shadow-2xl">
        <div className="flex justify-center">
          <div className="h-14 w-14 rounded-full bg-[#9A7246]/15 flex items-center justify-center">
            <MapPin className="h-7 w-7" style={{ color: "#9A7246" }} />
          </div>
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-lg font-bold text-foreground">Geolocation &amp; non-PII consent</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            To unlock regional ads, coupons, and the location multiplier, we need your consent for:
          </p>
        </div>

        <div className="rounded-lg border border-border/60 bg-secondary/30 p-3 text-[11px] text-foreground/90 space-y-2">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-money mt-0.5 shrink-0" />
            <span><strong>Coarse geolocation</strong> via your phone GPS (or IP fallback).</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-money mt-0.5 shrink-0" />
            <span><strong>Non-PII signals</strong>: timezone, locale, screen size, hardware tier, network type.</span>
          </div>
          <div className="flex items-start gap-2 pt-1 border-t border-border/40">
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
