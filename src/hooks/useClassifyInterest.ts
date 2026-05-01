import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ClassifyResult = {
  tierId: number | null;
  tierName: string | null;
  confidence: number;
  text: string;
};

/**
 * Calls the classify-interest edge function (HuggingFace zero-shot).
 * Returns the best-matching tier id + confidence, or `tierId: null` if
 * no signal could be derived.
 */
export function useClassifyInterest() {
  return useMutation({
    mutationFn: async (text: string): Promise<ClassifyResult | null> => {
      const trimmed = text.trim();
      if (trimmed.length < 2) return null;
      const { data, error } = await supabase.functions.invoke("classify-interest", {
        body: { text: trimmed },
      });
      if (error) throw error;
      if (!data) return null;
      return data as ClassifyResult;
    },
  });
}

const STOPWORDS = new Set([
  "the", "and", "for", "with", "from", "into", "this", "that", "these", "those",
  "what", "when", "where", "why", "how", "who", "which", "is", "are", "was",
  "were", "been", "being", "have", "has", "had", "do", "does", "did", "of",
  "in", "on", "at", "to", "by", "as", "an", "a", "or", "but", "not", "no",
  "yes", "i", "you", "he", "she", "it", "we", "they", "my", "your", "their",
  "our", "his", "her", "its",
]);

export function extractKeywords(text: string, max = 5): string[] {
  return Array.from(
    new Set(
      text
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .split(/\s+/)
        .filter((w) => w.length >= 4 && !STOPWORDS.has(w)),
    ),
  ).slice(0, max);
}

/**
 * Upserts each extracted keyword into `tier_keywords`, incrementing its
 * `count` and refreshing `last_seen`. Best-effort; failures are silent.
 */
export async function persistKeywords(userId: string, tierId: number, keywords: string[]) {
  if (!keywords.length) return;
  for (const keyword of keywords) {
    // RLS-protected insert; on conflict bump count + last_seen.
    const { data: existing } = await supabase
      .from("tier_keywords")
      .select("id, count")
      .eq("user_id", userId)
      .eq("tier_id", tierId)
      .eq("keyword", keyword)
      .maybeSingle();
    if (existing) {
      await supabase
        .from("tier_keywords")
        .update({ count: existing.count + 1, last_seen: new Date().toISOString() })
        .eq("id", existing.id);
    } else {
      await supabase
        .from("tier_keywords")
        .insert({ user_id: userId, tier_id: tierId, keyword });
    }
  }
}
