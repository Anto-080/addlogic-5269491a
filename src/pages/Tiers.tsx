import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { TIERS } from "@/lib/mockData";
import { TierIcon } from "@/components/TierIcon";
import { ArrowUpRight, Lock, ChevronDown, Activity, Gavel, Users, TrendingUp, Eye } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import biochemTitle from "@/assets/biochemistry-title.png";

// Deterministic mock bid stats per tier
function bidStats(id: number, multiplier: number) {
  const seed = id * 7;
  const topBid = Math.max(0.2, multiplier * 0.42 + (seed % 5) * 0.15);
  const bidders = 3 + (seed % 11);
  const traffic = (multiplier * 1800 + seed * 137).toFixed(0);
  const engagement = ((multiplier * 0.9 + (seed % 4)) % 9).toFixed(1);
  return { topBid, bidders, traffic: Number(traffic), engagement };
}

export default function Tiers() {
  const maxMultiplier = TIERS[0].multiplier;
  const [expanded, setExpanded] = useState<number | null>(null);
  const [seasonalShuffle, setSeasonalShuffle] = useState(0);
  const [params, setParams] = useSearchParams();
  const view = params.get("view") === "sponsors" ? "sponsors" : "tiers";

  useEffect(() => {
    const t = setInterval(() => setSeasonalShuffle((s) => s + 1), 6000);
    return () => clearInterval(t);
  }, []);

  const orderedTiers = useMemo(() => {
    const top = TIERS.filter((t) => t.id <= 4);
    const bottom = TIERS.filter((t) => t.id >= 14);
    const mid = TIERS.filter((t) => t.id > 4 && t.id < 14);
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
          <h1 className="text-2xl font-bold text-foreground">Tiers & Sponsors</h1>
          <p className="text-sm text-muted-foreground">
            17 tiers ranked by societal importance. Switch to Sponsor Live Bidding to see auction activity.
          </p>
        </div>

        <Tabs value={view} onValueChange={(v) => setParams(v === "sponsors" ? { view: "sponsors" } : {})}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tiers">Interest Tiers</TabsTrigger>
            <TabsTrigger value="sponsors">Sponsor Live Bidding</TabsTrigger>
          </TabsList>

          {/* ============ TIERS ============ */}
          <TabsContent value="tiers" className="space-y-4 mt-4">
            <Card className="bg-card border-border/50 p-4">
              <div className="flex items-start gap-3">
                <ArrowUpRight className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Redistribution Model:</strong> a portion of ad revenue from lower tiers flows upward.
                  Tier 17 browsing indirectly funds Tier 1 breakthroughs.
                </div>
              </div>
            </Card>

            <Card className="bg-card border-border/50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">Seasonal Spectrum Tracker</p>
              </div>
              <div className="tier-spectrum w-full h-3 rounded-full mb-2" />
              <div className="flex justify-between text-[10px] text-muted-foreground px-1">
                <span>Tier 1</span><span>Tier 17</span>
              </div>
            </Card>

            {/* Silver-framed top-3 high-priority tiers with Biochemistry banner */}
            <div className="silver-frame rounded-2xl overflow-hidden">
              <a
                href="https://pubs.acs.org/journal/bichaw"
                target="_blank"
                rel="noopener noreferrer"
                className="silver-banner block px-4 py-3 hover:opacity-90 transition-opacity"
                aria-label="Visit ACS Biochemistry Journal"
              >
                <img
                  src={biochemTitle}
                  alt="ACS Biochemistry Journal"
                  className="h-10 sm:h-12 w-auto mx-auto object-contain"
                />
                <p className="text-[10px] text-center mt-1 tracking-wider uppercase" style={{ color: "#758A9C" }}>
                  Top Priority Research · ACS Biochemistry
                </p>
              </a>
              <div className="p-3 space-y-3">
                {orderedTiers.filter((t) => t.id <= 3).map((tier) => {
                  const barWidth = (tier.multiplier / maxMultiplier) * 100;
                  const isOpen = expanded === tier.id;
                  return (
                    <Card
                      key={tier.id}
                      className="bg-card border-border/50 hover:border-primary/30 transition-all"
                      style={{ borderLeft: `3px solid ${tier.color}` }}
                    >
                      <CardContent className="p-4">
                        <button type="button" onClick={() => setExpanded(isOpen ? null : tier.id)} className="w-full text-left">
                          <div className="flex items-center gap-4">
                            <div className="shrink-0 w-12 flex justify-center" style={{ color: tier.color }}>
                              <TierIcon tierId={tier.id} size={28} />
                            </div>
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
                                <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${barWidth}%`, backgroundColor: tier.color }} />
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
                            <p className="text-[11px] text-muted-foreground mb-2">Subcategories:</p>
                            <div className="flex flex-wrap gap-2">
                              {tier.subcategories.map((s) => (
                                <span key={s} className="text-xs px-2 py-1 rounded-full bg-secondary/60 text-foreground/80 border border-border/40">{s}</span>
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

            <div className="space-y-3">
              {orderedTiers.filter((t) => t.id > 3).map((tier) => {
                const barWidth = (tier.multiplier / maxMultiplier) * 100;
                const isOpen = expanded === tier.id;
                return (
                  <Card
                    key={tier.id}
                    className="bg-card border-border/50 hover:border-primary/30 transition-all"
                    style={{ borderLeft: `3px solid ${tier.color}` }}
                  >
                    <CardContent className="p-4">
                      <button type="button" onClick={() => setExpanded(isOpen ? null : tier.id)} className="w-full text-left">
                        <div className="flex items-center gap-4">
                          <div className="shrink-0 w-12 flex justify-center" style={{ color: tier.color }}>
                            <TierIcon tierId={tier.id} size={28} />
                          </div>
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
                              <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${barWidth}%`, backgroundColor: tier.color }} />
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
                          <p className="text-[11px] text-muted-foreground mb-2">Subcategories:</p>
                          <div className="flex flex-wrap gap-2">
                            {tier.subcategories.map((s) => (
                              <span key={s} className="text-xs px-2 py-1 rounded-full bg-secondary/60 text-foreground/80 border border-border/40">{s}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* ============ SPONSOR LIVE BIDDING ============ */}
          <TabsContent value="sponsors" className="space-y-4 mt-4">
            <Card className="bg-card border-border/50 p-4">
              <div className="flex items-start gap-3">
                <Gavel className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Sponsors auction over specific tiers and sub-interests. Winning bids set the per-impression price researchers
                  earn — and the matching multiplier shared with investors backing that tier.
                </p>
              </div>
            </Card>

            <div className="space-y-3">
              {TIERS.map((tier) => {
                const stats = bidStats(tier.id, tier.multiplier);
                return (
                  <Card key={tier.id} className="bg-card border-border/50" style={{ borderLeft: `3px solid ${tier.color}` }}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span style={{ color: tier.color }}><TierIcon tierId={tier.id} size={26} /></span>
                          <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">Tier {tier.id}</p>
                            <p className="text-sm font-semibold text-foreground truncate">{tier.name}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-base font-bold text-gradient-gold">${stats.topBid.toFixed(2)}</p>
                          <p className="text-[10px] text-muted-foreground">top bid / impression</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2 text-center bg-secondary/30 rounded-lg p-2">
                        <div>
                          <Users className="h-3 w-3 mx-auto text-muted-foreground" />
                          <p className="text-xs font-semibold text-foreground">{stats.bidders}</p>
                          <p className="text-[9px] text-muted-foreground">bidders</p>
                        </div>
                        <div>
                          <TrendingUp className="h-3 w-3 mx-auto text-muted-foreground" />
                          <p className="text-xs font-semibold text-foreground">{stats.traffic.toLocaleString()}</p>
                          <p className="text-[9px] text-muted-foreground">traffic</p>
                        </div>
                        <div>
                          <Eye className="h-3 w-3 mx-auto text-muted-foreground" />
                          <p className="text-xs font-semibold text-foreground">{stats.engagement}</p>
                          <p className="text-[9px] text-muted-foreground">engagement</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold" style={{ color: tier.color }}>x{tier.multiplier}</p>
                          <p className="text-[9px] text-muted-foreground">user/inv mult.</p>
                        </div>
                      </div>

                      <BidDialog tier={tier} topBid={stats.topBid} />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

function BidDialog({ tier, topBid }: { tier: typeof TIERS[number]; topBid: number }) {
  const [bid, setBid] = useState((topBid + 0.05).toFixed(2));
  const [sub, setSub] = useState(tier.subcategories[0] ?? "");
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary" className="w-full gap-1">
          <Gavel className="h-3 w-3" /> Place Bid
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ color: tier.color }}>
            <TierIcon tierId={tier.id} size={20} /> Bid on {tier.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Sponsors out-bidding the current top bid (${topBid.toFixed(2)}) lock the tier slot for the next session.
          </p>
          <label className="text-xs text-muted-foreground">Sub-interest</label>
          <select
            value={sub}
            onChange={(e) => setSub(e.target.value)}
            className="w-full bg-secondary/50 rounded-md px-3 py-2 text-sm border border-border"
          >
            {tier.subcategories.map((s) => <option key={s}>{s}</option>)}
          </select>
          <label className="text-xs text-muted-foreground">Bid (USD / impression)</label>
          <Input type="number" step="0.01" value={bid} onChange={(e) => setBid(e.target.value)} className="bg-secondary/50" />
        </div>
        <DialogFooter>
          <Button onClick={() => toast({ title: "Bid placed (mock)", description: `$${bid} on ${sub} · Tier ${tier.id}` })}>
            Confirm Bid
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
