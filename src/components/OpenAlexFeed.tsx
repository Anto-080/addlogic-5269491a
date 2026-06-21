import { Fragment, useState } from "react";
import { useOpenAlex, type OpenAlexWork } from "@/hooks/useOpenAlex";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, BookOpen, Newspaper, Search as SearchIcon } from "lucide-react";
import openAlexLogo from "@/assets/openalex-logo.png";
import mistralMark from "@/assets/mistral-mark.png";
import { useLockInterest } from "@/hooks/useLockInterest";
import { useTierKeywords } from "@/hooks/useTierKeywords";
import { TIERS } from "@/lib/mockData";
import { ScrollAdSlot } from "@/components/ScrollAdSlot";

type Props = {
  tierId: number;
  tierName: string;
  subcategories: string[];
  onOpenUrl: (url: string, tierId?: number) => void;
  onTierClassified?: (tierId: number) => void;
  adFallbackTierIds?: number[];
};

function ddgNewsUrl(query: string): string {
  return `https://duckduckgo.com/?q=${encodeURIComponent(query)}&ia=news&iar=news`;
}

/**
 * OpenAlex-backed scholarly feed for a tier's subcategories. Each chip fires
 * a fresh query; clicking "Open paper" sends the actual paper URL straight to
 * the in-app outbound browser (no detour through a search engine).
 *
 * Two chip rows are rendered:
 *  - default sub-interests (static, from TIERS.subcategories)
 *  - most-researched-by-you (dynamic, from tier_keywords.kind='subcategory'
 *    written by the Mistral classifier on past user queries)
 */
export function OpenAlexFeed({ tierId, tierName, subcategories, onOpenUrl, onTierClassified, adFallbackTierIds = [] }: Props) {
  const [active, setActive] = useState<string | null>(subcategories[0] ?? null);
  const [freeQuery, setFreeQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState<string | null>(null);
  const [classified, setClassified] = useState<{ tierId: number; tierName: string; confidence: number } | null>(null);
  const queryStr = submittedQuery ?? (active ? `${active} ${tierName}` : null);
  const { data: works = [], isLoading, isError } = useOpenAlex(queryStr);
  const lockInterest = useLockInterest();
  const tk = useTierKeywords();
  const userSubs = (tk.subcategories[tierId] ?? []).slice(0, 8);

  const runLock = (q: string) => {
    lockInterest(q, { onTierClassified }).then((cls) => {
      if (cls?.tierId) setClassified({ tierId: cls.tierId, tierName: cls.tierName ?? "", confidence: cls.confidence });
      else setClassified(null);
    });
  };

  const submitFreeSearch = () => {
    const v = freeQuery.trim();
    if (!v) return;
    runLock(v);
    setSubmittedQuery(v);
    setActive(null);
  };

  const pickSub = (s: string) => {
    setActive(s);
    setSubmittedQuery(null);
    setFreeQuery("");
    runLock(`${s} ${tierName}`);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center pb-1">
        <div
          className="border-2 border-black rounded-md px-3 py-1.5 inline-flex items-center justify-center"
          style={{ backgroundColor: "#ffffff" }}
        >
          <img src={openAlexLogo} alt="OpenAlex" className="brand-asset h-7 w-auto object-contain" />
        </div>
      </div>
      <div className="flex gap-2">
        <Input
          value={freeQuery}
          onChange={(e) => setFreeQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submitFreeSearch(); }}
          placeholder="Search OpenAlex scholarly works…"
          className="bg-secondary/50 h-9 text-sm"
        />
        <Button
          onClick={submitFreeSearch}
          disabled={isLoading || !freeQuery.trim()}
          size="sm"
          className="gap-1 shrink-0 bg-money hover:bg-money/90 text-white h-9"
        >
          {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <SearchIcon className="h-3.5 w-3.5" />}
          Search
        </Button>
      </div>
      {classified && (
        <div className="flex items-center gap-2 text-[11px] p-2 rounded-lg border border-primary/40 bg-primary/5 text-foreground">
          <img src={mistralMark} alt="Mistral" className="brand-asset h-3.5 w-3.5 shrink-0" />
          <span className="flex-1 min-w-0 truncate">
            Magnetic bar locked onto{" "}
            <strong style={{ color: TIERS.find((t) => t.id === classified.tierId)?.color }}>
              {classified.tierName}
            </strong>
            {" "}({Math.round(classified.confidence * 100)}% confidence)
          </span>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
          Default sub-interests
        </p>
        <div className="flex flex-wrap gap-1.5">
          {subcategories.map((s) => {
            const sel = s === active;
            return (
              <button
                key={s}
                onClick={() => pickSub(s)}
                className={`text-[11px] px-2 py-1 rounded-full border transition-colors ${
                  sel
                    ? "bg-primary/20 border-primary/50 text-foreground"
                    : "bg-secondary/40 border-border/40 text-foreground/80 hover:bg-secondary/60"
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold inline-flex items-center gap-1.5">
          <img src={mistralMark} alt="Mistral" className="brand-asset h-3 w-3" />
          Most-researched by you
        </p>
        {userSubs.length === 0 ? (
          <p className="text-[10px] text-muted-foreground italic">
            Run a search to grow this list.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {userSubs.map((k) => {
              const sel = k.keyword === active;
              return (
                <button
                  key={k.keyword}
                  onClick={() => pickSub(k.keyword)}
                  className={`text-[11px] px-2 py-1 rounded-full border transition-colors inline-flex items-center gap-1 ${
                    sel
                      ? "bg-primary/20 border-primary/50 text-foreground"
                      : "bg-secondary/40 border-border/40 text-foreground/80 hover:bg-secondary/60"
                  }`}
                >
                  <span>{k.keyword}</span>
                  <span className="text-[9px] text-muted-foreground">·{k.count}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-[10px] text-muted-foreground italic">
        Opens in the in-app browser — PDFs are filtered out so your session keeps tracking.
      </p>

      {active && (
        <div className="flex items-center justify-between gap-2 p-2 rounded-lg border border-money/30 bg-money/5">
          <span className="text-[11px] text-foreground/90 truncate">
            <strong>{active}</strong> news feed on DuckDuckGo
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1 text-xs shrink-0"
            onClick={() => onOpenUrl(ddgNewsUrl(`${active} ${tierName}`), tierId)}
          >
            <Newspaper className="h-3 w-3" /> Browse all
          </Button>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" /> Loading scholarly results…
        </div>
      )}
      {isError && (
        <p className="text-xs text-destructive">Could not load OpenAlex results.</p>
      )}
      {!isLoading && !isError && works.length === 0 && active && (
        <p className="text-xs text-muted-foreground italic">No results.</p>
      )}

      {/* Scholarly results stay open until the next chip / search replaces them. */}
      <div className="space-y-2">
        {works.map((w: OpenAlexWork, idx: number) => {
          const paperUrl = w.safe_url;
          return (
            <Fragment key={w.id}>
              <div className="rounded-lg border border-border/50 bg-secondary/20 p-3 space-y-2">
                <p className="text-sm font-medium text-foreground leading-snug">{w.title}</p>
                <p className="text-[11px] text-muted-foreground">
                  {[w.host_venue, w.publication_year, w.authors.join(", ")].filter(Boolean).join(" · ")}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-7 gap-1 text-xs"
                    disabled={!paperUrl}
                    onClick={() => paperUrl && onOpenUrl(paperUrl, tierId)}
                  >
                    <BookOpen className="h-3 w-3" /> Open paper
                  </Button>
                </div>
              </div>
              {(idx + 1) % 3 === 0 && idx < works.length - 1 && (
                <ScrollAdSlot
                  tierId={tierId}
                  fallbackTierIds={adFallbackTierIds}
                  onOpenUrl={(url, t) => onOpenUrl(url, t)}
                />
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
