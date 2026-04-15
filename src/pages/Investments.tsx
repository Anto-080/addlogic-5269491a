import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, TrendingUp, Shield, Users } from "lucide-react";

export default function Investments() {
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
              Your current level: <span className="text-primary font-bold">23</span>
            </p>
            <div className="w-full bg-secondary/50 rounded-full h-3 max-w-xs mx-auto">
              <div className="h-3 rounded-full bg-primary/60" style={{ width: "46%" }} />
            </div>
            <p className="text-xs text-muted-foreground">23 / 50 — 46% to unlock</p>
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
      </div>
    </AppLayout>
  );
}
