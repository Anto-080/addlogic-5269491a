import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";
import mistralMark from "@/assets/mistral-mark.png";
import { DuckDuckGoLogo } from "@/components/icons/DuckDuckGoLogo";
import { useWebSearch } from "@/hooks/useWebSearch";
import { SearchResults, type SearchResultItem } from "@/components/SearchResults";
import { useLockInterest } from "@/hooks/useLockInterest";
import { TIERS } from "@/lib/mockData";

type BrowserPickerProps = {
  onOpenResult?: (item: SearchResultItem) => void;
  /** Fired when the Mistral classifier confidently maps a query to a tier. */
  onTierClassified?: (tierId: number) => void;
  /** Active tier id for the between-result sponsor strips. */
  adTierId?: number;
  adFallbackTierIds?: number[];
  /** Called when a sponsor ad in a strip is double-clicked. */
  onSponsorOpen?: (url: string, tierId: number) => void;
};

const MIN_TIER_CONFIDENCE = 0.4;

/**
 * In-app search powered by DuckDuckGo (parsed server-side in our edge function).
 * We don't iframe DDG — every search engine sends X-Frame-Options: SAMEORIGIN,
 * which causes net::ERR_BLOCKED_BY_RESPONSE. Results render here as cards.
 *
 * Also: every submitted query is fed through the Mistral Agent
 * classification (`classify-interest` edge fn). The detected tier becomes
 * the active research session (drives tier XP) and noun keywords are
 * persisted as that tier's discovered subcategories.
 */
export function BrowserPicker({ onOpenResult, onTierClassified }: BrowserPickerProps) {
  const [lastQuery, setLastQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [classified, setClassified] = useState<{ tierId: number; tierName: string; confidence: number } | null>(null);
  const search = useWebSearch();
  const lockInterest = useLockInterest();

  const runSearch = async (query: string) => {
    setLastQuery(query);

    // Fire Mistral + search in parallel; the shared lock hook drives the
    // active research session, multiplier, and discovered subcategories.
    lockInterest(query, { onTierClassified, minConfidence: MIN_TIER_CONFIDENCE }).then((cls) => {
      if (!cls || !cls.tierId) {
        setClassified(null);
        return;
      }
      setClassified({ tierId: cls.tierId, tierName: cls.tierName ?? "", confidence: cls.confidence });
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

        {classified && (
          <div
            className={`flex items-center gap-2 text-[11px] p-2 rounded-lg border ${
              classified.confidence >= MIN_TIER_CONFIDENCE
                ? "border-primary/40 bg-primary/5 text-foreground"
                : "border-border/40 bg-secondary/30 text-muted-foreground"
            }`}
          >
            <img src={mistralMark} alt="Mistral" className="brand-asset h-3.5 w-3.5 shrink-0" />
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
      </CardContent>
    </Card>
  );
}
