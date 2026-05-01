import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Lock } from "lucide-react";
import { DuckDuckGoLogo } from "@/components/icons/DuckDuckGoLogo";
import { recordSearch } from "@/lib/userInterestProfiler";
import { bumpSearchCount } from "@/lib/zeroPartyCookies";
import { useWebSearch } from "@/hooks/useWebSearch";
import { SearchResults, type SearchResultItem } from "@/components/SearchResults";

type BrowserPickerProps = {
  onOpenResult?: (item: SearchResultItem) => void;
  userLevel?: number;
};

const SEARCH_GATE_LEVEL = 25;

/**
 * In-app search powered by DuckDuckGo (parsed server-side in our edge function).
 * We don't iframe DDG — every search engine sends X-Frame-Options: SAMEORIGIN,
 * which causes net::ERR_BLOCKED_BY_RESPONSE. Results render here as cards.
 */
export function BrowserPicker({ onOpenResult, userLevel = 0 }: BrowserPickerProps) {
  const [lastQuery, setLastQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const search = useWebSearch();
  const gated = userLevel < SEARCH_GATE_LEVEL;

  const runSearch = async (query: string) => {
    if (gated) return;
    setLastQuery(query);
    recordSearch(query);
    bumpSearchCount();
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
          <DuckDuckGoLogo size={20} />
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
          <DuckDuckGoLogo size={32} />
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
          <SearchResults
            initialQuery={lastQuery}
            results={results}
            loading={search.isPending}
            error={search.error ? (search.error as Error).message : null}
            onSearch={runSearch}
            onOpen={(item) => onOpenResult?.(item)}
          />
        )}
      </CardContent>
    </Card>
  );
}
