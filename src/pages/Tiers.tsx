import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { TIERS } from "@/lib/mockData";
import { ArrowUpRight } from "lucide-react";

export default function Tiers() {
  const maxMultiplier = TIERS[0].multiplier;

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Interest Tiers</h1>
          <p className="text-sm text-muted-foreground">
            14 tiers ranked by societal importance. Higher tiers earn more and receive redistribution from lower tiers.
          </p>
        </div>

        <Card className="bg-card border-border/50 p-4">
          <div className="flex items-start gap-3">
            <ArrowUpRight className="h-5 w-5 text-crimson mt-0.5 shrink-0" />
            <div className="text-sm text-muted-foreground">
              <strong className="text-foreground">Redistribution Model:</strong> A portion of ad revenue from lower tiers flows upward.
              Tier 14 researchers indirectly fund Tier 1 breakthroughs. Even casual browsing contributes to life-saving research.
            </div>
          </div>
        </Card>

        <div className="space-y-3">
          {TIERS.map((tier) => {
            const barWidth = (tier.multiplier / maxMultiplier) * 100;
            return (
              <Card key={tier.id} className="bg-card border-border/50 hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl shrink-0 w-12 text-center">{tier.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <span className="text-xs text-muted-foreground">Tier {tier.id}</span>
                          <h3 className="text-sm font-semibold text-foreground truncate">{tier.name}</h3>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <p className="text-lg font-bold text-crimson">x{tier.multiplier}</p>
                          <p className="text-[10px] text-muted-foreground">multiplier</p>
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
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
