import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/contexts/SettingsContext";
import { Bell, Shield, User, Radio, MapPin, Cookie } from "lucide-react";
import { toast } from "sonner";
import { requestGeolocation, persistTelemetry, snapshotDeviceProfile } from "@/lib/geolocation";

export default function SettingsPage() {
  const { user } = useAuth();
  const { cookieAutoAccept, setCookieAutoAccept, gpsPrecision, setGpsPrecision } = useSettings();
  const [notifications, setNotifications] = useState(true);
  const [available, setAvailable] = useState(true);
  const [displayName, setDisplayName] = useState(user?.user_metadata?.display_name || "");
  const [gpsConfirmOpen, setGpsConfirmOpen] = useState(false);
  const [requesting, setRequesting] = useState(false);

  const handleGpsToggle = (v: boolean) => {
    if (v) {
      setGpsConfirmOpen(true);
    } else {
      setGpsPrecision(false);
    }
  };

  const confirmGpsActivation = async () => {
    setGpsConfirmOpen(false);
    setRequesting(true);
    try {
      const coords = await requestGeolocation();
      const profile = snapshotDeviceProfile();
      if (user) await persistTelemetry(user.id, coords, profile);
      if (coords) {
        setGpsPrecision(true);
        toast.success("Geolocation enabled — non-PII telemetry recorded");
      } else {
        setGpsPrecision(false);
        toast.error("Permission denied or unavailable");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to enable GPS");
      setGpsPrecision(false);
    } finally {
      setRequesting(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your profile, privacy, and preferences.</p>
        </div>

        {/* Profile */}
        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-5 w-5" style={{ color: "hsl(var(--primary))" }} /> Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground">Display Name</label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="bg-secondary/50 mt-1" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Email</label>
              <Input value={user?.email || ""} disabled className="bg-secondary/30 mt-1 opacity-60" />
            </div>
            <Button size="sm">Save Changes</Button>
          </CardContent>
        </Card>

        {/* Data permissions — Cookie & GPS */}
        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-5 w-5" style={{ color: "hsl(var(--primary))" }} /> Data permissions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <Cookie className="h-5 w-5 mt-0.5 shrink-0" style={{ color: "hsl(var(--cookie-dough))" }} />
                <div>
                  <p className="text-sm font-medium text-foreground">Auto-accept cookies (+x2 multiplier)</p>
                  <p className="text-xs text-muted-foreground">
                    Skips cookie banners during research and boosts your XP rate.
                  </p>
                </div>
              </div>
              <Switch checked={cookieAutoAccept} onCheckedChange={setCookieAutoAccept} />
            </div>

            <div className="flex items-start justify-between gap-4 pt-3 border-t border-border/30">
              <div className="flex items-start gap-3 flex-1">
                <MapPin className="h-5 w-5 mt-0.5 shrink-0" style={{ color: "hsl(var(--crimson))" }} />
                <div>
                  <p className="text-sm font-medium text-foreground">GPS precision (+x5 multiplier)</p>
                  <p className="text-xs text-muted-foreground">
                    On phones, your device will request OS-level geolocation permission. We collect only non-PII
                    telemetry: coarse coordinates, timezone, locale, screen size, network type. No contacts, no
                    identifiers.
                  </p>
                </div>
              </div>
              <Switch checked={gpsPrecision} onCheckedChange={handleGpsToggle} disabled={requesting} />
            </div>
          </CardContent>
        </Card>

        {/* Availability / DND */}
        <Card className="bg-card border-border/50 glow-amber">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Radio className="h-5 w-5" style={{ color: "hsl(var(--primary))" }} /> Availability Signal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 flex items-start gap-3">
                <div className="shrink-0 mt-0.5">
                  {available ? (
                    <svg viewBox="0 0 32 32" width="36" height="36" aria-label="Available smiley">
                      <circle cx="16" cy="16" r="14" fill="hsl(var(--primary))" />
                      <circle cx="11" cy="13" r="2" fill="hsl(var(--primary-foreground))" />
                      <circle cx="21" cy="13" r="2" fill="hsl(var(--primary-foreground))" />
                      <path d="M9 19 Q16 25 23 19" stroke="hsl(var(--primary-foreground))" strokeWidth="2.2" fill="none" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 32 32" width="36" height="36" aria-label="Do not disturb ghost">
                      <path
                        d="M4 16 a12 12 0 0 1 24 0 V28 l-3 -2 -3 2 -3 -2 -3 2 -3 -2 -3 2 -3 -2 -3 2 Z"
                        fill="hsl(var(--crimson))"
                      />
                      <circle cx="12" cy="15" r="2.4" fill="white" />
                      <circle cx="20" cy="15" r="2.4" fill="white" />
                      <circle cx="12.5" cy="15.5" r="1.1" fill="hsl(var(--background))" />
                      <circle cx="20.5" cy="15.5" r="1.1" fill="hsl(var(--background))" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    {available ? "Available to contacts" : "Do Not Disturb / Work in Progress"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Broadcast your status to friends and contacts connected via Facebook, LinkedIn, X and other platforms.
                  </p>
                </div>
              </div>
              <Switch checked={available} onCheckedChange={setAvailable} />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-5 w-5" style={{ color: "hsl(var(--primary))" }} /> Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">Push Notifications</p>
                <p className="text-xs text-muted-foreground">Earnings updates, milestones, new features</p>
              </div>
              <Switch checked={notifications} onCheckedChange={setNotifications} />
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={gpsConfirmOpen} onOpenChange={setGpsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enable GPS precision?</AlertDialogTitle>
            <AlertDialogDescription>
              Your device will ask for location permission. We will store only:
              <span className="block mt-2 text-foreground/80">
                • Coarse coordinates and accuracy<br />
                • Timezone, locale, screen size<br />
                • Hardware concurrency, memory tier, network type
              </span>
              <span className="block mt-2">
                We do <strong>not</strong> collect: contacts, IMEI, phone number, browsing history, or any personally
                identifiable information. Data is owner-only — only you can read it.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmGpsActivation}>Activate GPS</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
