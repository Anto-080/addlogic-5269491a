import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ExternalLink, Loader2, Search } from "lucide-react";
import plosLogo from "@/assets/plos-logo.png";
import { usePlosSearch, type PlosResult } from "@/hooks/usePlosSearch";
import { useLockInterest } from "@/hooks/useLockInterest";

type Props = {
  /** Whether the LinkedIn block should be shown (top-tier gate not yet reached). */
  showLinkedIn: boolean;
  onOpenUrl: (url: string) => void;
};

export function PlosCard({ showLinkedIn, onOpenUrl }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<PlosResult[]>([]);
  const search = usePlosSearch();
  const lockInterest = useLockInterest();

  const run = async () => {
    if (q.trim().length < 2) return;
    try {
      lockInterest(q.trim());
      const r = await search.mutateAsync(q.trim());
      setResults(r);
    } catch {
      setResults([]);
    }
  };

  return (
    <Card className="bg-card border-border/50 overflow-hidden">
      <button
        type="button"
        onClick={() => onOpenUrl("https://plos.org")}
        className="w-full block hover:bg-secondary/20 transition-colors"
        aria-label="Visit PLOS site"
      >
        <img
          src={plosLogo}
          alt="PLOS — Public Library of Science"
          className="brand-asset mx-auto object-contain px-4 py-2"
          style={{ maxHeight: 44, width: "auto", maxWidth: 260 }}
        />
        <div className="px-4 pb-2 text-right">
          <span className="text-[11px] tracking-wide text-foreground/60 hover:text-foreground">⟩PLOS →</span>
        </div>
      </button>

      <CardContent className="p-4 space-y-3">
        {showLinkedIn && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg border border-border/50 bg-secondary/20">
            <p className="text-xs text-muted-foreground">
              Connect with LinkedIn — <span className="text-foreground font-medium">For Biochemical Researchers Only</span>
            </p>
            <Button size="sm" variant="secondary" className="gap-2 self-start shrink-0">
              <ExternalLink className="h-3 w-3" /> Connect with LinkedIn
            </Button>
          </div>
        )}

        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="w-full flex items-center justify-between p-3 rounded-lg border border-border/50 bg-secondary/20 hover:bg-secondary/30 transition-colors"
            >
              <span className="text-xs font-medium text-foreground inline-flex items-center gap-2">
                <Search className="h-3.5 w-3.5" /> Search PLOS articles
              </span>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 space-y-3">
            <div className="flex gap-2">
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") run(); }}
                placeholder="e.g. CRISPR off-target effects"
                className="text-xs h-9"
              />
              <Button size="sm" onClick={run} disabled={search.isPending} className="gap-1 shrink-0 h-9">
                {search.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
                Search
              </Button>
            </div>
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
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
