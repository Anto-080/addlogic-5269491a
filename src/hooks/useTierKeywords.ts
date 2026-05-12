import { useEffect, useState } from "react";
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
  const [keywordsByTier, setKeywordsByTier] = useState<Record<number, TierKeyword[]>>({});
  const [subcategoriesByTier, setSubcategoriesByTier] = useState<Record<number, TierKeyword[]>>({});

  useEffect(() => {
    if (!user) { setKeywordsByTier({}); setSubcategoriesByTier({}); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("tier_keywords")
        .select("tier_id, keyword, count, kind")
        .eq("user_id", user.id)
        .order("count", { ascending: false })
        .limit(400);
      if (cancelled) return;
      const kws: Record<number, TierKeyword[]> = {};
      const subs: Record<number, TierKeyword[]> = {};
      for (const row of (data ?? []) as TierKeyword[]) {
        const bucket = row.kind === "subcategory" ? subs : kws;
        (bucket[row.tier_id] ??= []).push(row);
      }
      setKeywordsByTier(kws);
      setSubcategoriesByTier(subs);
    })();
    return () => { cancelled = true; };
  }, [user]);

  // Backward compat: legacy callers use the default export shape (keywords only).
  return Object.assign(keywordsByTier, {
    keywords: keywordsByTier,
    subcategories: subcategoriesByTier,
  }) as Record<number, TierKeyword[]> & {
    keywords: Record<number, TierKeyword[]>;
    subcategories: Record<number, TierKeyword[]>;
  };
}
