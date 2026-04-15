import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MOCK_EARNINGS, MOCK_WEEKLY_EARNINGS, TIERS } from "@/lib/mockData";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { ArrowUpRight, Wallet, TrendingUp } from "lucide-react";

export default function Earnings() {
  const tierEarnings = TIERS.slice(0, 6).map((t) => ({
    name: t.icon,
    tier: t.name,
    earned: Math.random() * 200 + 50,
    redistribution: Math.random() * 40,
  }));

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Earnings & Wallet</h1>
          <p className="text-sm text-muted-foreground">Track your research income and see how redistribution works.</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Today", value: MOCK_EARNINGS.today },
            { label: "This Week", value: MOCK_EARNINGS.thisWeek },
            { label: "All Time", value: MOCK_EARNINGS.allTime },
            { label: "Streak Bonus", value: MOCK_EARNINGS.activeStreak * 0.5 },
          ].map((item) => (
            <Card key={item.label} className="bg-card border-border/50">
              <CardContent className="p-3 text-center">
                <p className="text-[10px] text-muted-foreground">{item.label}</p>
                <p className="text-xl font-bold text-gradient-gold">${item.value.toFixed(2)}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Weekly Chart */}
        <Card className="bg-card border-border/50">
          <CardHeader><CardTitle className="text-base">Weekly Earnings</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={MOCK_WEEKLY_EARNINGS}>
                <XAxis dataKey="day" tick={{ fill: "hsl(150, 10%, 55%)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(150, 10%, 55%)", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={{ background: "hsl(150, 40%, 6%)", border: "1px solid hsl(150, 15%, 14%)", borderRadius: "8px", color: "hsl(140, 20%, 90%)" }} />
                <Bar dataKey="amount" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Redistribution */}
        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5 text-crimson" />
              Redistribution Flow
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Lower-tier ad revenue partially flows to higher-tier researchers. Even casual browsing supports life-saving research.
            </p>
            {tierEarnings.map((t, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xl w-8 text-center">{t.name}</span>
                <div className="flex-1">
                  <div className="flex gap-1 h-4">
                    <div className="bg-primary/80 rounded-sm" style={{ width: `${(t.earned / 250) * 100}%` }} />
                    <div className="bg-crimson/60 rounded-sm" style={{ width: `${(t.redistribution / 250) * 100}%` }} />
                  </div>
                </div>
                <span className="text-xs text-foreground w-16 text-right">${t.earned.toFixed(0)}</span>
                <span className="text-xs text-crimson w-12 text-right">+${t.redistribution.toFixed(0)}</span>
              </div>
            ))}
            <div className="flex gap-4 text-xs text-muted-foreground mt-2">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-primary/80" /> Direct</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-crimson/60" /> Redistribution</span>
            </div>
          </CardContent>
        </Card>

        {/* Withdraw */}
        <Card className="bg-card border-border/50 glow-amber">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wallet className="h-8 w-8 text-primary" />
              <div>
                <p className="text-lg font-bold text-foreground">${MOCK_EARNINGS.allTime.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Available for withdrawal</p>
              </div>
            </div>
            <Button className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Withdraw
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
