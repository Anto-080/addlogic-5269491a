import { Sparkles } from "lucide-react";
import { TIERS } from "@/lib/mockData";
import { pickNativeAd } from "@/lib/nativeAds";

type Props = {
  tierId: number;
  fallbackTierIds?: number[];
  onOpenUrl: (url: string, tierId: number) => void;
  /** How many sponsor cards to show in the strip (deduped). */
  count?: number;
};

/**
 * Horizontally-scrolling sponsor strip placed between organic result rows.
 *
 * UX guardrail: **single click is a no-op** — the user must DOUBLE-CLICK to
 * be sent outbound. This is an explicit anti-misclick design so disinterested
 * users don't inflate CTR for sponsors, which would erode advertiser trust.
 */
export function ScrollAdSlot({ tierId, fallbackTierIds = [], onOpenUrl, count = 4 }: Props) {
  const ids = Array.from(new Set([tierId, ...fallbackTierIds, 4, 6, 8, 9])).slice(0, count);
  const ads = ids.map((id) => ({ id, ad: pickNativeAd(id, fallbackTierIds) })).filter((x) => x.ad);
  if (ads.length === 0) return null;

  return (
    <div className="rounded-lg border border-dashed border-border/40 bg-secondary/10 p-2">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-1 pb-1.5">
        Sponsored · double-click to open
      </p>
      <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-1">
        {ads.map(({ id, ad }) => {
          if (!ad) return null;
          const tier = TIERS.find((t) => t.id === id);
          return (
            <button
              key={ad.id}
              type="button"
              onClick={(e) => e.preventDefault()}
              onDoubleClick={() => onOpenUrl(ad.ctaUrl, id)}
              title="Double-click to open"
              className="snap-start shrink-0 w-[220px] text-left rounded-md border border-border/40 bg-card/60 p-2.5 transition-colors hover:bg-card/80 cursor-pointer select-none"
              style={tier ? { borderLeftWidth: 3, borderLeftColor: tier.color } : undefined}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles className="h-3 w-3" style={{ color: tier?.color }} />
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold truncate">
                  {tier?.name ?? "Sponsor"}
                </span>
              </div>
              <p className="text-xs font-semibold text-foreground leading-snug line-clamp-2">{ad.title}</p>
              <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{ad.body}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
