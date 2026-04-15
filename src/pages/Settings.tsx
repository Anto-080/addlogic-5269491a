import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Bell, Shield, User } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const [dataConsent, setDataConsent] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [displayName, setDisplayName] = useState(user?.user_metadata?.display_name || "");

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
              <User className="h-5 w-5 text-primary" /> Profile
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

        {/* Data Consent */}
        <Card className="bg-card border-border/50 glow-amber">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" /> Data & Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Data Collection Consent</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Allow ResearchRewards to collect anonymized usage metrics for resale to analyst companies.
                  This improves your experience with tailored offers, coupons, and more relevant ads.
                  <strong className="text-primary"> Enabling also unlocks Rewarded Videos</strong> — the highest-earning ad format.
                </p>
              </div>
              <Switch checked={dataConsent} onCheckedChange={setDataConsent} />
            </div>
            <div className="bg-secondary/30 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
              <p><strong className="text-foreground">What we collect:</strong> Research interests, session durations, tier preferences, ad interaction patterns.</p>
              <p><strong className="text-foreground">What we don't collect:</strong> Personal messages, passwords, financial details.</p>
              <p><strong className="text-foreground">Benefits:</strong> Personalized offers, discount coupons, better ad matching, rewarded video access.</p>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" /> Notifications
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
