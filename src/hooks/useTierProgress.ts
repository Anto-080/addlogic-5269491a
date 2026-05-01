import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type TierProgressRow = {
  user_id: string;
  tier_id: number;
  seconds_active: number;
  multiplier_bonus: number;
  fingerprint: string | null;
  updated_at: string;
};

export function useTierProgress(tierId: number | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["tier_progress", user?.id, tierId],
    enabled: !!user && tierId !== null,
    queryFn: async (): Promise<TierProgressRow | null> => {
      if (!user || tierId === null) return null;
      const { data, error } = await supabase
        .from("tier_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("tier_id", tierId)
        .maybeSingle();
      if (error) throw error;
      return (data as TierProgressRow | null) ?? null;
    },
    staleTime: 30_000,
  });
}

export function useUpdateTierProgress() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: {
      tier_id: number;
      seconds_active: number;
      multiplier_bonus: number;
      fingerprint?: string | null;
    }) => {
      if (!user) return null;
      // Defense-in-depth: clamp client-supplied values to the same bounds
      // enforced by CHECK constraints in the database, so a tampered client
      // gets a clean rejection rather than a Postgres error.
      const safeSeconds = Math.max(0, Math.min(31_536_000, Math.floor(patch.seconds_active || 0)));
      const safeBonus = Math.max(0, Math.min(100, Math.floor(patch.multiplier_bonus || 0)));
      const { error } = await supabase.from("tier_progress").upsert(
        {
          user_id: user.id,
          tier_id: patch.tier_id,
          seconds_active: safeSeconds,
          multiplier_bonus: safeBonus,
          fingerprint: patch.fingerprint ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,tier_id" }
      );
      if (error) throw error;
      return patch;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["tier_progress", user?.id, vars?.tier_id] });
    },
  });
}
