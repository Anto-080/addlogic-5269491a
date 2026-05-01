import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useSponsorRating(sponsorId: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["sponsor_rating", user?.id, sponsorId],
    enabled: !!user && !!sponsorId,
    queryFn: async (): Promise<{ rated: boolean; stars?: number }> => {
      if (!user || !sponsorId) return { rated: false };
      const { data, error } = await supabase
        .from("sponsor_ratings")
        .select("stars")
        .eq("user_id", user.id)
        .eq("sponsor_id", sponsorId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return { rated: false };
      return { rated: true, stars: (data as { stars: number }).stars };
    },
    staleTime: 60_000,
  });
}

export function useSubmitSponsorRating() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { sponsorId: string; stars: number }) => {
      if (!user) return null;
      const { error } = await supabase.from("sponsor_ratings").insert({
        user_id: user.id,
        sponsor_id: vars.sponsorId,
        stars: vars.stars,
      });
      if (error) throw error;
      return vars;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["sponsor_rating", user?.id, vars?.sponsorId] });
    },
  });
}
