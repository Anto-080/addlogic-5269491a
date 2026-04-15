import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TIERS, MOCK_ARTICLES } from "@/lib/mockData";
import { Star, Play, X, Search, Clock, DollarSign } from "lucide-react";

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
          onClick={() => { setRating(n); onRate(n); }}
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

  useState(() => {
    const i = setInterval(() => setCountdown((c) => { if (c <= 1) { clearInterval(i); setRatingShown(true); } return c - 1; }), 1000);
  });

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
  const [searchQuery, setSearchQuery] = useState("");
  const [articleCount, setArticleCount] = useState(0);

  const filteredArticles = MOCK_ARTICLES.filter((a) => {
    if (selectedTier && a.tier !== selectedTier) return false;
    if (searchQuery && !a.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleReadArticle = (earnings: number) => {
    setSessionEarnings((s) => s + earnings);
    setArticleCount((c) => {
      const next = c + 1;
      if (next % 5 === 0) setShowInterstitial(true);
      return next;
    });
  };

  const handleWatchVideo = () => {
    setSessionEarnings((s) => s + 2.50);
  };

  return (
    <AppLayout>
      <div className="space-y-4 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Research Browser</h1>
          <p className="text-sm text-muted-foreground">Select a tier, browse articles, and earn from your curiosity.</p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search topics, articles, interests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-secondary/50"
          />
        </div>

        {/* Tier Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <Button variant={selectedTier === null ? "default" : "secondary"} size="sm" onClick={() => setSelectedTier(null)}>All</Button>
          {TIERS.map((t) => (
            <Button key={t.id} variant={selectedTier === t.id ? "default" : "secondary"} size="sm" onClick={() => setSelectedTier(t.id)} className="shrink-0">
              {t.icon} <span className="ml-1 text-xs">{t.id}</span>
            </Button>
          ))}
        </div>

        {/* Top Banner Ads */}
        <div className="grid grid-cols-2 gap-2">
          <BannerAd position="top" />
          <BannerAd position="top" />
        </div>

        {/* Rewarded Video */}
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

        {/* Articles Feed */}
        <div className="space-y-3">
          {filteredArticles.map((article) => {
            const tier = TIERS.find((t) => t.id === article.tier);
            return (
              <Card key={article.id} className="bg-card border-border/50 hover:border-primary/20 transition-colors cursor-pointer" onClick={() => handleReadArticle(article.earnings)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm">{tier?.icon}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">Tier {article.tier}</span>
                        <span className="text-[10px] text-muted-foreground">{article.source}</span>
                      </div>
                      <h3 className="text-sm font-medium text-foreground leading-snug">{article.title}</h3>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{article.readTime}</span>
                        <span className="flex items-center gap-1 text-gold font-medium"><DollarSign className="h-3 w-3" />{article.earnings.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bottom Banner Ads */}
        <div className="grid grid-cols-2 gap-2">
          <BannerAd position="bottom" />
          <BannerAd position="bottom" />
        </div>

        {/* Sticky Session Tracker */}
        <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur border-t border-border px-4 py-3 z-40">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-[10px] text-muted-foreground">Session Earnings</p>
                <p className="text-lg font-bold text-gradient-gold">${sessionEarnings.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Articles</p>
                <p className="text-sm font-semibold text-foreground">{articleCount}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground">Active Multiplier</p>
              <p className="text-sm font-bold text-crimson">x9.5</p>
            </div>
          </div>
        </div>

        {/* Spacer for sticky bar */}
        <div className="h-20" />
      </div>

      {showInterstitial && <InterstitialAd onClose={() => setShowInterstitial(false)} />}
    </AppLayout>
  );
}
