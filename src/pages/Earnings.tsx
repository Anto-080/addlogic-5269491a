import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { TIERS } from "@/lib/mockData";
import { useUserStats, useWeeklyEarnings } from "@/hooks/useAppData";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { ArrowUpRight, Wallet, ShieldCheck, TrendingUp, ChevronDown } from "lucide-react";
import { RoundVault } from "@/components/icons/RoundVault";
import { StablecoinWithdraw } from "@/components/StablecoinWithdraw";

import { TierIcon } from "@/components/TierIcon";
import { NavLink } from "react-router-dom";

import timeCoinMedallion from "@/assets/time-coin-medallion.jpeg";

const VAULT_GOLD = "#B0903D";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Earnings() {
  const { data: stats } = useUserStats();
  const { data: weekly = [] } = useWeeklyEarnings();
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const earningsToday = stats?.earnings_today ?? 0;
  const earningsWeek = stats?.earnings_week ?? 0;
  const earningsAllTime = stats?.earnings_all_time ?? 0;
  const streak = stats?.active_streak ?? 0;

  // Pad weekly chart with zeros for missing days so the bar chart always has 7 entries
  const weekChart = (() => {
    const map = new Map(weekly.map((w) => [w.day, w.amount]));
    const out: { day: string; amount: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      out.push({ day: DAY_LABELS[d.getDay()], amount: map.get(key) ?? 0 });
    }
    return out;
  })();

  // Per-tier earnings ledger is not wired yet; show real data only when present.
  const tierEarnings: { tierId: number; color: string; tier: string; earned: number; redistribution: number }[] = [];

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto font-typewriter">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <RoundVault size={26} style={{ color: VAULT_GOLD }} /> Vault &amp; Earnings
          </h1>
          <p className="text-sm text-muted-foreground">
            AddLogic doesn't pay per click or per ad watched — it rewards you for your <strong>Time &amp; Experience</strong>.
          </p>
        </div>

        {/* Vault explainer — Time-Coins narrative */}
        <Card className="bg-card border-border/50 glow-amber">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-start gap-3">
              <RoundVault size={26} style={{ color: VAULT_GOLD }} className="mt-0.5 shrink-0" />
              <div className="flex-1 space-y-2">
                <p className="text-sm font-semibold text-foreground">In-app Vault, Time-Coins &amp; Experience</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Ad revenue across all tiers is pooled and redistributed by tier importance into{" "}
                  <strong className="text-foreground">Time-Coins</strong> <em>and</em>{" "}
                  <strong className="text-foreground">Experience</strong> — your in-app tokenised balance
                  and progression earned for the time you spend researching.{" "}
                  <strong className="text-foreground">Withdraw at any Time</strong> by redeeming{" "}
                  <strong className="text-foreground">Time-Coins &amp; Experience</strong> for Stablecoins
                  via <strong className="text-foreground">MiniPay</strong>, or convert to local currency
                  via <strong className="text-foreground">Google Wallet</strong>.
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                  Test the withdrawal flow with small transactions while you build your Time-Coin balance
                  alongside your main Experience bar. From <strong className="not-italic text-foreground">Level 25</strong>{" "}
                  you'll be granted experience-based research grants without depleting the bar you worked
                  for. At Investment Level, tailored zero-risk passive plans let your earnings compound on
                  their own. — <em>Keep researching what you love.</em>
                </p>
              </div>
            </div>

            <div className="flex justify-center">
              <a
                href="https://www.kiln.fi/post/kiln-powers-stablecoin-earn-product-for-minipay-users-on-celo-targeting-1-3b-unbanked-globally"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-full bg-secondary/60 border border-border/40 text-foreground/80 hover:text-primary hover:border-primary/40 transition-colors"
              >
                <ShieldCheck className="h-3 w-3" /> Secured by Kiln Vault Provider
              </a>
            </div>

            {/* Time-Coin medallion + Franklin quote — full-width centered */}
            <div className="flex flex-col items-center justify-center gap-2 pt-1 w-full">
              <img
                src={timeCoinMedallion}
                alt="Time-Coin medallion"
                className="rounded-full shadow-lg"
                style={{ maxWidth: 240, width: "100%", height: "auto" }}
                draggable={false}
              />
              <p
                className="text-sm text-foreground/90 text-center"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic" }}
              >
                "Time Is Money"
                <br />
                <span className="text-xs text-muted-foreground">— Benjamin Franklin · The Free Thinker</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Today", value: earningsToday },
            { label: "This Week", value: earningsWeek },
            { label: "All Time", value: earningsAllTime },
            { label: "Streak Bonus", value: streak * 0.5 },
          ].map((item) => (
            <Card key={item.label} className="bg-card border-border/50">
              <CardContent className="p-3 text-center">
                <p className="text-[10px] text-muted-foreground">{item.label}</p>
                <p className="text-xl font-bold text-money inline-flex items-center gap-1 justify-center">
                  <span>T${item.value.toFixed(2)}</span>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Weekly Chart */}
        <Card className="bg-card border-border/50">
          <CardHeader><CardTitle className="text-base">Weekly Earnings</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weekChart}>
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
            {tierEarnings.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                No redistribution data yet — start researching to populate your per-tier ledger.
              </p>
            ) : tierEarnings.map((t, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-8 flex justify-center" style={{ color: t.color }}><TierIcon tierId={t.tierId} size={20} /></span>
                <div className="flex-1">
                  <div className="flex gap-1 h-4">
                    <div className="bg-money rounded-sm" style={{ width: `${(t.earned / 250) * 100}%` }} />
                    <div className="bg-crimson/60 rounded-sm" style={{ width: `${(t.redistribution / 250) * 100}%` }} />
                  </div>
                </div>
                <span className="text-xs text-money w-16 text-right">T${t.earned.toFixed(0)}</span>
                <span className="text-xs text-crimson w-12 text-right">+T${t.redistribution.toFixed(0)}</span>
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
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center justify-between gap-3">
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
            </div>
            <div className="text-[11px] bg-secondary/40 rounded-md px-3 py-2 text-foreground/80 leading-relaxed text-center font-mono">
              <span className="inline-flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 max-w-full">
                <span>Research Your Interests</span>
                <span className="text-money">→</span>
                <span>Earn Time-Coins</span>
                <span className="text-money">→</span>
                <span>In-Vault Staking</span>
                <span className="text-money">→</span>
                <span>Yield Stablecoin</span>
                <span className="text-money">↺</span>
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Withdraw */}
        <Card className="bg-card border-border/50 glow-amber">
          <Collapsible open={withdrawOpen} onOpenChange={setWithdrawOpen}>
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <RoundVault size={32} style={{ color: VAULT_GOLD }} />
                <div>
                  <p className="text-lg font-bold text-money inline-flex items-center gap-1">
                    <span>T${earningsAllTime.toFixed(2)}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">Time-Coin balance — redeem to withdraw</p>
                </div>
              </div>
              <CollapsibleTrigger asChild>
                <Button className="bg-money hover:bg-money/90 text-white gap-2">
                  <Wallet className="h-4 w-4" />
                  Withdraw
                  <ChevronDown className={`h-4 w-4 transition-transform ${withdrawOpen ? "rotate-180" : ""}`} />
                </Button>
              </CollapsibleTrigger>
            </CardContent>
            <CollapsibleContent>
              <div className="px-6 pb-6 -mt-2 border-t border-border/40 pt-4 space-y-3 text-xs text-foreground/85 leading-relaxed">
                <p className="text-foreground/90 font-semibold">
                  Withdraws have Limits Based upon both your Experience Level and Regional Financial Limits on the Base of:
                </p>
                <div className="space-y-3">
                  <p>
                    <span className="text-money font-semibold">• Non-Declarable Small Compensation:</span> Up to and not above{" "}
                    <strong className="text-foreground">$50/Month till Level 25</strong>. Credit accumulated above that threshold will always remain available on site in the User Account Vault. Stored earnings will start generating a small yearly passive yield from <strong className="text-foreground">Level 15</strong>.
                  </p>
                  <p>
                    <span className="text-money font-semibold">• Interest Based Grants:</span> From <strong className="text-foreground">Level 25 beyond</strong>, AI-overviewed Grants specific for users' main personal interests will be released gradually from the accumulated credit stored in Vault, while new users will be able to experience the same broad network gain experienced users already were allowed as beginners. Grant amounts will mature Gradually alongside with Experience.
                  </p>
                  <p>
                    <span className="text-money font-semibold">• Currency &amp; Cryptocurrency Maximal for Non-Ulterior Reporting Limits in face of AML Laws &amp; Inflationary Risks:</span> Top-Level withdrawal for most skilled Researchers which focused on Increasing their Main Interests Tier-Specific's Experience will reach but not surpass the Equivalent Value of{" "}
                    <strong className="text-foreground">≤$10,000/Year</strong>.
                  </p>
                  <p className="italic" style={{ color: "hsl(0 72% 45%)" }}>
                    &#123; All AI-Signalled: Undue Traffic, Ads Click-Hoarding, or Lack of Genuine Interest for a Researched Topic, would bring to the Partial or Total Seizing of Vaulted Earnings.
                    <br />
                    <br />
                    Research what Makes yourself what you Truly Are in Respect of Other, or Face Consequences for having attempted to Fraud the Community. &#125;
                  </p>
                  <p>
                    <span className="text-money font-semibold">• Vaulted Earnings Above Withdrawal Threshold:</span> All ulterior Vaulted earnings will be stored indefinitely as user's personal on-site credit balance, used first as Partial-Convertible-Value for product purchasing (on Amazon, eBay) regarding sector-specific interests, and secondly in the Investment Phase — loading as passive-yield-generating DeFi secured investments with safety-margin insurance from our side. Yearly, the 4 Seasons Tourism Sector will open, revealing available offers enabling users to purchase with their own money: Offers, Tickets, Bidding for the Rent of Exclusive Locations with Small percentage of Chartered Expenses adjuvanted with the Time-Coins Balance.
                  </p>

                  <p>
                    <span className="text-money font-semibold">• Financial Phase:</span> Beyond the site's main Earn-to-Learn potential, users will be able to invest their own money safely alongside their vaulted credit thanks to <strong className="text-foreground">Kiln Financial Services</strong>. All real-world users investments from their own pocket will be withdrawable at any time without any limitations, except for the Limits/Controls associated with Anti Money Laundering the Financial Service Require to Operate Legally.
                  </p>
                  <p>
                    <span className="text-money font-semibold">• Circular Economy:</span> In the last phase of the user's experience climb, contact facilitation between users' favourite companies from their main experience tier will enable exclusive early access, ideas development, and subsequent job opportunities — other than personal investments in what they genuinely love more.
                  </p>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        

        <StablecoinWithdraw available={earningsAllTime} />
      </div>
    </AppLayout>
  );
}
