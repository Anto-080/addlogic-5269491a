import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { persistKeywords, persistSubcategories, extractKeywords, type ClassifyResult } from "@/hooks/useClassifyInterest";
import { recordSearch } from "@/lib/userInterestProfiler";
import { bumpSearchCount } from "@/lib/zeroPartyCookies";
import { useResearchSession } from "@/contexts/ResearchSessionContext";

type LockInterestOptions = {
  onTierClassified?: (tierId: number) => void;
  pulseSession?: boolean;
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
  const session = useResearchSession();

  return useCallback(async (text: string, options: LockInterestOptions = {}): Promise<ClassifyResult | null> => {
    const trimmed = text.trim();
    if (trimmed.length < 2 || !user) return null;

    recordSearch(trimmed);
    bumpSearchCount();

    try {
      const { data } = await supabase.functions.invoke("classify-interest", {
        body: { text: trimmed },
      });
      if (data?.tierId) {
        if (options.pulseSession !== false) session.pulse(data.tierId, "search", 90_000);
        options.onTierClassified?.(data.tierId);
        await persistSubcategories(user.id, data.tierId, Array.isArray(data.subcategories) ? data.subcategories : []);
        await persistKeywords(user.id, data.tierId, extractKeywords(trimmed));
      }
      return data
        ? {
            tierId: data.tierId ?? null,
            tierName: data.tierName ?? null,
            confidence: Number(data.confidence) || 0,
            subcategories: Array.isArray(data.subcategories) ? data.subcategories : [],
            text: data.text ?? trimmed,
          }
        : null;
    } catch (e) {
      console.warn("interest lock failed:", (e as Error).message);
      return null;
    } finally {
      qc.invalidateQueries({ queryKey: ["user_stats", user.id] });
      qc.invalidateQueries({ queryKey: ["tier_keywords", user.id] });
    }
  }, [qc, session, user]);
}
