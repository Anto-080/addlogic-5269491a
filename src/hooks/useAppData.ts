import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { TIERS as FALLBACK_TIERS } from "@/lib/mockData";

/* Mutation: patch the current user's stats row. */
export function useUpdateUserStats() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<{ xp: number; level: number; current_multiplier: number; earnings_today: number; earnings_week: number; earnings_all_time: number; active_streak: number; }>) => {
      if (!user) return null;
      const { error } = await supabase.from("user_stats").update(patch).eq("user_id", user.id);
      if (error) throw error;
      return patch;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user_stats", user?.id] });
    },
  });
}

/* =====================================================================
 * Public catalog hooks — pull live data from Supabase.
 * If a fetch fails (offline preview), gracefully fall back to the static
 * mirror in mockData.ts so the UI never breaks.
 * ===================================================================== */

export type Tier = {
  id: number;
  name: string;
  icon: string;
  multiplier: number;
  color: string;
  researchers: number;
  avg_earning: number;
  locked: boolean;
  subcategories: string[];
};

export function useTiers() {
  return useQuery({
    queryKey: ["tiers"],
    queryFn: async (): Promise<Tier[]> => {
      const { data, error } = await supabase
        .from("tiers")
        .select("*")
        .order("display_order", { ascending: true });
      if (error || !data) {
        return FALLBACK_TIERS.map((t) => ({
          id: t.id,
          name: t.name,
          icon: t.icon,
          multiplier: t.multiplier,
          color: t.color,
          researchers: t.researchers,
          avg_earning: t.avgEarning,
          locked: t.locked,
          subcategories: t.subcategories,
        }));
      }
      return data.map((t: any) => ({
        id: t.id,
        name: t.name,
        icon: t.icon,
        multiplier: Number(t.multiplier),
        color: t.color,
        researchers: t.researchers,
        avg_earning: Number(t.avg_earning),
        locked: t.locked,
        subcategories: t.subcategories ?? [],
      }));
    },
    staleTime: 60_000,
  });
}

export type ArticleRow = {
  id: string;
  title: string;
  tier_id: number;
  source: string;
  read_time: string | null;
  earnings: number;
  dual_use_warning: boolean;
  warning_text: string | null;
  is_daily_desk: boolean;
  url: string | null;
};

export function useArticles(opts?: { dailyDesk?: boolean }) {
  return useQuery({
    queryKey: ["articles", opts?.dailyDesk ?? "all"],
    queryFn: async (): Promise<ArticleRow[]> => {
      let q = supabase.from("articles").select("*").order("created_at", { ascending: false });
      if (opts?.dailyDesk) q = q.eq("is_daily_desk", true);
      const { data, error } = await q;
      if (error || !data) return [];
      return data.map((a: any) => ({
        ...a,
        earnings: Number(a.earnings),
      }));
    },
    staleTime: 30_000,
  });
}

export type OfferRow = {
  id: string;
  merchant: string;
  tier_id: number;
  title: string;
  original_price: number;
  sale_price: number;
  discount: number;
  cpa_payout: number;
};

export function useOffers() {
  return useQuery({
    queryKey: ["offers"],
    queryFn: async (): Promise<OfferRow[]> => {
      // Use the public-safe view; cpa_payout is admin-only via RLS on the underlying table.
      const { data, error } = await (supabase as any)
        .from("offers_public")
        .select("id, merchant, tier_id, title, original_price, sale_price, discount, created_at")
        .order("created_at", { ascending: false });
      if (error || !data) return [];
      return data.map((o: any) => ({
        ...o,
        original_price: Number(o.original_price),
        sale_price: Number(o.sale_price),
        cpa_payout: 0,
      }));
    },
    staleTime: 60_000,
  });
}

export type SponsorRow = {
  id: string;
  company: string;
  tier_id: number;
  bid_amount: number;
  impressions: string | null;
  ctr: string | null;
  rating: number;
};

export function useSponsors() {
  return useQuery({
    queryKey: ["sponsors"],
    queryFn: async (): Promise<SponsorRow[]> => {
      // Use the public-safe view that omits bid_amount, impressions, and ctr
      // (those are admin-only via RLS on the underlying sponsors table).
      const { data, error } = await (supabase as any)
        .from("sponsors_public")
        .select("id, company, tier_id, rating")
        .order("rating", { ascending: false });
      if (error || !data) return [];
      return data.map((s: any) => ({
        id: s.id,
        company: s.company,
        tier_id: s.tier_id,
        bid_amount: 0,
        impressions: null,
        ctr: null,
        rating: Number(s.rating),
      }));
    },
    staleTime: 30_000,
  });
}

/* =====================================================================
 * Per-user hooks — require auth.
 * ===================================================================== */

export type UserStats = {
  user_id: string;
  xp: number;
  level: number;
  earnings_today: number;
  earnings_week: number;
  earnings_all_time: number;
  current_multiplier: number;
  active_streak: number;
};

export function useUserStats() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user_stats", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<UserStats | null> => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("user_stats")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error || !data) return null;
      return {
        user_id: data.user_id,
        xp: Number(data.xp),
        level: data.level,
        earnings_today: Number(data.earnings_today),
        earnings_week: Number(data.earnings_week),
        earnings_all_time: Number(data.earnings_all_time),
        current_multiplier: Number(data.current_multiplier),
        active_streak: data.active_streak,
      };
    },
    staleTime: 10_000,
  });
}

export function useMilestones(limit = 5) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["milestones", user?.id, limit],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("milestones")
        .select("*")
        .eq("user_id", user.id)
        .order("occurred_at", { ascending: false })
        .limit(limit);
      if (error || !data) return [];
      return data.map((m: any) => ({
        id: m.id,
        title: m.title,
        tier_id: m.tier_id,
        earned: Number(m.earned),
        xp_gained: m.xp_gained,
        occurred_at: m.occurred_at,
      }));
    },
    staleTime: 10_000,
  });
}

export type LiveArticle = {
  title: string;
  summary: string;
  url: string;
  source: string;
  tier_id: number;
  tier_name: string;
};

export function useCurateNews() {
  return useMutation({
    mutationFn: async (input: { tierIds: number[]; count?: number }): Promise<LiveArticle[]> => {
      const { data, error } = await supabase.functions.invoke("curate-news", {
        body: input,
      });
      if (error) throw error;
      return (data?.articles ?? []) as LiveArticle[];
    },
  });
}

export function useWeeklyEarnings() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["weekly_earnings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      const since = new Date();
      since.setDate(since.getDate() - 7);
      const { data, error } = await supabase
        .from("weekly_earnings")
        .select("*")
        .eq("user_id", user.id)
        .gte("day", since.toISOString().slice(0, 10))
        .order("day", { ascending: true });
      if (error || !data) return [];
      return data.map((d: any) => ({ day: d.day, amount: Number(d.amount) }));
    },
    staleTime: 30_000,
  });
}
