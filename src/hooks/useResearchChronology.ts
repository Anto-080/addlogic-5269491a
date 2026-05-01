import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type OutboundVisit = {
  id: string;
  url: string;
  host: string | null;
  tier_id: number | null;
  sponsor_id: string | null;
  opened_at: string;
  returned_at: string | null;
  dwell_seconds: number | null;
};

export function useResearchChronology(tierId?: number | null, limit = 30) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["outbound_visits", user?.id, tierId ?? "all", limit],
    enabled: !!user,
    queryFn: async (): Promise<OutboundVisit[]> => {
      if (!user) return [];
      let q = supabase
        .from("outbound_visits")
        .select("*")
        .eq("user_id", user.id)
        .order("opened_at", { ascending: false })
        .limit(limit);
      if (tierId != null) q = q.eq("tier_id", tierId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as OutboundVisit[];
    },
    staleTime: 15_000,
  });
}

export function useRecordOutboundOpen() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { url: string; tierId: number | null; sponsorId?: string | null }): Promise<string | null> => {
      if (!user) return null;
      let host: string | null = null;
      try { host = new URL(vars.url).host; } catch { /* ignore */ }
      const { data, error } = await supabase
        .from("outbound_visits")
        .insert({
          user_id: user.id,
          url: vars.url,
          host,
          tier_id: vars.tierId,
          sponsor_id: vars.sponsorId ?? null,
        })
        .select("id")
        .maybeSingle();
      if (error) throw error;
      return (data as { id: string } | null)?.id ?? null;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["outbound_visits", user?.id] });
    },
  });
}

export function useRecordOutboundReturn() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { id: string; openedAt: number }) => {
      if (!user) return null;
      const dwell = Math.max(0, Math.floor((Date.now() - vars.openedAt) / 1000));
      const { error } = await supabase
        .from("outbound_visits")
        .update({
          returned_at: new Date().toISOString(),
          dwell_seconds: dwell,
        })
        .eq("id", vars.id)
        .eq("user_id", user.id);
      if (error) throw error;
      return { id: vars.id, dwell };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["outbound_visits", user?.id] });
    },
  });
}
