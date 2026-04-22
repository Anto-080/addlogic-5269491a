import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { AppLayout } from "@/components/AppLayout";
import { MOCK_EARNINGS, MOCK_MILESTONES, TIERS, DAILY_DESK } from "@/lib/mockData";
import { useState, useEffect } from "react";
import { Zap, Star, ShieldAlert, Newspaper, Tag } from "lucide-react";
import { HexDollar } from "@/components/icons/HexDollar";
import { SandglassIcon } from "@/components/icons/SandglassIcon";
import { ClockIcon } from "@/components/icons/ClockIcon";
import { useSettings } from "@/contexts/SettingsContext";
import { TierIcon } from "@/components/TierIcon";

function AnimatedCounter({ target }: { target: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const step = target / 40;
    const interval = setInterval(() => {
      setVal((v) => { const next = v + step; return next >= target ? target : next; });
    }, 30);
    return () => clearInterval(interval);
  }, [target]);
  return <span>${val.toFixed(2)}</span>;
}

export default function Dashboard() {
  const { cookieAutoAccept, gpsPrecision, setCookieAutoAccept, setGpsPrecision } = useSettings();
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
  const multPercent = ((liveMultiplier - 0.5) / (10 - 0.5)) * 100;
  const primaryTier = TIERS[3];

  const summary = [
    { label: "Today",     value: MOCK_EARNINGS.today,    Icon: SandglassIcon },
    { label: "This Week", value: MOCK_EARNINGS.thisWeek, Icon: ClockIcon },
    { label: "All Time",  value: MOCK_EARNINGS.allTime,  Icon: HexDollar },
  ];

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Your research hub — keep exploring, keep earning.</p>
        </div>

        {/* Earnings Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {summary.map((item) => (
            <Card key={item.label} className="bg-card border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="text-2xl font-bold text-money">
                      <AnimatedCounter target={item.value} />
                    </p>
                  </div>
                  <item.Icon size={32} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Experience + Multiplier Bars */}
        <Card className="bg-card border-border/50 glow-amber">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-5 w-5 text-money" />
              Experience Level {MOCK_EARNINGS.level}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{Math.floor(liveXp).toLocaleString()} / {MOCK_EARNINGS.xpToNext.toLocaleString()} XP</span>
              <span className="text-foreground/80 font-medium">{xpPercent.toFixed(1)}%</span>
            </div>
            <div className="relative h-4 w-full overflow-hidden rounded-full bg-secondary/60">
              <div className="xp-fluid h-full transition-[width] duration-700 ease-out" style={{ width: `${xpPercent}%` }} />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">Active Multiplier</span>
                <span className="font-semibold" style={{ color: "hsl(348 83% 60%)" }}>
                  x{liveMultiplier.toFixed(2)} · range 0.5× – 10×
                </span>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary/40">
                <div className="multiplier-fluid h-full transition-[width] duration-700 ease-out" style={{ width: `${multPercent}%` }} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              XP grows by <span className="text-foreground/90 font-medium">time × tier multiplier</span>. The crimson bar reflects your current tier multiplier — fills to max at the top tier (10×), minimum on Adult content (0.5×).
            </p>
          </CardContent>
        </Card>

        {/* Data Analysis Permissions */}
        <Card className="bg-card border-border/50 glow-amber">
          <CardContent className="p-4 space-y-4">
            <p className="text-sm font-semibold text-foreground">Data Analysis Permissions</p>

            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="shrink-0 mt-0.5">
                  <svg viewBox="0 0 32 32" width="36" height="36" aria-label="Cookie">
                    <circle cx="16" cy="16" r="13" fill={cookieAutoAccept ? "#004627" : "hsl(var(--secondary))"} stroke="hsl(var(--border))" strokeWidth="1.5" />
                    <circle cx="11" cy="12" r="1.6" fill="#9A7246" opacity={cookieAutoAccept ? 1 : 0.4} />
                    <circle cx="20" cy="11" r="1.2" fill="#9A7246" opacity={cookieAutoAccept ? 1 : 0.4} />
                    <circle cx="22" cy="18" r="1.6" fill="#9A7246" opacity={cookieAutoAccept ? 1 : 0.4} />
                    <circle cx="13" cy="20" r="1.3" fill="#9A7246" opacity={cookieAutoAccept ? 1 : 0.4} />
                    <circle cx="18" cy="22" r="1.1" fill="#9A7246" opacity={cookieAutoAccept ? 1 : 0.4} />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Cookie Auto-Accept &amp; Profile Sync</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Activates two-way cookie handling: <strong className="text-foreground/90">retrieves first-, third-party
                    and commercial cookies</strong> already on your device to map your dominant interests, and
                    <strong className="text-foreground/90"> auto-accepts every cookie banner</strong> while you browse
                    inside the in-app Opera WebView. Powers ad-hoc, retributed advertising tailored to what you actually
                    care about — required for the rewards engine to function.
                  </p>
                </div>
              </div>
              <Switch checked={cookieAutoAccept} onCheckedChange={setCookieAutoAccept} data-emerald="true" />
            </div>

            <div className="border-t border-border/40" />

            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="shrink-0 mt-0.5">
                  <svg viewBox="0 0 32 32" width="36" height="36" aria-label="GPS pin">
                    <path d="M16 3 C10 3 6 7 6 13 C6 20 16 29 16 29 C16 29 26 20 26 13 C26 7 22 3 16 3 Z" fill={gpsPrecision ? "#004627" : "hsl(var(--secondary))"} stroke="hsl(var(--border))" strokeWidth="1.5" />
                    <circle cx="16" cy="13" r="4" fill={gpsPrecision ? "#9A7246" : "hsl(var(--muted-foreground))"} />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">GPS &amp; Anonymous Device Analytics</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Beyond live location, this unlocks the anonymous device-side signals cookies cannot see —
                    <strong className="text-foreground/90"> handset model, OS, screen, locale, daily active-usage
                    pattern, network type</strong>. Combined with the cookie sync above, it produces a non-PII profile
                    used to match you to higher-paying regional ads and the Regional Coupons feed below.
                  </p>
                </div>
              </div>
              <Switch checked={gpsPrecision} onCheckedChange={setGpsPrecision} data-emerald="true" />
            </div>
          </CardContent>
        </Card>

        {gpsPrecision && (
          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Tag className="h-5 w-5 text-money" /> Regional Coupons
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { brand: "GreenLeaf Café", offer: "20% off espresso", dist: "0.4 km" },
                  { brand: "MetroBooks", offer: "Buy 2 get 1 free — science", dist: "1.1 km" },
                  { brand: "EcoMart", offer: "$5 off bulk produce", dist: "2.0 km" },
                  { brand: "FitLab Gym", offer: "First week free trial", dist: "2.6 km" },
                ].map((c) => (
                  <div key={c.brand} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                    <div>
                      <p className="text-sm font-medium text-foreground">{c.brand}</p>
                      <p className="text-xs text-muted-foreground">{c.offer}</p>
                    </div>
                    <span className="text-[10px] text-money font-medium">{c.dist}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-card border-border/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div style={{ color: primaryTier.color }}><TierIcon tierId={primaryTier.id} size={32} /></div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Primary Research Tier</p>
              <p className="text-sm font-semibold text-foreground">{primaryTier.name}</p>
              <p className="text-xs text-foreground/70">x{primaryTier.multiplier} earning multiplier</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Newspaper className="h-5 w-5 text-money" />
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
                      <span className="shrink-0" style={{ color: tier?.color }}>{tier && <TierIcon tierId={tier.id} size={20} />}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{item.title}</p>
                        <p className="text-[11px] text-muted-foreground">{item.source}</p>
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
                      <span style={{ color: tier?.color }}>{tier && <TierIcon tierId={tier.id} size={22} />}</span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{m.title}</p>
                        <p className="text-xs text-muted-foreground">{m.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-money">${m.earned.toFixed(2)}</p>
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
