import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MOCK_SPONSOR_BIDS, TIERS } from "@/lib/mockData";
import { Star, Megaphone, TrendingUp, TrendingDown, Activity, Eye, Target, Zap } from "lucide-react";

type LiveBid = {
  id: string;
  company: string;
  tier: number;
  bidAmount: number;
  prevBid: number;
  impressions: string;
  ctr: string;
  rating: number;
  pulse: number; // ms since update
};

const COMPANIES_POOL = [
  "BioGenesis Labs", "NeuroTech Inc", "QuantumCore", "GreenFin Capital",
  "StreamVision", "BetKing Pro", "HelixPharma", "AtlasRobotics",
  "EcoVerde", "LumenAI", "FusionWorks", "OrbitMedia",
];

function makeInitialBids(): LiveBid[] {
  return MOCK_SPONSOR_BIDS.map((b, i) => ({
    id: `bid-${i}`,
    company: b.company,
    tier: b.tier,
    bidAmount: b.bidAmount,
    prevBid: b.bidAmount,
    impressions: b.impressions,
    ctr: b.ctr,
    rating: b.rating,
    pulse: 0,
  }));
}

type FeedEvent = {
  id: number;
  ts: string;
  company: string;
  tier: number;
  action: "outbid" | "new" | "raised" | "won";
  amount: number;
};

export default function Sponsors() {
  const [bids, setBids] = useState<LiveBid[]>(makeInitialBids());
  const [feed, setFeed] = useState<FeedEvent[]>([]);
  const [eventId, setEventId] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setBids((prev) => {
        const next = [...prev];
        const idx = Math.floor(Math.random() * next.length);
        const target = { ...next[idx] };
        const delta = (Math.random() - 0.35) * 0.25;
        const newAmount = Math.max(0.15, +(target.bidAmount + delta).toFixed(2));
        target.prevBid = target.bidAmount;
        target.bidAmount = newAmount;
        target.pulse = Date.now();
        next[idx] = target;

        const action: FeedEvent["action"] =
          newAmount > target.prevBid ? (Math.random() > 0.7 ? "outbid" : "raised") : "won";
        setEventId((id) => {
          setFeed((f) => [
            {
              id,
              ts: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
              company: target.company,
              tier: target.tier,
              action,
              amount: newAmount,
            },
            ...f,
          ].slice(0, 12));
          return id + 1;
        });
        return next;
      });

      // occasional brand-new bid
      if (Math.random() > 0.75) {
        const company = COMPANIES_POOL[Math.floor(Math.random() * COMPANIES_POOL.length)];
        const tier = Math.floor(Math.random() * 16) + 1;
        const amount = +(Math.random() * 2.5 + 0.3).toFixed(2);
        setEventId((id) => {
          setFeed((f) => [
            {
              id,
              ts: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
              company,
              tier,
              action: "new" as const,
              amount,
            },
            ...f,
          ].slice(0, 12));
          return id + 1;
        });
      }
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  const sortedBids = [...bids].sort((a, b) => b.bidAmount - a.bidAmount);

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sponsor Marketplace</h1>
          <p className="text-sm text-muted-foreground">
            Live tier-slot auction. Advertisers bid in real time for matched-interest reach.
          </p>
        </div>

        {/* Why matched ads beat ad-blindness */}
        <Card className="bg-card border-border/50 p-4">
          <div className="flex items-start gap-3">
            <Target className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">Why matched ads beat ad-blindness</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Traditional ad networks spray generic creatives at every visitor. Users learn to ignore them —
                "banner blindness" pushes CTR below 0.1% and trains the brain to skip entire screen regions.
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tier-matched bidding flips the loop: an advertiser only pays when their offer reaches a
                researcher actively engaged with that exact subject. CTR rises 8–40×, complaints drop, and the
                researcher earns a fair share for the attention they actually chose to give.
              </p>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div className="bg-secondary/30 rounded-md p-2 text-center">
                  <p className="text-[10px] text-muted-foreground">Generic CTR</p>
                  <p className="text-sm font-bold text-destructive">0.08%</p>
                </div>
                <div className="bg-secondary/30 rounded-md p-2 text-center">
                  <p className="text-[10px] text-muted-foreground">Tier-matched CTR</p>
                  <p className="text-sm font-bold text-primary">3.6%</p>
                </div>
                <div className="bg-secondary/30 rounded-md p-2 text-center">
                  <p className="text-[10px] text-muted-foreground">Researcher cut</p>
                  <p className="text-sm font-bold text-gradient-gold">62%</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Live auction marketplace feed */}
        <Card className="bg-card border-border/50">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary animate-pulse" />
                <p className="text-sm font-semibold text-foreground">Live Auction Feed</p>
              </div>
              <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse mr-1.5" />
                LIVE
              </Badge>
            </div>
            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              {feed.length === 0 && (
                <p className="text-xs text-muted-foreground italic">Waiting for bids…</p>
              )}
              {feed.map((e) => {
                const tier = TIERS.find((t) => t.id === e.tier);
                const colorClass =
                  e.action === "outbid"
                    ? "text-destructive"
                    : e.action === "new"
                    ? "text-primary"
                    : e.action === "won"
                    ? "text-gradient-gold"
                    : "text-foreground";
                return (
                  <div
                    key={e.id}
                    className="flex items-center justify-between gap-2 text-xs py-1.5 px-2 rounded bg-secondary/20 border border-border/30"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs text-muted-foreground tabular-nums">{e.ts}</span>
                      <span className="text-base">{tier?.icon}</span>
                      <span className="font-medium text-foreground truncate">{e.company}</span>
                      <span className={`uppercase text-[10px] font-semibold ${colorClass}`}>
                        {e.action}
                      </span>
                    </div>
                    <span className="font-bold text-foreground tabular-nums">${e.amount.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Live tier slots */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">Tier slots — current high bids</p>
          </div>
          <div className="space-y-3">
            {sortedBids.map((bid) => {
              const tier = TIERS.find((t) => t.id === bid.tier);
              const trend = bid.bidAmount - bid.prevBid;
              const isUp = trend > 0;
              const recentlyUpdated = Date.now() - bid.pulse < 1500;
              return (
                <Card
                  key={bid.id}
                  className={`bg-card border-border/50 transition-all duration-500 ${
                    recentlyUpdated ? "ring-1 ring-primary/40 shadow-lg shadow-primary/10" : ""
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{tier?.icon}</span>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{bid.company}</p>
                          <p className="text-xs text-muted-foreground">
                            Tier {bid.tier} · {tier?.name}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <p className="text-lg font-bold text-gradient-gold tabular-nums">
                            ${bid.bidAmount.toFixed(2)}
                          </p>
                          {Math.abs(trend) > 0.001 &&
                            (isUp ? (
                              <TrendingUp className="h-3.5 w-3.5 text-primary" />
                            ) : (
                              <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                            ))}
                        </div>
                        <p className="text-[10px] text-muted-foreground">per impression</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center bg-secondary/30 rounded-lg p-2">
                      <div>
                        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                          <Eye className="h-3 w-3" /> Impr.
                        </p>
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

        <Card className="bg-card border-border/50 p-4">
          <div className="flex items-start gap-3">
            <Megaphone className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">
              Bids re-rank every few seconds. Higher tiers cost more but reach deeply engaged researchers —
              cookies and consented interest tags ensure ads match genuine research intent.
            </p>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
