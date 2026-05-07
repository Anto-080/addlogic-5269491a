import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Sparkles } from "lucide-react";
import { DuckDuckGoLogo } from "@/components/icons/DuckDuckGoLogo";
import { recordSearch } from "@/lib/userInterestProfiler";
import { bumpSearchCount } from "@/lib/zeroPartyCookies";
import { useWebSearch } from "@/hooks/useWebSearch";
import { SearchResults, type SearchResultItem } from "@/components/SearchResults";
import { useClassifyInterest, extractKeywords, persistKeywords } from "@/hooks/useClassifyInterest";
import { useResearchSession } from "@/contexts/ResearchSessionContext";
import { useAuth } from "@/hooks/useAuth";
import { TIERS } from "@/lib/mockData";

type BrowserPickerProps = {
  onOpenResult?: (item: SearchResultItem) => void;
  /** @deprecated kept for backward-compat; search is now always unlocked. */
  userLevel?: number;
};

const MIN_TIER_CONFIDENCE = 0.4;

/**
 * In-app search powered by DuckDuckGo (parsed server-side in our edge function).
 * We don't iframe DDG — every search engine sends X-Frame-Options: SAMEORIGIN,
 * which causes net::ERR_BLOCKED_BY_RESPONSE. Results render here as cards.
 *
 * Also: every submitted query is fed through HuggingFace zero-shot
 * classification (`classify-interest` edge fn). The detected tier becomes
 * the active research session (drives tier XP) and noun keywords are
 * persisted as that tier's discovered subcategories.
 */
export function BrowserPicker({ onOpenResult }: BrowserPickerProps) {
  const { user } = useAuth();
  const [lastQuery, setLastQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [classified, setClassified] = useState<{ tierId: number; tierName: string; confidence: number } | null>(null);
  const search = useWebSearch();
  const classify = useClassifyInterest();
  const session = useResearchSession();

  const runSearch = async (query: string) => {
    setLastQuery(query);
    recordSearch(query);
    bumpSearchCount();

    // Fire classifier + search in parallel; the classifier drives the
    // active research session and discovered subcategories.
    classify.mutateAsync(query).then(async (cls) => {
      if (!cls || !cls.tierId) {
        setClassified(null);
        return;
      }
      setClassified({ tierId: cls.tierId, tierName: cls.tierName ?? "", confidence: cls.confidence });
      if (cls.confidence >= MIN_TIER_CONFIDENCE) {
        // Pulse the session so XP for this tier starts ticking.
        session.pulse(cls.tierId, "search", 90_000);
        if (user) {
          const kws = extractKeywords(query);
          // Best-effort, never blocks the UI.
          persistKeywords(user.id, cls.tierId, kws).catch(() => undefined);
        }
      }
    }).catch(() => setClassified(null));

    try {
      const r = await search.mutateAsync(query);
      setResults(r);
    } catch {
      setResults([]);
    }
  };

  return (
    <Card className="bg-card border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          Powered by DuckDuckGo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Searches are fetched server-side through the DuckDuckGo HTML endpoint and rendered here as
          native cards — no third-party page is iframed (every major engine refuses iframe embedding,
          which is what previously broke this feature). Cookie auto-accept and device telemetry continue
          working normally.
        </p>

        <div className="flex items-center gap-2 p-3 rounded-lg border border-[#DE5833]/30 bg-[#DE5833]/5">
          <DuckDuckGoLogo size={72} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground">DuckDuckGo</p>
            <p className="text-[10px] text-muted-foreground leading-tight inline-flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-money" />
              No tracking · no profiling · privacy-first
            </p>
          </div>
          <span className="text-[10px] uppercase tracking-wider text-money font-medium">Default</span>
        </div>

        {gated ? (
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground p-3 rounded-lg border border-dashed border-border/50">
            <Lock className="h-3 w-3" />
            In-app search unlocks at <span className="text-money font-semibold">Level {SEARCH_GATE_LEVEL}</span> — keep researching to unlock.
          </div>
        ) : (
          <>
            {classified && (
              <div
                className={`flex items-center gap-2 text-[11px] p-2 rounded-lg border ${
                  classified.confidence >= MIN_TIER_CONFIDENCE
                    ? "border-crimson/40 bg-crimson/5 text-foreground"
                    : "border-border/40 bg-secondary/30 text-muted-foreground"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5 text-crimson shrink-0" />
                <span className="flex-1 min-w-0 truncate">
                  Magnetic bar locked onto{" "}
                  <strong style={{ color: TIERS.find((t) => t.id === classified.tierId)?.color }}>
                    {classified.tierName}
                  </strong>
                  {" "}({Math.round(classified.confidence * 100)}% confidence)
                </span>
                {classified.confidence < MIN_TIER_CONFIDENCE && (
                  <span className="text-[10px] italic">below veracity threshold — XP paused</span>
                )}
              </div>
            )}
            <SearchResults
              initialQuery={lastQuery}
              results={results}
              loading={search.isPending}
              error={search.error ? (search.error as Error).message : null}
              onSearch={runSearch}
              onOpen={(item) => onOpenResult?.(item)}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
