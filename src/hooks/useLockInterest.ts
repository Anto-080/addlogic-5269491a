import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { persistKeywords, persistSubcategories, extractKeywords } from "@/hooks/useClassifyInterest";

type LockInterestResult = {
  tierId: number | null;
  tierName: string | null;
  confidence: number;
  subcategories: string[];
  text: string;
};

/**
 * Site-wide hook: every search bar (PLOS, DDG, OpenAlex) calls this with
 * the user's query. Mistral classifies → server stamps user_stats with
 * the multiplier + a 5-min `locked_until` window. We invalidate the
 * user_stats query so ExperienceBar picks up the new window immediately.
 */
export function useLockInterest() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (trimmed.length < 2 || !user) return null;
    try {
      const { data } = await supabase.functions.invoke("classify-interest", {
        body: { text: trimmed },
      });
      const result: LockInterestResult | null = data ? {
        tierId: data.tierId ?? null,
        tierName: data.tierName ?? null,
        confidence: Number(data.confidence) || 0,
        subcategories: Array.isArray(data.subcategories) ? data.subcategories : [],
        text: data.text ?? trimmed,
      } : null;
      if (result?.tierId) {
        await persistSubcategories(user.id, result.tierId, result.subcategories);
        await persistKeywords(user.id, result.tierId, extractKeywords(trimmed));
      }
      return result;
    } catch (e) {
      console.warn("interest lock failed:", (e as Error).message);
      return null;
    } finally {
      qc.invalidateQueries({ queryKey: ["user_stats", user.id] });
      qc.invalidateQueries({ queryKey: ["tier_keywords", user.id] });
    }
  }, [qc, user]);
}
