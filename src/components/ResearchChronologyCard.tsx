import { useResearchChronology, type OutboundVisit } from "@/hooks/useResearchChronology";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, ExternalLink, History, ChevronDown, ChevronUp, Trash2, Loader2 } from "lucide-react";
import { TIERS } from "@/lib/mockData";
import { TierIcon } from "@/components/TierIcon";
import { useState } from "react";
import { useOutboundExit } from "@/hooks/useOutboundExit";
import { ExitInterstitial } from "@/components/ExitInterstitial";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

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
 * Personal Research Chronology — collapsible, erasable per-user feed of
 * outbound visits. On erase, the rows are first folded into the anonymous
 * `anonymous_research_analytics` table (tier + host + week + counts only,
 * no user id) via the `anonymize_outbound_visits` RPC, then deleted.
 */
export function ResearchChronologyCard() {
  const [open, setOpen] = useState(false);
  const [filterTier, setFilterTier] = useState<number | null>(null);
  const { data: visits = [] } = useResearchChronology(filterTier, 30);
  const exit = useOutboundExit();
  const qc = useQueryClient();
  const { user } = useAuth();

  const erase = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("anonymize_outbound_visits");
      if (error) throw error;
      return data as number;
    },
    onSuccess: (count) => {
      toast.success(`Erased ${count} entries · anonymized for analytics`);
      qc.invalidateQueries({ queryKey: ["outbound_visits", user?.id] });
    },
    onError: (e: unknown) => {
      toast.error(e instanceof Error ? e.message : "Failed to erase chronology");
    },
  });

  const tierIdsInHistory = Array.from(
    new Set(visits.map((v: OutboundVisit) => v.tier_id).filter((x): x is number => x != null))
  );

  return (
    <Card className="bg-card border-border/50">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader className="pb-3">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="w-full flex items-center justify-between gap-2 text-left"
              aria-expanded={open}
            >
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Personal Research Chronology
                <span className="text-[10px] text-muted-foreground font-normal ml-1">
                  {visits.length} entr{visits.length === 1 ? "y" : "ies"} · tap to {open ? "hide" : "open"}
                </span>
              </CardTitle>
              {open
                ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-3">
            <p className="text-[11px] text-muted-foreground">
              Outbound research visits with dwell time. Used to compute the validated XP that grows your tier experience bars.
              Erasing keeps only an anonymous, aggregated weekly summary (no user, no URLs).
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

            {visits.length > 0 && (
              <div className="pt-2 border-t border-border/40 flex justify-end">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="ghost" className="h-8 gap-1 text-xs text-destructive hover:text-destructive">
                      {erase.isPending
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : <Trash2 className="h-3 w-3" />}
                      Erase chronology
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Erase your research chronology?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Your personal entries will be deleted. A non-PII weekly aggregate (tier + host + counts,
                        no user, no URLs, no precise timestamps) is kept for analytical purposes — covered by
                        the data consent you already accepted.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => erase.mutate()}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Erase &amp; anonymize
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

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
