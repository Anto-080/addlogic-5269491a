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
      const { error } = await supabase.from("tier_progress").upsert(
        {
          user_id: user.id,
          tier_id: patch.tier_id,
          seconds_active: patch.seconds_active,
          multiplier_bonus: patch.multiplier_bonus,
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
