import { Sparkles, ExternalLink } from "lucide-react";
import { TIERS } from "@/lib/mockData";

export type NativeAd = {
  id: string;
  sponsorId: string;
  title: string;
  body: string;
  ctaUrl: string;
  tierId: number;
  cta: string;
};

type Props = {
  tierId: number;
  ad: NativeAd | null;
  opened: boolean;
  onOpen: () => void;
};

/**
 * Native ad placement. Renders a sponsor-styled card branded to the tier's
 * color. The user must tap the card before the exit interstitial unlocks
 * the "Continue" button.
 */
export function NativeAdSlot({ tierId, ad, opened, onOpen }: Props) {
  const tier = TIERS.find((t) => t.id === tierId);
  if (!ad) {
    return (
      <div className="rounded-lg border border-dashed border-border/50 p-3 text-[11px] text-muted-foreground">
        No sponsor ad for this tier.
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={() => {
        onOpen();
        try { window.open(ad.ctaUrl, "_blank", "noopener,noreferrer"); } catch { /* noop */ }
      }}
      className={`w-full text-left rounded-lg p-3 transition-all border ${
        opened
          ? "border-money/50 bg-money/5"
          : "border-border/50 bg-secondary/30 hover:bg-secondary/50"
      }`}
      style={tier ? { borderLeftWidth: 3, borderLeftColor: tier.color } : undefined}
    >
      <div className="flex items-start gap-2">
        <Sparkles
          className="h-4 w-4 mt-0.5 shrink-0"
          style={{ color: tier?.color ?? "hsl(45 90% 55%)" }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            Sponsored · {tier?.name ?? "Tier"}
          </p>
          <p className="text-sm font-semibold text-foreground leading-snug">{ad.title}</p>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ad.body}</p>
          <p className={`text-xs font-semibold mt-2 inline-flex items-center gap-1 ${opened ? "text-money" : "text-foreground/80"}`}>
            <ExternalLink className="h-3 w-3" /> {opened ? "Sponsor opened — credit recorded" : ad.cta}
          </p>
        </div>
      </div>
    </button>
  );
}
