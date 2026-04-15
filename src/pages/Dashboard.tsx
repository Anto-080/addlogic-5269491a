import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { AppLayout } from "@/components/AppLayout";
import { MOCK_EARNINGS, MOCK_MILESTONES, TIERS } from "@/lib/mockData";
import { useState, useEffect } from "react";
import { Zap, TrendingUp, Clock, Award, Star } from "lucide-react";

function AnimatedCounter({ target, prefix = "$" }: { target: number; prefix?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const step = target / 40;
    const interval = setInterval(() => {
      setVal((v) => { const next = v + step; return next >= target ? target : next; });
    }, 30);
    return () => clearInterval(interval);
  }, [target]);
  return <span>{prefix}{val.toFixed(2)}</span>;
}

export default function Dashboard() {
  const [dataConsent, setDataConsent] = useState(false);
  const [liveXp, setLiveXp] = useState(MOCK_EARNINGS.xp);
  const [liveMultiplier, setLiveMultiplier] = useState(MOCK_EARNINGS.currentMultiplier);

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveXp((v) => Math.min(v + Math.random() * 3, MOCK_EARNINGS.xpToNext));
      setLiveMultiplier((v) => {
        const jitter = (Math.random() - 0.5) * 0.1;
        return Math.max(1, Math.min(14, v + jitter));
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const xpPercent = (liveXp / MOCK_EARNINGS.xpToNext) * 100;
  const primaryTier = TIERS[3]; // Tech tier as example

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Your research hub — keep exploring, keep earning.</p>
        </div>

        {/* Earnings Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Today", value: MOCK_EARNINGS.today, icon: Clock },
            { label: "This Week", value: MOCK_EARNINGS.thisWeek, icon: TrendingUp },
            { label: "All Time", value: MOCK_EARNINGS.allTime, icon: Award },
          ].map((item) => (
            <Card key={item.label} className="bg-card border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="text-2xl font-bold text-gradient-gold">
                      <AnimatedCounter target={item.value} />
                    </p>
                  </div>
                  <item.icon className="h-8 w-8 text-primary/40" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Experience Bar */}
        <Card className="bg-card border-border/50 glow-amber">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Experience Level {MOCK_EARNINGS.level}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{Math.floor(liveXp).toLocaleString()} / {MOCK_EARNINGS.xpToNext.toLocaleString()} XP</span>
              <span className="text-crimson font-semibold">x{liveMultiplier.toFixed(1)} Multiplier</span>
            </div>
            <div className="relative">
              <Progress value={xpPercent} className="h-4 bg-secondary" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-bold text-primary-foreground drop-shadow">{xpPercent.toFixed(1)}%</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              XP grows by <span className="text-crimson font-medium">time × tier multiplier</span>. Higher tier research = faster leveling.
              Level unlocks bonuses, partnerships, and investment pools.
            </p>
          </CardContent>
        </Card>

        {/* Tier Badge & Data Consent Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="bg-card border-border/50">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="text-3xl">{primaryTier.icon}</div>
              <div>
                <p className="text-xs text-muted-foreground">Primary Research Tier</p>
                <p className="text-sm font-semibold text-foreground">{primaryTier.name}</p>
                <p className="text-xs text-crimson">x{primaryTier.multiplier} earning multiplier</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Data Consent</p>
                  <p className="text-xs text-muted-foreground">
                    {dataConsent ? "Sharing enabled — unlocks rewarded videos & tailored offers" : "Off — enable for rewarded videos & personalized ads"}
                  </p>
                </div>
                <Switch checked={dataConsent} onCheckedChange={setDataConsent} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Milestones */}
        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-5 w-5 text-gold" />
              Top Milestones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {MOCK_MILESTONES.map((m) => {
                const tier = TIERS.find((t) => t.id === m.tier);
                return (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{tier?.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{m.title}</p>
                        <p className="text-xs text-muted-foreground">{m.date} · Tier {m.tier}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gradient-gold">${m.earned.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">+{m.xpGained} XP</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
