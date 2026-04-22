import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { TrendingUp, Shield, Users, ChevronDown } from "lucide-react";
import workInProgressImg from "@/assets/work-in-progress.png";
import infinityBanner from "@/assets/infinity-banner.jpg";
import { DiaSeal } from "@/components/icons/DiaSeal";
import { MOCK_USER } from "@/lib/mockData";

const CIRCULAR_UNLOCK = 100;
const INVESTMENT_UNLOCK = 50;

export default function Investments() {
  const userLevel = MOCK_USER.level;
  const [simulateL100, setSimulateL100] = useState(false);
  const circularUnlocked = userLevel >= CIRCULAR_UNLOCK || simulateL100;
  const circularPct = Math.min(100, (userLevel / CIRCULAR_UNLOCK) * 100);
  const investPct = Math.min(100, (userLevel / INVESTMENT_UNLOCK) * 100);

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Investment Phase</h1>
          <p className="text-sm text-muted-foreground">Unlock by reaching higher experience levels.</p>
        </div>

        {/* Level 50 gate — Work In Progress sign */}
        <Card className="bg-card border-border/50 glow-amber">
          <CardContent className="p-8 text-center space-y-4">
            <img
              src={workInProgressImg}
              alt="Work in progress — feature locked"
              className="h-32 sm:h-40 w-auto mx-auto object-contain"
            />
            <h2 className="text-xl font-bold text-foreground">Level {INVESTMENT_UNLOCK} Required</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              The Investment Phase unlocks at Level {INVESTMENT_UNLOCK}. Keep researching to gain experience.
              Your current level: <span className="text-money font-bold">{userLevel}</span>
            </p>
            <div className="w-full bg-secondary/50 rounded-full h-3 max-w-xs mx-auto">
              <div className="h-3 rounded-full bg-money" style={{ width: `${investPct}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">{userLevel} / {INVESTMENT_UNLOCK} — {investPct.toFixed(0)}% to unlock</p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { icon: TrendingUp, title: "Stablecoin Staking", desc: "Deposit earnings into staking pools. Earn passive yield while stabilizing the platform's transaction flow. Delta-neutral strategies minimize risk." },
            { icon: Users, title: "Collective Investment Pools", desc: "Join community pools funded by researcher earnings and private investors. Access institutional-grade passive strategies." },
            { icon: Shield, title: "Sector-Based Investing", desc: "Invest in companies matching your research tier. Top-tier researchers can back breakthroughs in their area of expertise." },
          ].map((item) => (
            <Card key={item.title} className="bg-card border-border/50 opacity-60">
              <CardContent className="p-4">
                <item.icon className="h-8 w-8 text-money/60 mb-3" />
                <h3 className="text-sm font-semibold text-foreground mb-1">{item.title}</h3>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Phase 4 — Circular Economy Investment Class (Level 100) — collapsible */}
        <Card
          className="border-border/50 overflow-hidden transition-colors"
          style={circularUnlocked ? { backgroundColor: "#D1DEFB" } : undefined}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2 text-foreground">
                <ChevronDown className={`h-4 w-4 transition-transform ${circularUnlocked ? "rotate-0" : "-rotate-90"} ${circularUnlocked ? "text-[#0E2A47]" : "text-muted-foreground"}`} />
                <span className={circularUnlocked ? "text-[#0E2A47]" : ""}>Circular Economy Class</span>
              </span>
              <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${circularUnlocked ? "bg-[#00BFFF]/30 text-[#0E2A47]" : "bg-secondary text-muted-foreground"}`}>
                {circularUnlocked ? "ACTIVE" : `LEVEL ${CIRCULAR_UNLOCK} REQUIRED`}
              </span>
            </CardTitle>
          </CardHeader>

          {!circularUnlocked ? (
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4 p-3 rounded-lg" style={{ backgroundColor: "#E5C10010", borderLeft: "4px solid #E5C100" }}>
                <img src={workInProgressImg} alt="Work in progress" className="h-16 w-16 object-contain shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Locked until Level {CIRCULAR_UNLOCK}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Currently {userLevel} / {CIRCULAR_UNLOCK} ({circularPct.toFixed(0)}%). The Circular Economy class
                    activates when the user reaches Level {CIRCULAR_UNLOCK}.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-muted-foreground">Dev: Simulate Level 100 (preview only)</span>
                <Switch checked={simulateL100} onCheckedChange={setSimulateL100} />
              </div>
            </CardContent>
          ) : (
            <CardContent className="space-y-5" style={{ color: "#0E2A47" }}>
              {/* Infinity light-trail banner */}
              <div className="rounded-xl overflow-hidden border" style={{ borderColor: "#0E2A47" }}>
                <img
                  src={infinityBanner}
                  alt="Infinity light-trail symbolising the closed loop"
                  className="w-full h-32 sm:h-40 object-cover"
                  loading="lazy"
                />
              </div>

              <p className="text-xs text-center" style={{ color: "#0E2A47" }}>
                The infinite loop is live. Earnings cycle continuously between researchers and sponsors.
              </p>

              {/* DIA-style seal */}
              <div className="flex flex-col sm:flex-row gap-5 items-center pt-2">
                <DiaSeal size={180} className="shrink-0" />
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold" style={{ color: "#0E2A47" }}>
                    Direct Companies ↔ Most-Experienced Users Loop
                  </h3>
                  <p className="text-xs leading-relaxed" style={{ color: "#0E2A47" }}>
                    Direct interactions between Companies and Most Experienced Users will be not only promoted but
                    facilitated. Users' ideas will be prompted as new concepts to already established industrial
                    complexes; the best ideas will be not only chosen but retributed and offered a working position
                    inside the finest companies worldwide. Companies will be shown how the users'
                    knowledge-development will push clients to reinvest in their favourite companies in the safest,
                    most fluctuation-stable, and most remunerative ways possible — for both the users and the
                    companies.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs px-1 pt-2 border-t" style={{ borderColor: "#0E2A47" }}>
                <span style={{ color: "#0E2A47" }}>Dev: Simulate Level 100</span>
                <Switch checked={simulateL100} onCheckedChange={setSimulateL100} />
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
