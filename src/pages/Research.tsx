import { useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TIERS } from "@/lib/mockData";
import { useArticles, useUserStats, useCurateNews, type LiveArticle } from "@/hooks/useAppData";
import { Clock, DollarSign, Lock, ExternalLink, RefreshCw, Loader2 } from "lucide-react";
import anthropicMark from "@/assets/anthropic-mark.png";
import { BrowserPicker } from "@/components/BrowserPicker";
import { ExitInterstitial } from "@/components/ExitInterstitial";
import { useOutboundExit } from "@/hooks/useOutboundExit";
import { TierIcon } from "@/components/TierIcon";
import { useSettings, XP_PER_LEVEL, consentBonus } from "@/contexts/SettingsContext";
import { ExperienceBar } from "@/components/ExperienceBar";
import { OpenAlexFeed } from "@/components/OpenAlexFeed";
import { PlosCard } from "@/components/PlosCard";
import { toast } from "sonner";

const TOP_TIER_GATE = 35;
const DEFAULT_TIER = 4;

export default function Research() {
  const [selectedTier, setSelectedTier] = useState<number>(DEFAULT_TIER);
  const [sessionEarnings, setSessionEarnings] = useState(0);
  const [articleCount, setArticleCount] = useState(0);
  const exit = useOutboundExit();
  const { topInterestTiers, cookieAutoAccept, gpsPrecision } = useSettings();
  const { data: stats } = useUserStats();
  const { data: liveArticles = [] } = useArticles();
  const curate = useCurateNews();
  const [liveNews, setLiveNews] = useState<LiveArticle[]>([]);

  const selectedTierData = TIERS.find((t) => t.id === selectedTier) ?? TIERS[3];
  const primaryTierId = selectedTier;
  const userLevel = stats?.level ?? 1;
  const activeMultiplier = selectedTierData.multiplier + consentBonus(cookieAutoAccept, gpsPrecision);

  const filteredArticles = useMemo(() => {
    let list = liveArticles
      .filter((a) => a.tier_id === selectedTier)
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
    setArticleCount((c) => c + 1);
  };

  const handleFetchLive = async () => {
    const ids = [selectedTier];
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


        {/* PLOS banner + LinkedIn (Biochem-only) + collapsible PLOS search */}
        <PlosCard
          showLinkedIn={userLevel < TOP_TIER_GATE}
          onOpenUrl={(url) => exit.requestExit(url, primaryTierId)}
        />

        {/* XP / Tiers / DuckDuckGo combined card */}
        <Card className="bg-card border-border/60 glow-amber">
          <CardContent className="p-4 space-y-3">
            <ExperienceBar baseMultiplier={selectedTierData.multiplier} earning />

            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Each level requires <span className="text-foreground font-medium">{XP_PER_LEVEL.toLocaleString()} XP</span>. XP advances in real time while you are active in the Research Room. The <span className="text-crimson font-medium">Crimson Multiplier</span> increases the XP earned per second based on your selected tier and active data permissions.
            </p>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {TIERS.map((t) => (
                <Button
                  key={t.id}
                  variant={selectedTier === t.id ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setSelectedTier(t.id)}
                  className="shrink-0 gap-1"
                  style={selectedTier === t.id ? undefined : { color: t.color }}
                  aria-label={t.name}
                >
                  <TierIcon tierId={t.id} size={14} />
                </Button>
              ))}
            </div>

            <BrowserPicker
              onOpenResult={(item) => exit.requestExit(item.url, primaryTierId)}
              onTierClassified={(tierId) => setSelectedTier(tierId)}
            />
          </CardContent>
        </Card>

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

        <Card className="bg-card border-money/30">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <img src={anthropicMark} alt="Anthropic" className="brand-asset h-4 w-4 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">Live news from Claude</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    Curating for {TIERS.find((t) => t.id === selectedTier)?.name ?? "tier"}
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
                      className="rounded-lg border border-border/50 bg-secondary/20 p-3 hover:border-money/40 transition-colors cursor-pointer"
                      onClick={() => handleOpenLive(a)}
                    >
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-money/15 text-money font-semibold uppercase tracking-wider">Live</span>
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
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-4 min-w-0">
              <div>
                <p className="text-[10px] text-muted-foreground">Session Earnings</p>
                <p className="text-lg font-bold text-money">T${sessionEarnings.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Articles</p>
                <p className="text-sm font-semibold text-foreground">{articleCount}</p>
              </div>
              {stats?.locked_query && stats?.locked_until && new Date(stats.locked_until).getTime() > Date.now() && (
                <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-full border border-primary/40 bg-primary/10 min-w-0">
                  <img src={mistralMark} alt="Mistral" className="brand-asset h-3 w-3 shrink-0" />
                  <span className="text-[10px] text-foreground/80 truncate max-w-[160px]">Locked: {stats.locked_query}</span>
                </div>
              )}
            </div>
            <div className="text-right inline-flex items-center gap-1.5">
              <img src={mistralMark} alt="Mistral" className="brand-asset h-3 w-3" />
              <div>
                <p className="text-[10px] text-muted-foreground">Active Multiplier</p>
                <p className="text-sm font-bold text-primary">x{(stats?.current_multiplier ?? activeMultiplier).toFixed(2)}</p>
              </div>
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
