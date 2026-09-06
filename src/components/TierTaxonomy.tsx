import { useState } from "react";
import { ChevronRight } from "lucide-react";
import mistralMark from "@/assets/mistral-mark.png";
import type { TierKeyword } from "@/hooks/useTierKeywords";

type Props = {
  subcategories: TierKeyword[];
  subinterests: TierKeyword[];
  clusters: TierKeyword[];
  keywords: TierKeyword[];
};

/**
 * Collapsible zero-party taxonomy for one tier.
 * Subcategory rows regroup every dependent sub-interest; the number shown next
 * to a subcategory is the SUM of its sub-interest counts. Clusters and raw
 * keywords live in a single collapsed section so they never flood the folder.
 */
export function TierTaxonomy({ subcategories, subinterests, clusters, keywords }: Props) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [zeroOpen, setZeroOpen] = useState(false);

  const childrenOf = (sub: string) => subinterests.filter((s) => s.parent === sub);
  const orphans = subinterests.filter(
    (s) => !s.parent || !subcategories.some((c) => c.keyword === s.parent),
  );
  const zeroParty = [...clusters, ...keywords];

  if (!subcategories.length && !subinterests.length && !zeroParty.length) return null;

  return (
    <div className="mt-3 space-y-1.5">
      {subcategories.length > 0 && (
        <p className="text-[11px] text-primary mb-1 inline-flex items-center gap-1.5">
          <img src={mistralMark} alt="Mistral" className="brand-asset h-3 w-3" />
          Your subcategories (from your searches):
        </p>
      )}

      {subcategories.map((sub) => {
        const kids = childrenOf(sub.keyword);
        const total = kids.reduce((n, k) => n + k.count, 0) || sub.count;
        const isOpen = !!open[sub.keyword];
        return (
          <div key={sub.keyword} className="rounded-lg border border-primary/30 bg-primary/5">
            <button
              type="button"
              onClick={() => setOpen((o) => ({ ...o, [sub.keyword]: !o[sub.keyword] }))}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left"
            >
              <ChevronRight
                className={`h-3.5 w-3.5 text-primary transition-transform ${isOpen ? "rotate-90" : ""}`}
              />
              <span className="text-xs text-foreground/90 flex-1 min-w-0 truncate">{sub.keyword}</span>
              <span className="text-[11px] text-muted-foreground">×{total}</span>
            </button>
            {isOpen && (
              <div className="px-3 pb-2 pl-6 flex flex-wrap gap-2">
                {kids.length === 0 && (
                  <span className="text-[11px] text-muted-foreground italic">No sub-interests yet</span>
                )}
                {kids.map((k) => (
                  <span
                    key={k.keyword}
                    className="text-xs px-2 py-1 rounded-full bg-primary/10 text-foreground/90 border border-primary/25"
                  >
                    {k.keyword} <span className="text-muted-foreground">×{k.count}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {orphans.length > 0 && (
        <div className="flex flex-wrap gap-2 pl-3 border-l border-primary/30">
          {orphans.map((k) => (
            <span
              key={k.keyword}
              className="text-xs px-2 py-1 rounded-full bg-primary/5 text-foreground/90 border border-primary/25"
            >
              {k.keyword} <span className="text-muted-foreground">×{k.count}</span>
            </span>
          ))}
        </div>
      )}

      {zeroParty.length > 0 && (
        <div className="rounded-lg border border-money/30 bg-money/5 mt-2">
          <button
            type="button"
            onClick={() => setZeroOpen((v) => !v)}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left"
          >
            <ChevronRight
              className={`h-3.5 w-3.5 text-money transition-transform ${zeroOpen ? "rotate-90" : ""}`}
            />
            <span className="text-[11px] text-money flex-1 min-w-0 truncate">
              Zero-party clustered keywords (non-PII)
            </span>
            <span className="text-[11px] text-muted-foreground">{zeroParty.length}</span>
          </button>
          {zeroOpen && (
            <div className="px-3 pb-2 flex flex-wrap gap-2">
              {zeroParty.map((k) => (
                <span
                  key={`${k.kind}-${k.keyword}`}
                  className="text-xs px-2 py-1 rounded-full bg-money/10 text-foreground/90 border border-money/30"
                >
                  {k.keyword} <span className="text-muted-foreground">×{k.count}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
