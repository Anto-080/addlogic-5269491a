import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Lock } from "lucide-react";
import { OperaLogo } from "@/components/icons/OperaLogo";
import { recordSearch } from "@/lib/userInterestProfiler";
import { useAdminFlags } from "@/hooks/useAdminFlags";
import { useWebSearch } from "@/hooks/useWebSearch";
import { SearchResults, type SearchResultItem } from "@/components/SearchResults";

type BrowserPickerProps = {
  /**
   * Called when the user opens a result. The parent decides whether to show
   * the in-app overlay or hand off to a new tab.
   */
  onOpenResult?: (item: SearchResultItem) => void;
  userLevel?: number;
};

const SEARCH_GATE_LEVEL = 25;

/**
 * In-app search powered by our own results page (Firecrawl-backed edge
 * function). We do NOT iframe an external engine — every mainstream search
 * site sends X-Frame-Options: SAMEORIGIN and would error out with
 * net::ERR_BLOCKED_BY_RESPONSE.
 */
export function BrowserPicker({ onOpenResult, userLevel = 0 }: BrowserPickerProps) {
  const [lastQuery, setLastQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const search = useWebSearch();
  const { data: flags } = useAdminFlags();
  const gated = userLevel < SEARCH_GATE_LEVEL && !flags?.force_opera_search;

  const runSearch = async (query: string) => {
    if (gated) return;
    setLastQuery(query);
    recordSearch(query);
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
          <OperaLogo size={20} />
          Powered by Opera WebView
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Searches run through our hardened in-app pipeline — no third-party engine is loaded inside the frame
          (every major engine refuses iframe embedding, which is what previously broke this feature). Results
          are fetched server-side and rendered here as cards. Cookie auto-accept and device telemetry continue
          working normally.
        </p>

        <div className="flex items-center gap-2 p-3 rounded-lg border border-[#9A7246]/30 bg-[#9A7246]/5">
          <OperaLogo size={32} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground">Opera WebView</p>
            <p className="text-[10px] text-muted-foreground leading-tight inline-flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-money" />
              Anti-fraud · anti-malware · crypto wallet aware
            </p>
          </div>
          <span className="text-[10px] uppercase tracking-wider text-money font-medium">Default</span>
        </div>

        {gated ? (
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground p-3 rounded-lg border border-dashed border-border/50">
            <Lock className="h-3 w-3" />
            In-app Opera search unlocks at <span className="text-money font-semibold">Level {SEARCH_GATE_LEVEL}</span> — keep researching to unlock.
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
