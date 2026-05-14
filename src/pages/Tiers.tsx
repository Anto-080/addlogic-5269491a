import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TIERS } from "@/lib/mockData";
import { useUserStats } from "@/hooks/useAppData";
import { TierIcon } from "@/components/TierIcon";
import { ArrowUpRight, Lock, ChevronDown, Activity, Gavel, ExternalLink } from "lucide-react";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import biochemTitle from "@/assets/biochemistry-title.png";
import { WipTapeBanner } from "@/components/WipTapeBanner";
// OpenAlexFeed moved to Research page (above the Anthropic curator).
import { TierExperienceBar } from "@/components/TierExperienceBar";
import { ExitInterstitial } from "@/components/ExitInterstitial";
import { useOutboundExit } from "@/hooks/useOutboundExit";
import { useTierKeywords } from "@/hooks/useTierKeywords";

const TOP_TIER_GATE = 35;


export default function Tiers() {
  const maxMultiplier = TIERS[0].multiplier;
  const [expanded, setExpanded] = useState<number | null>(null);
  const exit = useOutboundExit();
  const [params, setParams] = useSearchParams();
  const view = params.get("view") === "sponsors" ? "sponsors" : "tiers";
  const { data: stats } = useUserStats();
  const userLevel = stats?.level ?? 1;
  const topTierLocked = userLevel < TOP_TIER_GATE;
  const personalKeywords = useTierKeywords();

  // Natural chromatic order: top three priority tiers (purple) first, then
  // every other tier sorted by multiplier descending. This keeps the blue
  // band (Tech → Tourism → Real Estate) contiguous and stops Tourism+Real
  // Estate from being shoved below the locked red bottom tiers.
  const orderedTiers = useMemo(() => {
    const top = TIERS.filter((t) => t.id <= 3);
    const rest = [...TIERS.filter((t) => t.id > 3)].sort(
      (a, b) => b.multiplier - a.multiplier
    );
    return [...top, ...rest];
  }, []);


  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tiers & Sponsors</h1>
          <p className="text-sm text-muted-foreground">Tiers Ranked by Systemic Importance.</p>
          <p className="text-sm text-muted-foreground">Switch to Sponsor Live Bidding to see auction activity.</p>
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
                  Casual browsing indirectly funds top-priority breakthroughs.
                </div>
              </div>
            </Card>

            <Card className="bg-card border-border/50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">Seasonal Spectrum Tracker</p>
              </div>
              <div className="tier-spectrum w-full h-3 rounded-full" />
            </Card>

            {/* Silver-framed top-3 high-priority tiers with Biochemistry banner */}
            <div className="silver-frame rounded-2xl overflow-hidden">
              <div className="silver-banner px-4 py-3 relative">
                <img
                  src={biochemTitle}
                  alt="Priority Research"
                  className="h-10 sm:h-12 w-auto mx-auto object-contain"
                />
                <p className="text-center mt-1 text-xs tracking-wider uppercase font-medium" style={{ color: "#758A9C" }}>
                  Priority Research
                </p>
                <a
                  href="https://pubs.acs.org/journal/bichaw"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-1.5 right-2 text-[10px] tracking-wide hover:underline"
                  style={{ color: "#758A9C" }}
                  aria-label="Visit ACS journal"
                >
                  ⟩ ACS
                </a>
              </div>
              <div className="p-3 space-y-3 relative">
                {topTierLocked && (
                  <div className="absolute inset-0 z-10 backdrop-blur-sm bg-background/40 rounded-b-2xl flex items-center justify-center p-4">
                    <div className="bg-card border border-border/60 rounded-xl p-4 max-w-sm text-center space-y-3 shadow-xl">
                      <WipTapeBanner />
                      <p className="text-sm font-semibold text-foreground">Top-tier research locked</p>
                      <p className="text-xs text-muted-foreground">
                        For Accredited Scientists: <strong>Connect through LinkedIn for Early Access</strong>. Unlocks at Level {TOP_TIER_GATE}.
                      </p>
                      <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#0A66C2] hover:bg-[#0A66C2]/90 text-white text-xs font-medium">
                        <ExternalLink className="h-3 w-3" /> Connect via LinkedIn
                      </button>
                    </div>
                  </div>
                )}
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
                                  <h3 className={`text-sm font-semibold text-foreground flex items-center gap-1 ${isOpen ? "" : "truncate"}`}>
                                    {tier.name}
                                    {tier.locked && <Lock className="h-3 w-3 text-muted-foreground shrink-0" />}
                                  </h3>
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
                                <span className="text-money font-medium">Avg T${tier.avgEarning.toFixed(2)}/day</span>
                              </div>
                            </div>
                          </div>
                        </button>
                        {isOpen && (
                          <div className="mt-3 pt-3 border-t border-border/40">
                            <TierExperienceBar tierId={tier.id} tierMultiplier={tier.multiplier} />
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
                                <h3 className={`text-sm font-semibold text-foreground flex items-center gap-1 ${isOpen ? "" : "truncate"}`}>
                                  {tier.name}
                                  {tier.locked && <Lock className="h-3 w-3 text-muted-foreground shrink-0" />}
                                </h3>
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
                              <span className="text-money font-medium">Avg T${tier.avgEarning.toFixed(2)}/day</span>
                            </div>
                          </div>
                        </div>
                      </button>
                      {isOpen && (
                        <div className="mt-3 pt-3 border-t border-border/40">
                          <TierExperienceBar tierId={tier.id} tierMultiplier={tier.multiplier} />
                          <p className="text-[11px] text-muted-foreground mb-2">Subcategories:</p>
                          <div className="flex flex-wrap gap-2">
                            {tier.subcategories.map((s) => (
                              <span key={s} className="text-xs px-2 py-1 rounded-full bg-secondary/60 text-foreground/80 border border-border/40">{s}</span>
                            ))}
                          </div>
                          {(personalKeywords.subcategories[tier.id]?.length ?? 0) > 0 && (
                            <>
                              <p className="text-[11px] text-primary mt-3 mb-2">AI-derived sub-interests (from your searches):</p>
                              <div className="flex flex-wrap gap-2">
                                {personalKeywords.subcategories[tier.id].map((k) => (
                                  <span key={k.keyword} className="text-xs px-2 py-1 rounded-full bg-primary/10 text-foreground/90 border border-primary/40">
                                    {k.keyword} <span className="text-muted-foreground">×{k.count}</span>
                                  </span>
                                ))}
                              </div>
                            </>
                          )}
                          {(personalKeywords.keywords[tier.id]?.length ?? 0) > 0 && (
                            <>
                              <p className="text-[11px] text-crimson mt-3 mb-2">Your personalised keywords (zero-party):</p>
                              <div className="flex flex-wrap gap-2">
                                {personalKeywords.keywords[tier.id].map((k) => (
                                  <span key={k.keyword} className="text-xs px-2 py-1 rounded-full bg-crimson/10 text-foreground/90 border border-crimson/30">
                                    {k.keyword} <span className="text-muted-foreground">×{k.count}</span>
                                  </span>
                                ))}
                              </div>
                            </>
                          )}
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

            <Card className="bg-card border-border/50 p-6 text-center">
              <p className="text-sm font-semibold text-foreground">No live bids yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Sponsor auctions open once verified advertisers come online. Real bid data will appear here.
              </p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <ExitInterstitial
        open={exit.state.open}
        url={exit.state.url}
        host={exit.state.host}
        tierId={exit.state.tierId}
        ad={exit.state.ad}
        onConfirm={exit.confirm}
        onCancel={exit.cancel}
      />
    </AppLayout>
  );
}

