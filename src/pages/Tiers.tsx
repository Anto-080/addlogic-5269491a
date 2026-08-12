import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TIERS } from "@/lib/mockData";
import { useUserStats } from "@/hooks/useAppData";
import { TierIcon } from "@/components/TierIcon";
import { ArrowUpRight, Lock, ChevronDown, Activity, Gavel, ExternalLink } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import biochemTitle from "@/assets/biochemistry-title.png";
import { WipTapeBanner } from "@/components/WipTapeBanner";
// OpenAlexFeed moved to Research page (above the Anthropic curator).
import { TierExperienceBar } from "@/components/TierExperienceBar";
import { ExitInterstitial } from "@/components/ExitInterstitial";
import { useOutboundExit } from "@/hooks/useOutboundExit";
import { useTierKeywords } from "@/hooks/useTierKeywords";
import { useTierTraffic } from "@/hooks/useTierTraffic";
import mistralMark from "@/assets/mistral-mark.png";
import { AcademicConnection } from "@/components/AcademicConnection";

const TOP_TIER_GATE = 50;

/** Ash Gold — the unified experience-bar fill used across the tier list. */
const ASH_GOLD = "#8C6F54";

/**
 * Old filing-cabinet folder surface: matte tier-tinted paper, a tab notch at
 * the top-left, a full-width colour identification line across the top and a
 * soft bottom crease. Tint is more vivid than before but stays opaque/matte.
 */
function tierSurface(color: string) {
  return {
    background: `
      linear-gradient(160deg, color-mix(in srgb, ${color} 34%, hsl(var(--card))) 0%, color-mix(in srgb, ${color} 16%, hsl(var(--card))) 100%)
    `,
    borderColor: `color-mix(in srgb, ${color} 55%, transparent)`,
    borderTop: `4px solid ${color}`,
    borderRadius: "2px 10px 6px 6px",
    boxShadow: "inset 0 -10px 14px -12px rgba(0,0,0,0.55), 0 1px 0 rgba(255,255,255,0.05)",
  } as React.CSSProperties;
}

/** The folder tab that sits above the card's top colour line. */
function FolderTab({ color }: { color: string }) {
  return (
    <div
      aria-hidden
      className="h-2.5 w-24 ml-3"
      style={{
        background: `color-mix(in srgb, ${color} 34%, hsl(var(--card)))`,
        borderTop: `3px solid ${color}`,
        borderLeft: `1px solid color-mix(in srgb, ${color} 55%, transparent)`,
        borderRight: `1px solid color-mix(in srgb, ${color} 55%, transparent)`,
        borderRadius: "6px 10px 0 0",
      }}
    />
  );
}


/** FE International–style scroll reveal, identical to the Investment Phase. */
function useScrollReveal() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const nodes = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
    nodes.forEach((el, i) => {
      el.style.transitionDelay = `${Math.min(i * 60, 420)}ms`;
    });
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).setAttribute("data-reveal", "in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    nodes.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return rootRef;
}


function WarningPill() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-full border border-primary bg-card/90 px-4 py-2.5 font-open-sans text-xs text-primary shadow-sm">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full flex-col items-center gap-1.5"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <span className="shrink-0 inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary/10">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
              <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.728c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a1.125 1.125 0 100-2.25 1.125 1.125 0 000 2.25z" clipRule="evenodd" />
            </svg>
          </span>
          <strong className="font-semibold">Warning</strong>
        </div>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <p className="mt-2 text-center text-[11px] leading-relaxed text-primary/90">
          Retributions & Redistributions for Time Passed Researching are Subjected to Fluctuations stemming from Available Traffic. Tiers Specific Interest/Market Saturation also influence Seasonal or Daily Variations in How Tiers behave in term of Positioning for Experience Gains and Correlated Multipliers.
        </p>
      )}
    </div>
  );
}


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
  const { data: traffic = {} } = useTierTraffic();
  const fmtVisits = (id: number) => {
    const t = traffic[id];
    if (!t || t.visits === 0) return "— visits";
    return `${t.visits.toLocaleString()} visits`;
  };
  const fmtHours = (id: number) => {
    const t = traffic[id];
    if (!t || t.hours < 0.1) return "live data accumulating";
    return `${t.hours.toFixed(1)} researcher-hours`;
  };

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

  const revealRoot = useScrollReveal();

  // Click-to-glow: tapping a tier card toggles a warm-golden halo on it only.
  const onCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const root = revealRoot.current;
    root?.querySelectorAll(".glow-card.is-glowing").forEach((n) => {
      if (n !== card) n.classList.remove("is-glowing");
    });
    card.classList.toggle("is-glowing");
  };

  return (
    <AppLayout>
      <div ref={revealRoot} className="space-y-6 max-w-5xl mx-auto">

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
            <WarningPill />

            <Card className="bg-card border-border/50 p-4">
              <div className="flex items-start gap-3">
                <ArrowUpRight className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Redistribution Model:</strong> a portion of ad revenue from lower tiers flows upward.
                  Casual browsing from All Tiers indirectly funds Top-Priority Research in New Scientific Breakthroughs.
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
                        For Selected Scientists Only, <strong>Connect Through LinkedIn for Early Access</strong>. For Normal Users: Unlock at Level 50 of Sciences' Tier-Specific Experience.
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
                     <div
                       key={tier.id}
                       data-reveal
                       className={`glow-card rounded-[2px_10px_6px_6px] cursor-pointer ${isOpen ? "is-glowing" : ""}`}
                     >
                     <FolderTab color={tier.color} />
                     <Card
                       className="border transition-all bg-transparent shadow-none"
                       style={{ ...tierSurface(tier.color), boxShadow: "inset 0 -10px 14px -12px rgba(0,0,0,0.55)" }}
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
                                <div className="text-right shrink-0 ml-2">
                                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                                </div>

                              </div>
                              <div className="w-full bg-secondary/50 rounded-full h-2 mb-2">
                                <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${barWidth}%`, backgroundColor: ASH_GOLD }} />

                              </div>
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{fmtVisits(tier.id)}</span>
                                <span className="text-money font-medium">{fmtHours(tier.id)}</span>
                              </div>
                            </div>
                          </div>
                        </button>
                        {isOpen && (
                          <div className="mt-3 pt-3 border-t border-border/40">
                            <p className="text-xs font-semibold mb-2" style={{ color: tier.color }}>
                              x{tier.multiplier} Experience Multiplier
                            </p>
                            <TierExperienceBar tierId={tier.id} tierMultiplier={tier.multiplier} />
                          </div>
                        )}
                      </CardContent>
                     </Card>
                     </div>
                   );
                })}
              </div>
            </div>


            <AcademicConnection />

            <div className="space-y-3">
              {orderedTiers.filter((t) => t.id > 3).map((tier) => {
                const barWidth = (tier.multiplier / maxMultiplier) * 100;
                const isOpen = expanded === tier.id;
                return (
                  <div
                    key={tier.id}
                    data-reveal
                    className={`glow-card rounded-[2px_10px_6px_6px] cursor-pointer ${isOpen ? "is-glowing" : ""}`}
                  >
                  <FolderTab color={tier.color} />
                  <Card
                    className="border transition-all shadow-none"
                    style={{ ...tierSurface(tier.color), boxShadow: "inset 0 -10px 14px -12px rgba(0,0,0,0.55)" }}
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
                                <div className="text-right shrink-0 ml-2">
                                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                                </div>

                            </div>
                            <div className="w-full bg-secondary/50 rounded-full h-2 mb-2">
                              <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${barWidth}%`, backgroundColor: ASH_GOLD }} />
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{fmtVisits(tier.id)}</span>
                              <span className="text-money font-medium">{fmtHours(tier.id)}</span>
                            </div>
                          </div>
                        </div>
                      </button>
                        {isOpen && (
                          <div className="mt-3 pt-3 border-t border-border/40">
                            <p className="text-xs font-semibold mb-2" style={{ color: tier.color }}>
                              x{tier.multiplier} Experience Multiplier
                            </p>
                            <TierExperienceBar tierId={tier.id} tierMultiplier={tier.multiplier} />
                            <p className="text-[11px] text-muted-foreground mb-2">Subcategories:</p>

                          <div className="flex flex-wrap gap-2">
                            {tier.subcategories.map((s) => (
                              <span key={s} className="text-xs px-2 py-1 rounded-full bg-secondary/60 text-foreground/80 border border-border/40">{s}</span>
                            ))}
                          </div>
                          {(personalKeywords.subcategories[tier.id]?.length ?? 0) > 0 && (
                            <>
                              <p className="text-[11px] text-primary mt-3 mb-2 inline-flex items-center gap-1.5">
                                <img src={mistralMark} alt="Mistral" className="brand-asset h-3 w-3" />
                                AI-derived sub-interests (from your searches):
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {personalKeywords.subcategories[tier.id].map((k) => (
                                  <span key={k.keyword} className="text-xs px-2 py-1 rounded-full bg-primary/10 text-foreground/90 border border-primary/40 inline-flex items-center gap-1.5">
                                    <img src={mistralMark} alt="" className="brand-asset h-2.5 w-2.5" />
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
                  </div>
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

