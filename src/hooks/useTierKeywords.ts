import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type TierKeyword = {
  keyword: string;
  count: number;
  tier_id: number;
  kind: "keyword" | "subcategory";
};

/**
 * Reads the user's personalised tier_keywords (zero-party data extracted by
 * the Mistral classifier from search queries). Returns rows grouped by tier
 * id, split into raw keywords and AI-derived subcategories.
 */
export function useTierKeywords() {
  const { user } = useAuth();
  const { data = { keywords: {}, subcategories: {} } } = useQuery({
    queryKey: ["tier_keywords", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return { keywords: {}, subcategories: {} };
      const { data } = await supabase
        .from("tier_keywords")
        .select("tier_id, keyword, count, kind")
        .eq("user_id", user.id)
        .order("count", { ascending: false })
        .limit(400);

      const kws: Record<number, TierKeyword[]> = {};
      const subs: Record<number, TierKeyword[]> = {};
      for (const row of (data ?? []) as TierKeyword[]) {
        const bucket = row.kind === "subcategory" ? subs : kws;
        (bucket[row.tier_id] ??= []).push(row);
      }
      return { keywords: kws, subcategories: subs };
    },
    staleTime: 10_000,
  });

  // Backward compat: legacy callers use the default export shape (keywords only).
  return Object.assign(data.keywords, {
    keywords: data.keywords,
    subcategories: data.subcategories,
  }) as Record<number, TierKeyword[]> & {
    keywords: Record<number, TierKeyword[]>;
    subcategories: Record<number, TierKeyword[]>;
  };
}
