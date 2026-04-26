import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Bell, User, Radio } from "lucide-react";

const KEY_AVAILABLE = "rr.available";
const KEY_NOTIF = "rr.notifications";

export default function SettingsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const v = localStorage.getItem(KEY_NOTIF);
    return v === null ? true : v === "1";
  });
  const [available, setAvailable] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const v = localStorage.getItem(KEY_AVAILABLE);
    return v === null ? true : v === "1";
  });
  const [displayName, setDisplayName] = useState(user?.user_metadata?.display_name || "");

  useEffect(() => { localStorage.setItem(KEY_AVAILABLE, available ? "1" : "0"); }, [available]);
  useEffect(() => { localStorage.setItem(KEY_NOTIF, notifications ? "1" : "0"); }, [notifications]);

  return (
    <AppLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your profile, availability, and notifications.</p>
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
    </AppLayout>
  );
}
