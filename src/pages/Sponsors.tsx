import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MOCK_SPONSOR_BIDS, TIERS } from "@/lib/mockData";
import { Star, Megaphone } from "lucide-react";

export default function Sponsors() {
  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sponsor Marketplace</h1>
          <p className="text-sm text-muted-foreground">How advertisers bid on interest-based ad slots (read-only mock view).</p>
        </div>

        <Card className="bg-card border-border/50 p-4">
          <div className="flex items-start gap-3">
            <Megaphone className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">
              Advertisers bid per-tier for maximum specificity. Higher tiers cost more but reach deeply engaged researchers.
              User cookies and interest tags ensure ads match genuine research interests.
            </p>
          </div>
        </Card>

        <div className="space-y-3">
          {MOCK_SPONSOR_BIDS.map((bid, i) => {
            const tier = TIERS.find((t) => t.id === bid.tier);
            return (
              <Card key={i} className="bg-card border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{tier?.icon}</span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{bid.company}</p>
                        <p className="text-xs text-muted-foreground">Tier {bid.tier} · {tier?.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gradient-gold">${bid.bidAmount.toFixed(2)}</p>
                      <p className="text-[10px] text-muted-foreground">per impression</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center bg-secondary/30 rounded-lg p-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Impressions</p>
                      <p className="text-sm font-semibold text-foreground">{bid.impressions}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">CTR</p>
                      <p className="text-sm font-semibold text-foreground">{bid.ctr}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Rating</p>
                      <div className="flex items-center justify-center gap-1">
                        <Star className="h-3 w-3 text-gold fill-gold" />
                        <span className="text-sm font-semibold text-foreground">{bid.rating}</span>
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
