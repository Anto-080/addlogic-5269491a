import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { AppLayout } from "@/components/AppLayout";
import { MOCK_EARNINGS, MOCK_MILESTONES, TIERS, DAILY_DESK } from "@/lib/mockData";
import { useState, useEffect } from "react";
import { Zap, TrendingUp, Clock, Award, Star, Map, ShieldAlert, Newspaper, Cookie, Check } from "lucide-react";

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
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [liveXp, setLiveXp] = useState(MOCK_EARNINGS.xp);
  const [liveMultiplier, setLiveMultiplier] = useState(MOCK_EARNINGS.currentMultiplier);

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveXp((v) => Math.min(v + Math.random() * 3, MOCK_EARNINGS.xpToNext));
      setLiveMultiplier((v) => {
        const jitter = (Math.random() - 0.5) * 0.1;
        return Math.max(0.5, Math.min(10, v + jitter));
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const xpPercent = (liveXp / MOCK_EARNINGS.xpToNext) * 100;
  // Multiplier bar: 0.5x → 10x maps 0% → 100%
  const multPercent = ((liveMultiplier - 0.5) / (10 - 0.5)) * 100;
  const primaryTier = TIERS[3]; // Ecology

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

        {/* Experience + Multiplier Bars */}
        <Card className="bg-card border-border/50 glow-amber">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Experience Level {MOCK_EARNINGS.level}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{Math.floor(liveXp).toLocaleString()} / {MOCK_EARNINGS.xpToNext.toLocaleString()} XP</span>
              <span className="text-foreground/80 font-medium">{xpPercent.toFixed(1)}%</span>
            </div>

            {/* Organic XP bar */}
            <div className="relative h-4 w-full overflow-hidden rounded-full bg-secondary/60">
              <div
                className="xp-fluid h-full transition-[width] duration-700 ease-out"
                style={{ width: `${xpPercent}%` }}
              />
            </div>

            {/* Crimson multiplier sub-bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">Active Multiplier</span>
                <span className="font-semibold" style={{ color: "hsl(348 83% 60%)" }}>
                  x{liveMultiplier.toFixed(2)} · range 0.5× – 10×
                </span>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary/40">
                <div
                  className="multiplier-fluid h-full transition-[width] duration-700 ease-out"
                  style={{ width: `${multPercent}%` }}
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              XP grows by <span className="text-foreground/90 font-medium">time × tier multiplier</span>. The crimson bar reflects your current tier multiplier — fills to max at Tier 1 (10×), minimum on Adult content (0.5×).
            </p>
          </CardContent>
        </Card>

        {/* Merged Data + GPS Precision Toggle */}
        <Card className="bg-card border-border/50 glow-amber">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Data Collection & GPS Precision Targeting
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Single switch — share anonymized usage <span className="text-foreground/80">and</span> live location with sponsor partners.
                  Unlocks <span className="text-primary">premium-priced ads</span>, rewarded videos, tailored coupons, and a <span className="text-primary">bonus XP multiplier</span>.
                  Sponsors pay top-rate for max accuracy. Heads up: <span className="text-foreground/80">drains battery faster</span> and increases unskippable video frequency.
                </p>
              </div>
              <Switch
                checked={dataConsent && gpsEnabled}
                onCheckedChange={(v) => { setDataConsent(v); setGpsEnabled(v); }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Primary tier badge */}
        <Card className="bg-card border-border/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="text-3xl">{primaryTier.icon}</div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Primary Research Tier</p>
              <p className="text-sm font-semibold text-foreground">{primaryTier.name}</p>
              <p className="text-xs text-foreground/70">x{primaryTier.multiplier} earning multiplier</p>
            </div>
          </CardContent>
        </Card>

        {/* Daily Information Desk with dual-use warnings */}
        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Newspaper className="h-5 w-5 text-primary" />
              Daily Information Desk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Curated articles. Topics involving dual-use technologies (CRISPR-Cas9, molecular chirality, receptor chimerism) are marked with safety advisories from accredited sources. ResearchRewards does not sponsor speculative dual-use research.
            </p>
            <div className="space-y-2">
              {DAILY_DESK.map((item) => {
                const tier = TIERS.find((t) => t.id === item.tier);
                return (
                  <div key={item.id} className="p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <span className="text-lg shrink-0">{tier?.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{item.title}</p>
                        <p className="text-[11px] text-muted-foreground">{item.source} · Tier {item.tier}</p>
                        {item.warning && (
                          <div className="mt-2 flex items-start gap-2 p-2 rounded-md border border-destructive/40 bg-destructive/10">
                            <ShieldAlert className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
                            <p className="text-[11px] text-destructive-foreground/90">{item.warningText}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

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
