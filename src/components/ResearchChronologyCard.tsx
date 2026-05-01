import { useResearchChronology, type OutboundVisit } from "@/hooks/useResearchChronology";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, ExternalLink, History } from "lucide-react";
import { TIERS } from "@/lib/mockData";
import { TierIcon } from "@/components/TierIcon";
import { useState } from "react";
import { useOutboundExit } from "@/hooks/useOutboundExit";
import { ExitInterstitial } from "@/components/ExitInterstitial";

function fmtDuration(s: number | null) {
  if (!s || s <= 0) return "—";
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r ? `${m}m ${r}s` : `${m}m`;
}

function fmtRelative(iso: string) {
  const d = Date.now() - new Date(iso).getTime();
  if (d < 60_000) return "just now";
  const m = Math.floor(d / 60_000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/**
 * Personal Research Chronology — a per-user feed of outbound visits.
 * Shows tier, host, when it was opened, how long the user spent on it
 * (from `useOutboundExit` dwell tracking), and offers a "browse again"
 * action that re-opens through the exit interstitial.
 */
export function ResearchChronologyCard() {
  const [filterTier, setFilterTier] = useState<number | null>(null);
  const { data: visits = [] } = useResearchChronology(filterTier, 30);
  const exit = useOutboundExit();

  const tierIdsInHistory = Array.from(
    new Set(visits.map((v: OutboundVisit) => v.tier_id).filter((x): x is number => x != null))
  );

  return (
    <Card className="bg-card border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Personal Research Chronology
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-[11px] text-muted-foreground">
          Outbound research visits with dwell time. Used to compute the validated XP that grows your tier experience bars.
        </p>

        {tierIdsInHistory.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setFilterTier(null)}
              className={`text-[11px] px-2 py-1 rounded-full border transition-colors ${
                filterTier === null
                  ? "bg-primary/20 border-primary/50 text-foreground"
                  : "bg-secondary/40 border-border/40 text-foreground/80 hover:bg-secondary/60"
              }`}
            >
              All
            </button>
            {tierIdsInHistory.map((id) => {
              const tier = TIERS.find((t) => t.id === id);
              if (!tier) return null;
              const sel = filterTier === id;
              return (
                <button
                  key={id}
                  onClick={() => setFilterTier(id)}
                  className="text-[11px] px-2 py-1 rounded-full border transition-colors flex items-center gap-1"
                  style={{
                    borderColor: sel ? tier.color : "hsl(var(--border))",
                    backgroundColor: sel ? `${tier.color}20` : "transparent",
                    color: tier.color,
                  }}
                >
                  <TierIcon tierId={tier.id} size={10} />
                  {tier.name.split(" ")[0]}
                </button>
              );
            })}
          </div>
        )}

        {visits.length === 0 && (
          <p className="text-xs text-muted-foreground italic">No outbound visits yet — open a sponsored link from Research to log your first.</p>
        )}

        <div className="space-y-2">
          {visits.map((v) => {
            const tier = v.tier_id ? TIERS.find((t) => t.id === v.tier_id) : null;
            return (
              <div key={v.id} className="rounded-lg border border-border/40 bg-secondary/20 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {tier && (
                        <span className="flex items-center gap-1" style={{ color: tier.color }}>
                          <TierIcon tierId={tier.id} size={12} />
                          <span className="text-[10px]">{tier.name}</span>
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground">{fmtRelative(v.opened_at)}</span>
                    </div>
                    <p className="text-sm text-foreground truncate">{v.host ?? v.url}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" /> dwell {fmtDuration(v.dwell_seconds)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 gap-1 text-xs shrink-0"
                    onClick={() => exit.requestExit(v.url, v.tier_id ?? 4)}
                  >
                    <ExternalLink className="h-3 w-3" /> Open
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
      <ExitInterstitial
        open={exit.state.open}
        url={exit.state.url}
        host={exit.state.host}
        tierId={exit.state.tierId}
        ad={exit.state.ad}
        onConfirm={exit.confirm}
        onCancel={exit.cancel}
      />
    </Card>
  );
}
