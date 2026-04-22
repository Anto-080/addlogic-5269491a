import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MOCK_EARNINGS, MOCK_WEEKLY_EARNINGS, TIERS } from "@/lib/mockData";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { ArrowUpRight, Wallet, ShieldCheck, TrendingUp } from "lucide-react";
import { RoundVault } from "@/components/icons/RoundVault";
import { StablecoinWithdraw } from "@/components/StablecoinWithdraw";
import { TierIcon } from "@/components/TierIcon";
import { NavLink } from "react-router-dom";

const VAULT_GOLD = "#B0903D";

export default function Earnings() {
  const tierEarnings = TIERS.slice(0, 6).map((t) => ({
    tierId: t.id,
    color: t.color,
    tier: t.name,
    earned: Math.random() * 200 + 50,
    redistribution: Math.random() * 40,
  }));

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <RoundVault size={26} style={{ color: VAULT_GOLD }} /> Vault & Earnings
          </h1>
          <p className="text-sm text-muted-foreground">Earnings accumulate securely in-app — withdraw anytime to MiniPay or Google Wallet.</p>
        </div>

        {/* Vault explainer */}
        <Card className="bg-card border-border/50 glow-amber">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <RoundVault size={26} style={{ color: VAULT_GOLD }} className="mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">In-app Vault</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Your ad revenue is stored securely in-app and protected from third-party threats. Withdraw to MiniPay or Google Wallet
                  at any moment. In later phases, the Vault enables an automatic restake loop:
                </p>
                <pre className="mt-2 text-[11px] bg-secondary/40 rounded-md p-2 text-foreground/80 overflow-x-auto">
{`Ads → Stake → Yield → Stablecoin ↺`}
                </pre>
              </div>
            </div>
            <a
              href="https://www.kiln.fi/post/kiln-powers-stablecoin-earn-product-for-minipay-users-on-celo-targeting-1-3b-unbanked-globally"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-full bg-secondary/60 border border-border/40 text-foreground/80 hover:text-primary hover:border-primary/40 transition-colors"
            >
              <ShieldCheck className="h-3 w-3" /> Secured by Kiln Vault Provider
            </a>
          </CardContent>
        </Card>

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
                <p className="text-xl font-bold text-money">${item.value.toFixed(2)}</p>
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
                <Bar dataKey="amount" fill="#9A7246" radius={[4, 4, 0, 0]} />
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
                <span className="w-8 flex justify-center" style={{ color: t.color }}><TierIcon tierId={t.tierId} size={20} /></span>
                <div className="flex-1">
                  <div className="flex gap-1 h-4">
                    <div className="bg-money rounded-sm" style={{ width: `${(t.earned / 250) * 100}%` }} />
                    <div className="bg-crimson/60 rounded-sm" style={{ width: `${(t.redistribution / 250) * 100}%` }} />
                  </div>
                </div>
                <span className="text-xs text-money w-16 text-right">${t.earned.toFixed(0)}</span>
                <span className="text-xs text-crimson w-12 text-right">+${t.redistribution.toFixed(0)}</span>
              </div>
            ))}
            <div className="flex gap-4 text-xs text-muted-foreground mt-2">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-money" /> Direct</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-crimson/60" /> Redistribution</span>
            </div>
          </CardContent>
        </Card>

        {/* Investments CTA — placed BEFORE the Withdraw card */}
        <Card className="bg-card border-border/50 glow-amber">
          <CardContent className="p-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <TrendingUp className="h-7 w-7 shrink-0" style={{ color: VAULT_GOLD }} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">Stake your Stablecoins Safely</p>
                <p className="text-xs text-muted-foreground">Multiply your earnings passively while your Vault sleeps.</p>
              </div>
            </div>
            <Button asChild className="bg-money hover:bg-money/90 text-white shrink-0 gap-2">
              <NavLink to="/investments">
                Invest <ArrowUpRight className="h-4 w-4" />
              </NavLink>
            </Button>
          </CardContent>
        </Card>

        {/* Withdraw */}
        <Card className="bg-card border-border/50 glow-amber">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <RoundVault size={32} style={{ color: VAULT_GOLD }} />
              <div>
                <p className="text-lg font-bold text-money">${MOCK_EARNINGS.allTime.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Vault balance — available for withdrawal</p>
              </div>
            </div>
            <Button className="bg-money hover:bg-money/90 text-white gap-2">
              <Wallet className="h-4 w-4" />
              Withdraw
            </Button>
          </CardContent>
        </Card>

        <StablecoinWithdraw available={MOCK_EARNINGS.allTime} />
      </div>
    </AppLayout>
  );
}
