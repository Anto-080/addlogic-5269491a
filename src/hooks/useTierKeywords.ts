import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { KeywordKind } from "@/hooks/useClassifyInterest";

export type TierKeyword = {
  keyword: string;
  count: number;
  tier_id: number;
  kind: KeywordKind;
  /** Subcategory a subinterest belongs to (or subinterest for a cluster). */
  parent?: string | null;
};


type Buckets = Record<number, TierKeyword[]>;

const emptyState = {
  keywords: {} as Buckets,
  subcategories: {} as Buckets,
  subinterests: {} as Buckets,
  clusters: {} as Buckets,
};

/**
 * Reads the user's personalised zero-party taxonomy from `tier_keywords`
 * (built by the Mistral classifier out of search queries), grouped by tier
 * id and split by hierarchy level: subcategory → subinterest → clusters,
 * plus the raw keywords. No personal data is involved — only topics.
 */
export function useTierKeywords() {
  const { user } = useAuth();
  const { data = emptyState } = useQuery({
    queryKey: ["tier_keywords", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return emptyState;
      const { data } = await supabase
        .from("tier_keywords")
        .select("tier_id, keyword, count, kind")
        .eq("user_id", user.id)
        .order("count", { ascending: false })
        .limit(600);

      const kws: Buckets = {};
      const subs: Buckets = {};
      const subints: Buckets = {};
      const clusters: Buckets = {};
      for (const row of (data ?? []) as TierKeyword[]) {
        const bucket =
          row.kind === "subcategory" ? subs
          : row.kind === "subinterest" ? subints
          : row.kind === "cluster" ? clusters
          : kws;
        (bucket[row.tier_id] ??= []).push(row);
      }
      return { keywords: kws, subcategories: subs, subinterests: subints, clusters };
    },
    staleTime: 10_000,
  });

  // Backward compat: legacy callers use the default export shape (keywords only).
  return Object.assign({ ...data.keywords }, {
    keywords: data.keywords,
    subcategories: data.subcategories,
    subinterests: data.subinterests,
    clusters: data.clusters,
  }) as Record<number, TierKeyword[]> & {
    keywords: Buckets;
    subcategories: Buckets;
    subinterests: Buckets;
    clusters: Buckets;
  };
}
