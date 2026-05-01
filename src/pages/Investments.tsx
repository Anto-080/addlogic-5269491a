import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Shield, Users, ChevronDown } from "lucide-react";
import workInProgressImg from "@/assets/work-in-progress.png";
import circularSeal from "@/assets/circular-economy-seal.jpg";
import infinityLoop from "@/assets/infinity-loop.jpg";
import { useUserStats } from "@/hooks/useAppData";
import { IdeasLibrary } from "@/components/IdeasLibrary";

const CIRCULAR_UNLOCK = 100;
const INVESTMENT_UNLOCK = 50;

export default function Investments() {
  const { data: stats } = useUserStats();
  const userLevel = stats?.level ?? 1;
  const investmentUnlocked = userLevel >= INVESTMENT_UNLOCK;
  const circularUnlocked = userLevel >= CIRCULAR_UNLOCK;
  const circularPct = Math.min(100, (userLevel / CIRCULAR_UNLOCK) * 100);
  const investPct = Math.min(100, (userLevel / INVESTMENT_UNLOCK) * 100);
  // No inline color overrides — the single rule in index.css ([data-circular-card])
  // applies the exact RGB sampled from the uploaded reference image.

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Investment Phase</h1>
          <p className="text-sm text-muted-foreground">Unlock by reaching higher experience levels.</p>
        </div>

        {/* Level 50 gate — keeps the original Work In Progress sign image here only */}
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
              <div className="h-3 rounded-full" style={{ width: `${investPct}%`, backgroundColor: "#004627" }} />
            </div>
            <p className="text-xs text-muted-foreground">{userLevel} / {INVESTMENT_UNLOCK} — {investPct.toFixed(0)}% to unlock</p>
            {investmentUnlocked && (
              <img
                src={infinityLoop}
                alt="Investment phase unlocked — infinite loop"
                className="mx-auto mt-4 rounded-lg w-full max-w-sm object-contain"
                loading="lazy"
              />
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { Icon: TrendingUp, title: "Stablecoin Staking", desc: "Deposit earnings into staking pools. Earn passive yield while stabilizing the platform's transaction flow. Delta-neutral strategies minimize risk." },
            { Icon: Users, title: "Collective Investment Pools", desc: "Join community pools funded by researcher earnings and private investors. Access institutional-grade passive strategies." },
            { Icon: Shield, title: "Sector-Based Investing", desc: "Invest in companies matching your research tier. Top-tier researchers can back breakthroughs in their area of expertise." },
          ].map(({ Icon, title, desc }) => (
            <Card key={title} className="bg-card border-border/50 opacity-60">
              <CardContent className="p-4">
                <Icon className="h-8 w-8 mb-3" style={{ color: "#004627" }} />
                <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Phase 4 — ∞ Circular Economy (Level 100) — collapsible */}
        <Card
          className={`border-border/50 overflow-hidden transition-colors ${circularUnlocked ? "" : "bg-card"}`}
          data-circular-card={circularUnlocked ? "true" : undefined}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                 <ChevronDown className={`h-4 w-4 transition-transform ${circularUnlocked ? "rotate-0" : "-rotate-90"}`} />
                 <span>∞ Circular Economy</span>
              </span>
              <span
                className="text-[11px] font-semibold px-2 py-1 rounded-full"
                style={
                  circularUnlocked
                    ? { backgroundColor: "#ffffff", color: "rgb(40, 53, 76)" }
                    : { backgroundColor: "hsl(var(--secondary))", color: "hsl(var(--muted-foreground))" }
                }
              >
                {circularUnlocked ? "ACTIVE" : `LEVEL ${CIRCULAR_UNLOCK} REQUIRED`}
              </span>
            </CardTitle>
          </CardHeader>

          {!circularUnlocked ? (
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                 Currently {userLevel} / {CIRCULAR_UNLOCK} ({circularPct.toFixed(0)}%). The ∞ Circular Economy
                activates when the user reaches Level {CIRCULAR_UNLOCK}.
              </p>
              <p className="text-xs text-muted-foreground px-1">Locked — keep researching to unlock.</p>
            </CardContent>
          ) : (
            <CardContent className="space-y-5">
              {/* Round circular-economy seal — uploaded reference */}
              <div className="flex justify-center">
                <img
                  src={circularSeal}
                  alt="Worldwide Circular Economy seal"
                  className="rounded-full"
                  style={{
                    width: 220,
                    height: 220,
                    objectFit: "cover",
                    boxShadow: "0 6px 24px hsl(220 60% 20% / 0.35)",
                  }}
                  loading="lazy"
                />
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold" style={{ color: "hsl(var(--circular-economy-foreground))" }}>
                  Foundational Cooperative Loop — For Tailored Groundbreaking Ideas
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: "hsl(var(--circular-economy-foreground))" }}>
                  Direct interactions between Companies and Most Experienced Users will be not only promoted but
                  facilitated. Users' ideas will be prompted as new concepts to already established industrial
                  complexes; the best ideas will be not only chosen but retributed and offered a working position
                  inside the finest companies worldwide. Companies will be shown how the users'
                  knowledge-development will push clients to reinvest in their favourite companies in the safest,
                  most fluctuation-stable, and most remunerative ways possible — for both the users and the
                  companies.
                </p>
              </div>

              <IdeasLibrary />

                    checked={!!flags?.force_circular_l100}
                    onCheckedChange={(v) => updateFlags.mutate({ force_circular_l100: v })}
                    data-emerald="true"
                  />
                </div>
              )}
            </CardContent>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
