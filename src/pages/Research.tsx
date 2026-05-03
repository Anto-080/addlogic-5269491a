import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TIERS } from "@/lib/mockData";
import { useArticles, useUserStats, useCurateNews, type LiveArticle } from "@/hooks/useAppData";
import { Star, Play, X, Clock, DollarSign, Video, Lock, ExternalLink, Sparkles, RefreshCw, Loader2 } from "lucide-react";
import { BrowserPicker } from "@/components/BrowserPicker";
import { ExitInterstitial } from "@/components/ExitInterstitial";
import { useOutboundExit } from "@/hooks/useOutboundExit";
import { TierIcon } from "@/components/TierIcon";
import { useSettings, XP_PER_LEVEL, consentBonus } from "@/contexts/SettingsContext";
import { ExperienceBar } from "@/components/ExperienceBar";
import { OpenAlexFeed } from "@/components/OpenAlexFeed";
import { toast } from "sonner";

const SEARCH_GATE_LEVEL = 25;
const TOP_TIER_GATE = 35;

function StarRating({ onRate }: { onRate: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  const [rating, setRating] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-5 w-5 cursor-pointer transition-colors ${n <= (hover || rating) ? "text-gold fill-gold" : "text-muted-foreground"}`}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => {
            setRating(n);
            onRate(n);
          }}
        />
      ))}
    </div>
  );
}



export default function Research() {
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [sessionEarnings, setSessionEarnings] = useState(0);
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [articleCount, setArticleCount] = useState(0);
  const exit = useOutboundExit();
  const [showSponsoredVideos, setShowSponsoredVideos] = useState(false);
  const { topInterestTiers, cookieAutoAccept, gpsPrecision } = useSettings();
  const { data: stats } = useUserStats();
  const { data: liveArticles = [] } = useArticles();
  const curate = useCurateNews();
  const [liveNews, setLiveNews] = useState<LiveArticle[]>([]);

  const selectedTierData = TIERS.find((t) => t.id === (selectedTier ?? 4)) ?? TIERS[3];
  const primaryTierId = selectedTier ?? 4;
  const userLevel = stats?.level ?? 1;
  // When "All" is selected, fall back to the live persisted multiplier so the
  // bar reflects ongoing activity instead of getting stuck on a hardcoded base.
  const baseForBar = selectedTier === null ? undefined : selectedTierData.multiplier;
  const liveMultiplier = (stats?.current_multiplier ?? 1) + consentBonus(cookieAutoAccept, gpsPrecision);
  const activeMultiplier = selectedTier === null
    ? liveMultiplier
    : selectedTierData.multiplier + consentBonus(cookieAutoAccept, gpsPrecision);

  const filteredArticles = useMemo(() => {
    let list = liveArticles
      .filter((a) => !selectedTier || a.tier_id === selectedTier)
      .map((a) => ({
        id: a.id,
        title: a.title,
        tier: a.tier_id,
        source: a.source,
        readTime: a.read_time ?? "",
        earnings: a.earnings,
      }));
    if (topInterestTiers.length) {
      list = [...list].sort((a, b) => {
        const ai = topInterestTiers.indexOf(a.tier);
        const bi = topInterestTiers.indexOf(b.tier);
        const av = ai === -1 ? 999 : ai;
        const bv = bi === -1 ? 999 : bi;
        return av - bv;
      });
    }
    return list;
  }, [selectedTier, topInterestTiers, liveArticles]);

  const handleReadArticle = (earnings: number, tier: number) => {
    if (tier <= 3 && userLevel < TOP_TIER_GATE) return;
    setSessionEarnings((s) => s + earnings);
    setArticleCount((c) => {
      const next = c + 1;
      if (next % 5 === 0) setShowInterstitial(true);
      return next;
    });
  };

  const handleWatchVideo = () => {
    setSessionEarnings((s) => s + 2.5);
  };

  const handleFetchLive = async () => {
    const ids = selectedTier ? [selectedTier] : (topInterestTiers.length ? topInterestTiers.slice(0, 4) : [4]);
    try {
      const articles = await curate.mutateAsync({ tierIds: ids, count: 6 });
      setLiveNews(articles);
      if (articles.length === 0) toast.info("No live articles returned. Try again.");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to fetch live news");
    }
  };

  const handleOpenLive = (a: LiveArticle) => {
    exit.requestExit(a.url, a.tier_id ?? primaryTierId);
  };


  return (
    <AppLayout>
      <div className="space-y-4 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground">AddLogic Research</h1>
          <p className="text-sm text-muted-foreground">Browse via DuckDuckGo, earn from your curiosity.</p>
        </div>


        <BrowserPicker
          onOpenResult={(item) => exit.requestExit(item.url, primaryTierId)}
          userLevel={userLevel}
        />

        <Card className="bg-card border-border/60 glow-amber">
          <CardContent className="p-4 space-y-3">
            {userLevel < TOP_TIER_GATE && (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  Connect with LinkedIn — <span className="text-foreground font-medium">For Biochemical Researchers Only</span>
                </p>
                <Button size="sm" variant="secondary" className="gap-2 self-start shrink-0">
                  <ExternalLink className="h-3 w-3" /> Connect with LinkedIn
                </Button>
              </div>
            )}

            <ExperienceBar baseMultiplier={baseForBar} earning />

            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Each level requires <span className="text-foreground font-medium">{XP_PER_LEVEL.toLocaleString()} XP</span>. XP advances in real time while you are active in the Research Room. The <span className="text-crimson font-medium">Crimson Multiplier</span> increases the XP earned per second based on your selected tier and active data permissions.
            </p>
          </CardContent>
        </Card>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <Button variant={selectedTier === null ? "default" : "secondary"} size="sm" onClick={() => setSelectedTier(null)}>All</Button>
          {TIERS.map((t) => (
            <Button key={t.id} variant={selectedTier === t.id ? "default" : "secondary"} size="sm" onClick={() => setSelectedTier(t.id)} className="shrink-0 gap-1" style={selectedTier === t.id ? undefined : { color: t.color }} aria-label={t.name}>
              <TierIcon tierId={t.id} size={14} />
            </Button>
          ))}
        </div>

        {/* OpenAlex scholarly feed — moved here from the Tiers page; now public. */}
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <OpenAlexFeed
              tierName={selectedTierData.name}
              subcategories={selectedTierData.subcategories}
              onOpenUrl={(url) => exit.requestExit(url, primaryTierId)}
            />
          </CardContent>
        </Card>

        <Card className="bg-card border-crimson/30">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles className="h-4 w-4 text-crimson shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">Live news from Claude</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {selectedTier
                      ? `Curating for ${TIERS.find((t) => t.id === selectedTier)?.name ?? "tier"}`
                      : topInterestTiers.length
                        ? `Curating for your top ${Math.min(topInterestTiers.length, 4)} interest${topInterestTiers.length === 1 ? "" : "s"}`
                        : "Pick a tier or set interests in Settings"}
                  </p>
                </div>
              </div>
              <Button size="sm" onClick={handleFetchLive} disabled={curate.isPending} className="gap-1 shrink-0">
                {curate.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                {liveNews.length ? "Refresh" : "Fetch"}
              </Button>
            </div>

            {liveNews.length > 0 && (
              <div className="space-y-2">
                {liveNews.map((a, i) => {
                  const tier = TIERS.find((t) => t.id === a.tier_id);
                  return (
                    <div
                      key={`${a.url}-${i}`}
                      className="rounded-lg border border-border/50 bg-secondary/20 p-3 hover:border-crimson/40 transition-colors cursor-pointer"
                      onClick={() => handleOpenLive(a)}
                    >
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-crimson/15 text-crimson font-semibold uppercase tracking-wider">Live</span>
                        {tier && (
                          <span className="flex items-center gap-1" style={{ color: tier.color }}>
                            <TierIcon tierId={tier.id} size={12} />
                            <span className="text-[10px]">{tier.name}</span>
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground">· {a.source}</span>
                      </div>
                      <h3 className="text-sm font-medium text-foreground leading-snug">{a.title}</h3>
                      {a.summary && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.summary}</p>
                      )}
                      <div className="flex items-center justify-end mt-2">
                        <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={(e) => { e.stopPropagation(); handleOpenLive(a); }}>
                          <ExternalLink className="h-3 w-3" /> Open
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>


        <div className="space-y-3">
          {filteredArticles.map((article) => {
            const tier = TIERS.find((t) => t.id === article.tier);
            const locked = article.tier <= 3 && userLevel < TOP_TIER_GATE;
            return (
              <Card
                key={article.id}
                className={`bg-card border-border/50 transition-colors ${locked ? "opacity-50 cursor-not-allowed" : "hover:border-primary/20 cursor-pointer"}`}
                onClick={() => handleReadArticle(article.earnings, article.tier)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span style={{ color: tier?.color }}>{tier && <TierIcon tierId={tier.id} size={16} />}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">Tier {article.tier}</span>
                        <span className="text-[10px] text-muted-foreground">{article.source}</span>
                        {locked && <Lock className="h-3 w-3 text-muted-foreground ml-auto" />}
                      </div>
                      <h3 className="text-sm font-medium text-foreground leading-snug">{article.title}</h3>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{article.readTime}</span>
                        <span className="flex items-center gap-1 text-money font-medium"><DollarSign className="h-3 w-3" />{article.earnings.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur border-t border-border px-4 py-3 z-40">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-[10px] text-muted-foreground">Session Earnings</p>
                <p className="text-lg font-bold text-money">${sessionEarnings.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Articles</p>
                <p className="text-sm font-semibold text-foreground">{articleCount}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground">Active Multiplier</p>
              <p className="text-sm font-bold text-crimson">x{activeMultiplier.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="h-20" />
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
