import { ExternalLink, Loader2, ShieldCheck, Search as SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Fragment, useState } from "react";
import { ScrollAdSlot } from "@/components/ScrollAdSlot";

export type SearchResultItem = {
  title: string;
  url: string;
  snippet: string;
  source: string;
};

type Props = {
  initialQuery?: string;
  results: SearchResultItem[];
  loading: boolean;
  error: string | null;
  onSearch: (query: string) => void;
  onOpen: (item: SearchResultItem) => void;
  adTierId?: number;
  adFallbackTierIds?: number[];
  onSponsorOpen?: (url: string, tierId: number) => void;
};

/**
 * In-app search results panel. We render results ourselves — embedding any
 * mainstream search engine in an iframe is blocked by X-Frame-Options /
 * frame-ancestors, so this avoids the ERR_BLOCKED_BY_RESPONSE error.
 */
export function SearchResults({
  initialQuery = "",
  results,
  loading,
  error,
  onSearch,
  onOpen,
  adTierId,
  adFallbackTierIds = [],
  onSponsorOpen,
}: Props) {
  const [q, setQ] = useState(initialQuery);

  const submit = () => {
    const v = q.trim();
    if (v) onSearch(v);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          placeholder="Search the web…"
          className="bg-secondary/50"
        />
        <Button onClick={submit} disabled={loading || !q.trim()} className="gap-2 shrink-0 bg-money hover:bg-money/90 text-white">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SearchIcon className="h-4 w-4" />}
          Search
        </Button>
      </div>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {!loading && !error && results.length === 0 && initialQuery && (
        <p className="text-xs text-muted-foreground italic">No results.</p>
      )}

      {/* Results stay rendered until the next search replaces them — no auto-collapse. */}
      <div className="space-y-2">
        {results.map((r, idx) => (
          <Fragment key={r.url}>
            <button
              type="button"
              onClick={() => onOpen(r)}
              className="w-full text-left p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 border border-border/40 transition-colors"
            >
              <div className="flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-money mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{r.title}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{r.source}</p>
                  {r.snippet && (
                    <p className="text-xs text-foreground/80 mt-1 line-clamp-3">{r.snippet}</p>
                  )}
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1" />
              </div>
            </button>
            {onSponsorOpen && adTierId && (idx + 1) % 3 === 0 && idx < results.length - 1 && (
              <ScrollAdSlot
                tierId={adTierId}
                fallbackTierIds={adFallbackTierIds}
                onOpenUrl={onSponsorOpen}
              />
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
