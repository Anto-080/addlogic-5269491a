import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { persistKeywords, persistSubcategories, extractKeywords } from "@/hooks/useClassifyInterest";

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
    if (trimmed.length < 2 || !user) return;
    try {
      const { data } = await supabase.functions.invoke("classify-interest", {
        body: { text: trimmed },
      });
      if (data?.tierId) {
        await persistSubcategories(user.id, data.tierId, Array.isArray(data.subcategories) ? data.subcategories : []);
        await persistKeywords(user.id, data.tierId, extractKeywords(trimmed));
      }
    } catch (e) {
      console.warn("interest lock failed:", (e as Error).message);
    } finally {
      qc.invalidateQueries({ queryKey: ["user_stats", user.id] });
      qc.invalidateQueries({ queryKey: ["tier_keywords", user.id] });
    }
  }, [qc, user]);
}
