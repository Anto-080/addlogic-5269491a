import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { persistKeywords, persistTaxonomy, extractKeywords, normalizeClassifyResult, type ClassifyResult } from "@/hooks/useClassifyInterest";
import { recordSearch } from "@/lib/userInterestProfiler";
import { bumpSearchCount } from "@/lib/zeroPartyCookies";
import { useResearchSession } from "@/contexts/ResearchSessionContext";

type LockInterestOptions = {
  onTierClassified?: (tierId: number) => void;
  pulseSession?: boolean;
  minConfidence?: number;
};

/**
 * De-duplication cache: several search bars (DuckDuckGo, PLOS, OpenAlex) can
 * submit the SAME query at nearly the same moment. Without this, two identical
 * requests hit the Mistral agent simultaneously and trip its burst limit.
 * One classification per query is shared for 60 seconds.
 */
const inFlight = new Map<string, Promise<unknown>>();
const recent = new Map<string, { at: number; data: unknown }>();
const TTL = 60_000;

function classifyOnce(text: string): Promise<unknown> {
  const key = text.toLowerCase();
  const cached = recent.get(key);
  if (cached && Date.now() - cached.at < TTL) return Promise.resolve(cached.data);
  const pending = inFlight.get(key);
  if (pending) return pending;
  const p = supabase.functions
    .invoke("classify-interest", { body: { text } })
    .then(({ data }) => {
      recent.set(key, { at: Date.now(), data });
      return data;
    })
    .finally(() => inFlight.delete(key));
  inFlight.set(key, p);
  return p;
}

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
      const data = (await classifyOnce(trimmed)) as any;
      const confidence = Number(data?.confidence) || 0;

      const result = data ? normalizeClassifyResult(data, trimmed) : null;
      if (result?.tierId && confidence >= (options.minConfidence ?? 0.4)) {
        if (options.pulseSession !== false) session.pulse(result.tierId, "search", 90_000);
        options.onTierClassified?.(result.tierId);
        await persistTaxonomy(user.id, result.tierId, {
          subcategory: result.subcategory,
          subinterest: result.subinterest,
          clusters: result.clusters,
        });
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
  }, [qc, session, user]);
}
