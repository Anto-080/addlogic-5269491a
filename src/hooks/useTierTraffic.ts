import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type TierTraffic = { visits: number; hours: number };

/**
 * Aggregated, anonymised research traffic per tier — replaces the old
 * hardcoded `researchers` / `avgEarning` mock values.
 */
export function useTierTraffic() {
  return useQuery({
    queryKey: ["tier-traffic"],
    staleTime: 60_000,
    queryFn: async (): Promise<Record<number, TierTraffic>> => {
      const { data, error } = await supabase
        .from("anonymous_research_analytics")
        .select("tier_id, visit_count, total_dwell_seconds");
      if (error) throw error;
      const out: Record<number, TierTraffic> = {};
      for (const r of (data ?? []) as Array<{ tier_id: number | null; visit_count: number; total_dwell_seconds: number }>) {
        if (r.tier_id == null) continue;
        const cur = out[r.tier_id] ?? { visits: 0, hours: 0 };
        cur.visits += r.visit_count ?? 0;
        cur.hours += (r.total_dwell_seconds ?? 0) / 3600;
        out[r.tier_id] = cur;
      }
      return out;
    },
  });
}
