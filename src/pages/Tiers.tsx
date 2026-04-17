import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { TIERS } from "@/lib/mockData";
import { ArrowUpRight, Lock, ChevronDown, Activity } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export default function Tiers() {
  const maxMultiplier = TIERS[0].multiplier;
  const [expanded, setExpanded] = useState<number | null>(null);
  const [seasonalShuffle, setSeasonalShuffle] = useState(0);

  // Mock seasonal reorder: only mid-tiers (positions 5-12, i.e. ids 5..13) shuffle.
  // Top 4 (1-4) and bottom 4 (14-17) stay locked in place.
  useEffect(() => {
    const t = setInterval(() => setSeasonalShuffle((s) => s + 1), 6000);
    return () => clearInterval(t);
  }, []);

  const orderedTiers = useMemo(() => {
    const top = TIERS.filter((t) => t.id <= 4);
    const bottom = TIERS.filter((t) => t.id >= 14);
    const mid = TIERS.filter((t) => t.id > 4 && t.id < 14);
    // Deterministic seasonal jitter based on shuffle index
    const scored = mid.map((t, i) => ({
      t,
      score: t.multiplier + Math.sin(seasonalShuffle * 0.7 + i) * 0.4,
    }));
    scored.sort((a, b) => b.score - a.score);
    return [...top, ...scored.map((s) => s.t), ...bottom];
  }, [seasonalShuffle]);

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Interest Tiers</h1>
          <p className="text-sm text-muted-foreground">
            17 tiers ranked by societal importance. Top 4 and bottom 4 are <strong className="text-foreground">locked in place</strong> — we never push betting or adult content just because they earn faster. Mid tiers gently shift with seasonal research trends.
          </p>
        </div>

        <Card className="bg-card border-border/50 p-4">
          <div className="flex items-start gap-3">
            <ArrowUpRight className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="text-sm text-muted-foreground">
              <strong className="text-foreground">Redistribution Model:</strong> a portion of ad revenue from lower tiers flows upward.
              Tier 17 browsing indirectly funds Tier 1 breakthroughs. Even casual sessions contribute to life-saving research.
            </div>
          </div>
        </Card>

        {/* Seasonal spectrum tracker */}
        <Card className="bg-card border-border/50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">Seasonal Spectrum Tracker</p>
          </div>
          <div className="flex gap-3">
            <div className="tier-spectrum w-3 rounded-full shrink-0" style={{ minHeight: 360 }} />
            <div className="flex-1 text-xs text-muted-foreground space-y-1">
              <p><span className="text-foreground font-medium">Purple top</span> — Biological & systemically important science (locked).</p>
              <p><span className="text-foreground font-medium">Green</span> — Ecology, finance.</p>
              <p><span className="text-foreground font-medium">Blue</span> — Tech, art & culture.</p>
              <p><span className="text-foreground font-medium">Pink → Peach</span> — News, entertainment, food, real estate, shopping, personal care.</p>
              <p><span className="text-foreground font-medium">Orange</span> — Clothes, sports & eSports.</p>
              <p><span className="text-foreground font-medium">Bloody red bottom</span> — Betting, adult (locked).</p>
              <p className="pt-2 italic">Mid tiers re-rank gently every few seconds to simulate seasonal trend shifts.</p>
            </div>
          </div>
        </Card>

        <div className="space-y-3">
          {orderedTiers.map((tier) => {
            const barWidth = (tier.multiplier / maxMultiplier) * 100;
            const isOpen = expanded === tier.id;
            return (
              <Card
                key={tier.id}
                className="bg-card border-border/50 hover:border-primary/30 transition-all"
                style={{ borderLeft: `3px solid ${tier.color}` }}
              >
                <CardContent className="p-4">
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : tier.id)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-3xl shrink-0 w-12 text-center">{tier.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="min-w-0">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              Tier {tier.id}
                              {tier.locked && <Lock className="h-3 w-3" />}
                            </span>
                            <h3 className="text-sm font-semibold text-foreground truncate">{tier.name}</h3>
                          </div>
                          <div className="text-right shrink-0 ml-2 flex items-center gap-2">
                            <div>
                              <p className="text-lg font-bold" style={{ color: tier.color }}>x{tier.multiplier}</p>
                              <p className="text-[10px] text-muted-foreground">multiplier</p>
                            </div>
                            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                          </div>
                        </div>
                        <div className="w-full bg-secondary/50 rounded-full h-2 mb-2">
                          <div
                            className="h-2 rounded-full transition-all duration-500"
                            style={{ width: `${barWidth}%`, backgroundColor: tier.color }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{tier.researchers.toLocaleString()} researchers</span>
                          <span className="text-gold font-medium">Avg ${tier.avgEarning.toFixed(2)}/day</span>
                        </div>
                      </div>
                    </div>
                  </button>
                  {isOpen && (
                    <div className="mt-3 pt-3 border-t border-border/40">
                      <p className="text-[11px] text-muted-foreground mb-2">Subcategories (grow as the community researches):</p>
                      <div className="flex flex-wrap gap-2">
                        {tier.subcategories.map((s) => (
                          <span key={s} className="text-xs px-2 py-1 rounded-full bg-secondary/60 text-foreground/80 border border-border/40">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
