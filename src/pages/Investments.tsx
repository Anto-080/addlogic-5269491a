import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, TrendingUp, Shield, Users, Infinity as InfinityIcon } from "lucide-react";

const CURRENT_LEVEL = 23;
const CIRCULAR_UNLOCK = 100;

// 8-bit pixel-art globe with 4 orbiting arrows
function PixelGlobe({ active }: { active: boolean }) {
  const color = active ? "#1D5DEC" : "hsl(220 15% 45%)";
  const land = active ? "#0E3FA8" : "hsl(220 12% 30%)";
  // 12x12 grid, cell = 10px → 120x120
  const C = 10;
  // simple circle mask + continent blocks
  const ocean = [
    [3,1],[4,1],[5,1],[6,1],[7,1],[8,1],
    [2,2],[9,2],
    [1,3],[10,3],
    [1,4],[10,4],
    [0,5],[11,5],
    [0,6],[11,6],
    [1,7],[10,7],
    [1,8],[10,8],
    [2,9],[9,9],
    [3,10],[4,10],[5,10],[6,10],[7,10],[8,10],
  ];
  const oceanFill = [
    [2,3],[3,3],[4,3],[5,3],[6,3],[7,3],[8,3],[9,3],
    [2,4],[3,4],[4,4],[5,4],[6,4],[7,4],[8,4],[9,4],
    [1,5],[2,5],[3,5],[4,5],[5,5],[6,5],[7,5],[8,5],[9,5],[10,5],
    [1,6],[2,6],[3,6],[4,6],[5,6],[6,6],[7,6],[8,6],[9,6],[10,6],
    [2,7],[3,7],[4,7],[5,7],[6,7],[7,7],[8,7],[9,7],
    [2,8],[3,8],[4,8],[5,8],[6,8],[7,8],[8,8],[9,8],
    [3,9],[4,9],[5,9],[6,9],[7,9],[8,9],
  ];
  const continents = [
    [3,3],[4,3],[7,3],[8,3],
    [3,4],[8,4],[9,4],
    [2,5],[3,5],[7,5],
    [4,6],[5,6],[8,6],[9,6],
    [3,7],[4,7],[7,7],[8,7],
    [4,8],[5,8],[6,8],
    [5,9],
  ];
  return (
    <svg viewBox="0 0 200 200" width="160" height="160" shapeRendering="crispEdges" aria-hidden>
      {/* globe centered at 60..180 (offset 40) */}
      <g transform="translate(40 40)">
        {ocean.map(([x,y], i) => <rect key={`o${i}`} x={x*C} y={y*C} width={C} height={C} fill={color} />)}
        {oceanFill.map(([x,y], i) => <rect key={`f${i}`} x={x*C} y={y*C} width={C} height={C} fill={color} opacity={active ? 0.5 : 0.35} />)}
        {continents.map(([x,y], i) => <rect key={`c${i}`} x={x*C} y={y*C} width={C} height={C} fill={land} />)}
      </g>
      {/* 4 chunky arrows orbiting (top, right, bottom, left) */}
      {/* top arrow → */}
      <g fill={color}>
        <rect x="90" y="10" width="40" height="10" />
        <rect x="120" y="0" width="10" height="10" />
        <rect x="120" y="20" width="10" height="10" />
        <rect x="130" y="10" width="10" height="10" />
      </g>
      {/* right arrow ↓ */}
      <g fill={color}>
        <rect x="180" y="70" width="10" height="40" />
        <rect x="170" y="100" width="10" height="10" />
        <rect x="190" y="100" width="10" height="10" />
        <rect x="180" y="110" width="10" height="10" />
      </g>
      {/* bottom arrow ← */}
      <g fill={color}>
        <rect x="70" y="180" width="40" height="10" />
        <rect x="70" y="170" width="10" height="10" />
        <rect x="70" y="190" width="10" height="10" />
        <rect x="60" y="180" width="10" height="10" />
      </g>
      {/* left arrow ↑ */}
      <g fill={color}>
        <rect x="10" y="90" width="10" height="40" />
        <rect x="0" y="90" width="10" height="10" />
        <rect x="20" y="90" width="10" height="10" />
        <rect x="10" y="80" width="10" height="10" />
      </g>
    </svg>
  );
}

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

        {/* ∞ Hero Banner */}
        <Card className="bg-card border-border/50 overflow-hidden">
          <CardContent className="p-6 sm:p-10">
            <div className={`relative rounded-xl py-10 px-4 flex items-center justify-center ${circularUnlocked ? "infinity-active" : "infinity-locked"}`}>
              <svg viewBox="0 0 200 80" className="w-full max-w-md h-32 sm:h-40" aria-hidden>
                <path
                  d="M50 40 C50 14, 95 14, 100 40 C105 66, 150 66, 150 40 C150 14, 105 14, 100 40 C95 66, 50 66, 50 40 Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="11"
                  strokeLinecap="round"
                />
              </svg>
              {!circularUnlocked && (
                <Lock className="absolute h-8 w-8 text-muted-foreground/70" />
              )}
            </div>
            <div className="mt-6 text-center max-w-2xl mx-auto space-y-2">
              <h2 className="text-lg font-bold text-foreground">Infinite Revenue Stream</h2>
              <p className="text-sm text-muted-foreground">
                Delta-neutral strategies and collective investment pools generate passive yield while you research.
                Set it once; let it compound.
              </p>
            </div>
          </CardContent>
        </Card>

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

            {/* Pixel-art globe + arrows */}
            <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-5 items-center pt-2">
              <div className="flex justify-center">
                <PixelGlobe active={circularUnlocked} />
              </div>
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
