import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ExternalLink, Loader2, Search } from "lucide-react";
import plosFooterAsset from "@/assets/plos-footer.png.asset.json";
import plosColorAsset from "@/assets/plos-color.png.asset.json";
import mistralMark from "@/assets/mistral-mark.png";
import synapsesAsset from "@/assets/hippocampal-synapses.gif.asset.json";
import { usePlosSearch, type PlosResult } from "@/hooks/usePlosSearch";
import { useLockInterest } from "@/hooks/useLockInterest";
import { TIERS } from "@/lib/mockData";

const EVERGREEN = "#05472A";

type Props = {
  /** Whether the LinkedIn block should be shown (top-tier gate not yet reached). */
  showLinkedIn: boolean;
  onOpenUrl: (url: string) => void;
};

export function PlosCard({ showLinkedIn, onOpenUrl }: Props) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<PlosResult[]>([]);
  const [classified, setClassified] = useState<{ tierId: number; tierName: string; confidence: number } | null>(null);
  const search = usePlosSearch();
  const lockInterest = useLockInterest();

  const run = async () => {
    if (q.trim().length < 2) return;
    try {
      lockInterest(q.trim()).then((cls) => {
        if (cls?.tierId) setClassified({ tierId: cls.tierId, tierName: cls.tierName ?? "", confidence: cls.confidence });
        else setClassified(null);
      });
      const r = await search.mutateAsync(q.trim());
      setResults(r);
    } catch {
      setResults([]);
    }
  };

  return (
    <Card className="bg-card border-border/50 overflow-hidden">
      <Collapsible open={panelOpen} onOpenChange={setPanelOpen}>
        {/* Closed state — PLOS logo stretched across the full card width */}
        {!panelOpen && (
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="w-full block hover:opacity-90 transition-opacity py-4"
              aria-label="Open PLOS section"
            >
              <img
                src={plosFooterAsset.url}
                alt="PLOS — Public Library of Science"
                className="brand-asset block mx-auto object-contain"
                style={{ height: 117, maxWidth: "88%" }}
              />
            </button>
          </CollapsibleTrigger>
        )}

        <CollapsibleContent>
          {/* Open state — the synapse animation covers the whole upper block:
              logo, search row and the LinkedIn button all sit on top of it. */}
          <div className="relative min-h-[460px] flex flex-col">
            <img
              src={synapsesAsset.url}
              alt="Adult hippocampal spaced synapses animation"
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-background/55" />

            <div className="relative p-4 space-y-4 flex-1 flex flex-col justify-center">
              <CollapsibleTrigger asChild>
                <button type="button" className="w-full block" aria-label="Close PLOS section">
                  <img
                    src={plosColorAsset.url}
                    alt="PLOS — Public Library of Science"
                    className="brand-asset mx-auto object-contain drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]"
                    style={{ maxHeight: 196, maxWidth: "92%" }}
                  />
                  <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-foreground/70 rotate-180" />
                </button>
              </CollapsibleTrigger>


              <div className="text-right">
                <button
                  type="button"
                  onClick={() => onOpenUrl("https://plos.org")}
                  className="text-[11px] tracking-wide text-foreground/70 hover:text-foreground"
                >
                  ⟩PLOS →
                </button>
              </div>

              {/* Search row — fully transparent input */}
              <div className="flex gap-2">
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") run(); }}
                  placeholder="Search PLOS articles —"
                  className="text-xs h-9 bg-transparent border-border/60 focus-visible:ring-1"
                />
                <Button size="sm" onClick={run} disabled={search.isPending} className="gap-1 shrink-0 h-9">
                  {search.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
                  Search
                </Button>
              </div>

              {showLinkedIn && (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg border border-border/50 bg-background/40 backdrop-blur-sm">
                  <p className="text-xs text-muted-foreground">
                    — <span className="text-foreground font-medium">For Biochemical Researchers Only</span> —
                  </p>
                  <Button
                    size="sm"
                    className="gap-2 self-start shrink-0 text-white hover:opacity-90"
                    style={{ backgroundColor: EVERGREEN }}
                  >
                    <ExternalLink className="h-3 w-3" /> Connect with LinkedIn
                  </Button>
                </div>
              )}
            </div>
          </div>

          <CardContent className="p-4 space-y-3">


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
            {search.error && (
              <p className="text-xs text-destructive">Could not load PLOS results.</p>
            )}
            {!search.isPending && results.length === 0 && q && (
              <p className="text-xs text-muted-foreground italic">No results yet.</p>
            )}
            <div className="space-y-2">
              {results.map((r) => (
                <div key={r.id} className="rounded-lg border border-border/50 bg-secondary/20 p-3 space-y-1">
                  <p className="text-sm font-medium text-foreground leading-snug">{r.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {[r.journal, r.date?.slice(0, 10)].filter(Boolean).join(" · ")}
                  </p>
                  {r.abstract && (
                    <p className="text-[11px] text-muted-foreground line-clamp-2">{r.abstract}…</p>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 gap-1 text-xs"
                    onClick={() => onOpenUrl(r.url)}
                  >
                    <ExternalLink className="h-3 w-3" /> Open article
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
