import { useState } from "react";
import { useOpenAlex, type OpenAlexWork } from "@/hooks/useOpenAlex";
import { Button } from "@/components/ui/button";
import { Loader2, BookOpen, Newspaper } from "lucide-react";
import openAlexLogo from "@/assets/openalex-logo.png";

type Props = {
  tierName: string;
  subcategories: string[];
  onOpenUrl: (url: string) => void;
};

function ddgNewsUrl(query: string): string {
  return `https://duckduckgo.com/?q=${encodeURIComponent(query)}&ia=news&iar=news`;
}

/**
 * OpenAlex-backed scholarly feed for a tier's subcategories. Each chip fires
 * a fresh query; clicking "Open paper" sends the actual paper URL straight to
 * the in-app outbound browser (no detour through a search engine).
 */
export function OpenAlexFeed({ tierName, subcategories, onOpenUrl }: Props) {
  const [active, setActive] = useState<string | null>(subcategories[0] ?? null);
  const queryStr = active ? `${active} ${tierName}` : null;
  const { data: works = [], isLoading, isError } = useOpenAlex(queryStr);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center pb-1">
        <img src={openAlexLogo} alt="OpenAlex" className="h-7 w-auto object-contain dark:invert" />
      </div>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
        Scholarly feed (OpenAlex) · choose a sub-interest
      </p>
      <p className="text-[10px] text-muted-foreground italic">
        Opens in the in-app browser — PDFs are filtered out so your session keeps tracking.
      </p>
      <div className="flex flex-wrap gap-1.5">
        {subcategories.map((s) => {
          const sel = s === active;
          return (
            <button
              key={s}
              onClick={() => setActive(s)}
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

      {active && (
        <div className="flex items-center justify-between gap-2 p-2 rounded-lg border border-crimson/30 bg-crimson/5">
          <span className="text-[11px] text-foreground/90 truncate">
            <strong>{active}</strong> news feed on DuckDuckGo
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1 text-xs shrink-0"
            onClick={() => onOpenUrl(ddgNewsUrl(`${active} ${tierName}`))}
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

      <div className="space-y-2">
        {works.map((w: OpenAlexWork) => {
          const paperUrl = w.safe_url;
          return (
            <div key={w.id} className="rounded-lg border border-border/50 bg-secondary/20 p-3 space-y-2">
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
                  onClick={() => paperUrl && onOpenUrl(paperUrl)}
                >
                  <BookOpen className="h-3 w-3" /> Open paper
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
