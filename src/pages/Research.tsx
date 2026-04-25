import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TIERS } from "@/lib/mockData";
import { useArticles, useUserStats, useCurateNews, type LiveArticle } from "@/hooks/useAppData";
import { Star, Play, X, Clock, DollarSign, Video, Lock, ExternalLink, Sparkles, RefreshCw, Loader2 } from "lucide-react";
import { BrowserPicker } from "@/components/BrowserPicker";
import { InAppBrowser } from "@/components/InAppBrowser";
import { TierIcon } from "@/components/TierIcon";
import { useSettings, XP_PER_LEVEL, consentBonus } from "@/contexts/SettingsContext";
import { ExperienceBar } from "@/components/ExperienceBar";
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

function BannerAd({ position }: { position: "top" | "bottom" }) {
  return (
    <div className="bg-secondary/30 border border-border/30 rounded-lg p-3 text-center">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Sponsored</p>
      <div className="h-12 flex items-center justify-center text-xs text-muted-foreground">
        Banner Ad — {position === "top" ? "Above" : "Below"} Feed
      </div>
    </div>
  );
}

function InterstitialAd({ onClose }: { onClose: () => void }) {
  const [countdown, setCountdown] = useState(5);
  const [ratingShown, setRatingShown] = useState(false);

  useEffect(() => {
    const i = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(i);
          setRatingShown(true);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-background/95 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-4 text-center">
        <div className="bg-card rounded-xl p-8 border border-border/50 space-y-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Sponsored Content</p>
          <div className="h-48 bg-secondary/50 rounded-lg flex items-center justify-center text-muted-foreground">
            Full Screen Ad Placeholder
          </div>
          {!ratingShown ? (
            <p className="text-sm text-muted-foreground">Closing in {Math.max(0, countdown)}s...</p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-foreground">Rate this ad</p>
              <div className="flex justify-center">
                <StarRating onRate={() => setTimeout(onClose, 500)} />
              </div>
            </div>
          )}
          {ratingShown && (
            <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4 inline mr-1" />Skip
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Research() {
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [sessionEarnings, setSessionEarnings] = useState(0);
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [articleCount, setArticleCount] = useState(0);
  const [browser, setBrowser] = useState<{ url: string; engineName: string } | null>(null);
  const [showSponsoredVideos, setShowSponsoredVideos] = useState(false);
  const { topInterestTiers, cookieAutoAccept, gpsPrecision } = useSettings();
  const { data: stats } = useUserStats();
  const { data: liveArticles = [] } = useArticles();
  const curate = useCurateNews();
  const [liveNews, setLiveNews] = useState<LiveArticle[]>([]);

  const selectedTierData = TIERS.find((t) => t.id === (selectedTier ?? 4)) ?? TIERS[3];
  const primaryTierId = selectedTier ?? 4;
  const userLevel = stats?.level ?? 1;
  const activeMultiplier = selectedTierData.multiplier + consentBonus(cookieAutoAccept, gpsPrecision);

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
    setBrowser({ url: a.url, engineName: "Opera WebView" });
  };


  return (
    <AppLayout>
      <div className="space-y-4 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground">AddLogic Research</h1>
          <p className="text-sm text-muted-foreground">Browse via Opera WebView, earn from your curiosity.</p>
        </div>

        <button
          onClick={() => setShowSponsoredVideos((v) => !v)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-md bg-secondary/40 hover:bg-secondary/60 border border-border/40 text-xs"
        >
          <span className="flex items-center gap-2 text-foreground">
            <Video className="h-3.5 w-3.5 text-money" />
            Retributed Sponsor Videos available
          </span>
          <span className="text-money font-medium">{showSponsoredVideos ? "Hide" : "Show"} (3)</span>
        </button>

        {showSponsoredVideos && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-card border-border/50">
                <CardContent className="p-3">
                  <div className="aspect-video rounded bg-secondary/50 flex items-center justify-center mb-2">
                    <Play className="h-6 w-6 text-money" />
                  </div>
                  <p className="text-xs font-medium text-foreground">Sponsor clip #{i}</p>
                  <p className="text-[10px] text-muted-foreground">15s · earn $1.20 + 2× XP</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <BrowserPicker onSearch={(args) => setBrowser(args)} userLevel={userLevel} />

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

            <ExperienceBar baseMultiplier={selectedTierData.multiplier} earning />

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

        <div className="grid grid-cols-2 gap-2">
          <BannerAd position="top" />
          <BannerAd position="top" />
        </div>

        {selectedTier && (
          <Card className="bg-card border-primary/30 glow-amber">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Rewarded Video Available</p>
                <p className="text-xs text-muted-foreground">Watch 15s to earn $2.50 bonus + x2 XP for 10 min</p>
              </div>
              <Button size="sm" onClick={handleWatchVideo} className="gap-1">
                <Play className="h-3 w-3" /> Watch
              </Button>
            </CardContent>
          </Card>
        )}

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

        <div className="grid grid-cols-2 gap-2">
          <BannerAd position="bottom" />
          <BannerAd position="bottom" />
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

      {showInterstitial && <InterstitialAd onClose={() => setShowInterstitial(false)} />}
      {browser && (
        <InAppBrowser
          url={browser.url}
          fallbackUrl={browser.url}
          engineName={browser.engineName}
          primaryTierId={primaryTierId}
          onClose={() => setBrowser(null)}
        />
      )}
    </AppLayout>
  );
}
