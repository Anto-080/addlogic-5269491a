import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, TrendingUp, Shield, Users, Infinity as InfinityIcon } from "lucide-react";
import circularGlobe from "@/assets/circular-economy-globe.jpg";

const CURRENT_LEVEL = 23;
const CIRCULAR_UNLOCK = 100;

export default function Investments() {
  const circularUnlocked = CURRENT_LEVEL >= CIRCULAR_UNLOCK;
  const circularPct = Math.min(100, (CURRENT_LEVEL / CIRCULAR_UNLOCK) * 100);

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Investment Phase</h1>
          <p className="text-sm text-muted-foreground">Unlock by reaching higher experience levels.</p>
        </div>

        <Card className="bg-card border-border/50 glow-amber">
          <CardContent className="p-8 text-center space-y-4">
            <Lock className="h-16 w-16 text-primary/40 mx-auto" />
            <h2 className="text-xl font-bold text-foreground">Level 50 Required</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              The Investment Phase unlocks at Level 50. Keep researching to gain experience.
              Your current level: <span className="text-primary font-bold">{CURRENT_LEVEL}</span>
            </p>
            <div className="w-full bg-secondary/50 rounded-full h-3 max-w-xs mx-auto">
              <div className="h-3 rounded-full bg-primary/60" style={{ width: "46%" }} />
            </div>
            <p className="text-xs text-muted-foreground">{CURRENT_LEVEL} / 50 — 46% to unlock</p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { icon: TrendingUp, title: "Stablecoin Staking", desc: "Deposit earnings into staking pools. Earn passive yield while stabilizing the platform's transaction flow. Delta-neutral strategies minimize risk." },
            { icon: Users, title: "Collective Investment Pools", desc: "Join community pools funded by researcher earnings and private investors. Access institutional-grade passive strategies." },
            { icon: Shield, title: "Sector-Based Investing", desc: "Invest in companies matching your research tier. Top-tier researchers can back breakthroughs in their area of expertise." },
            { icon: Lock, title: "Circular Economy Model", desc: "Companies pay for your research attention → you invest back → companies grow → more ad revenue → everyone benefits." },
          ].map((item) => (
            <Card key={item.title} className="bg-card border-border/50 opacity-60">
              <CardContent className="p-4">
                <item.icon className="h-8 w-8 text-primary/30 mb-3" />
                <h3 className="text-sm font-semibold text-foreground mb-1">{item.title}</h3>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Phase 4 — Circular Economy Investment Class (Level 100) */}
        <Card className="bg-card border-border/50 overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <InfinityIcon className={`h-5 w-5 ${circularUnlocked ? "text-[hsl(220_85%_60%)]" : "text-muted-foreground"}`} />
                Circular Economy Class
              </span>
              <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${circularUnlocked ? "bg-[hsl(220_85%_52%)]/20 text-[hsl(220_85%_70%)]" : "bg-secondary text-muted-foreground"}`}>
                {circularUnlocked ? "ACTIVE" : `LEVEL ${CIRCULAR_UNLOCK} REQUIRED`}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Infinity Banner */}
            <div className={`relative rounded-xl p-8 flex items-center justify-center ${circularUnlocked ? "infinity-active" : "infinity-locked"}`}>
              <svg viewBox="0 0 200 80" className="w-48 h-20" aria-hidden>
                <path
                  d="M50 40 C50 18, 90 18, 100 40 C110 62, 150 62, 150 40 C150 18, 110 18, 100 40 C90 62, 50 62, 50 40 Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
              </svg>
              {!circularUnlocked && (
                <Lock className="absolute h-6 w-6 text-muted-foreground/70" />
              )}
            </div>

            <p className="text-xs text-muted-foreground text-center">
              {circularUnlocked
                ? "The infinite loop is live. Earnings cycle continuously between researchers and sponsors."
                : `Unlocks at Level ${CIRCULAR_UNLOCK}. Currently ${CURRENT_LEVEL} / ${CIRCULAR_UNLOCK} (${circularPct.toFixed(0)}%).`}
            </p>
            <div className="w-full bg-secondary/50 rounded-full h-2 max-w-xs mx-auto">
              <div
                className="h-2 rounded-full"
                style={{
                  width: `${circularPct}%`,
                  background: circularUnlocked ? "hsl(220 85% 52%)" : "hsl(220 30% 35%)",
                }}
              />
            </div>

            {/* Globe-with-arrows visual */}
            <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-5 items-center pt-2">
              <img
                src={circularGlobe}
                alt="Stylized globe surrounded by arrows forming a closed loop, symbolizing circular economy"
                width={1024}
                height={1024}
                loading="lazy"
                className={`w-full rounded-lg border border-border/50 ${circularUnlocked ? "" : "opacity-50 grayscale"}`}
              />
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">Full-Circle Sponsor ↔ Researcher Loop</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Sponsors pay for researcher attention → researchers reinvest earnings into sponsor companies →
                  companies grow → ad budgets expand → researcher rewards rise. A self-reinforcing loop where the
                  industrial complex and the public researcher base build direct, fully circular relationships.
                </p>
                <p className="text-[11px] text-muted-foreground/80 italic">
                  At Level {CIRCULAR_UNLOCK} the banner ignites in azure (#1D5DEC) — signaling the loop is closed and active.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
