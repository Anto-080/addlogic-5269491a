import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type TierAffinity = { tierId: number; seconds: number; percent: number };

/**
 * Per-user tier affinity — % of total research seconds accumulated per tier.
 * Drives the Meta-Interests Cake on the Dashboard.
 */
export function useTierAffinity() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["tier-affinity", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<TierAffinity[]> => {
      const { data, error } = await supabase
        .from("tier_progress")
        .select("tier_id, seconds_active")
        .eq("user_id", user!.id);
      if (error) throw error;
      const rows = (data ?? []) as Array<{ tier_id: number; seconds_active: number }>;
      const total = rows.reduce((s, r) => s + (r.seconds_active ?? 0), 0);
      if (total <= 0) return [];
      return rows
        .map((r) => ({
          tierId: r.tier_id,
          seconds: r.seconds_active,
          percent: (r.seconds_active / total) * 100,
        }))
        .sort((a, b) => b.percent - a.percent);
    },
  });
}
