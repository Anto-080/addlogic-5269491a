import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type TierKeyword = { keyword: string; count: number; tier_id: number };

/**
 * Reads the user's personalised tier_keywords (zero-party data extracted by
 * the HuggingFace classifier from search queries). Returns rows grouped by
 * tier id.
 */
export function useTierKeywords() {
  const { user } = useAuth();
  const [byTier, setByTier] = useState<Record<number, TierKeyword[]>>({});

  useEffect(() => {
    if (!user) { setByTier({}); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("tier_keywords")
        .select("tier_id, keyword, count")
        .eq("user_id", user.id)
        .order("count", { ascending: false })
        .limit(200);
      if (cancelled) return;
      const grouped: Record<number, TierKeyword[]> = {};
      for (const row of (data ?? []) as TierKeyword[]) {
        (grouped[row.tier_id] ??= []).push(row);
      }
      setByTier(grouped);
    })();
    return () => { cancelled = true; };
  }, [user]);

  return byTier;
}
