import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ClassifyResult = {
  tierId: number | null;
  tierName: string | null;
  confidence: number;
  /** Broader discipline inside the tier, e.g. "Microbiology". */
  subcategory: string | null;
  /** Narrower specialisation inside the subcategory, e.g. "Virology". */
  subinterest: string | null;
  /** Semantic clusters extracted from the query itself. */
  clusters: string[];
  /** Legacy flat list = [subcategory, subinterest]. */
  subcategories: string[];
  text: string;
};

export function normalizeClassifyResult(data: any, fallbackText: string): ClassifyResult {
  const subcategory = data?.subcategory ?? null;
  const subinterest = data?.subinterest ?? null;
  const clusters = Array.isArray(data?.clusters) ? data.clusters : [];
  const legacy = Array.isArray(data?.subcategories) ? data.subcategories : [];
  return {
    tierId: data?.tierId ?? null,
    tierName: data?.tierName ?? null,
    confidence: Number(data?.confidence) || 0,
    subcategory,
    subinterest,
    clusters: clusters.length ? clusters : legacy,
    subcategories: [subcategory, subinterest].filter(Boolean) as string[],
    text: data?.text ?? fallbackText,
  };
}

/**
 * Calls the classify-interest edge function (Mistral Agent).
 * Returns the main category (tier), its subcategory, the narrower
 * subinterest, and semantic clusters mined from the query.
 */
export function useClassifyInterest() {
  return useMutation({
    mutationFn: async (text: string): Promise<ClassifyResult | null> => {
      const trimmed = text.trim();
      if (trimmed.length < 2) return null;
      // Never throw: a rate-limited / unavailable classifier must not break the UI.
      try {
        const { data, error } = await supabase.functions.invoke("classify-interest", {
          body: { text: trimmed },
        });
        if (error || !data || (data as any).error) {
          console.warn("classify-interest unavailable:", (error as Error)?.message ?? (data as any)?.error);
          return null;
        }
        return normalizeClassifyResult(data, trimmed);
      } catch (e) {
        console.warn("classify-interest failed:", (e as Error).message);
        return null;
      }
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

export type KeywordKind = "keyword" | "subcategory" | "subinterest" | "cluster";

// Specificity ranking — when the same label arrives with a richer role,
// the stored row is promoted instead of duplicated (the table is unique
// on user_id + tier_id + keyword).
const KIND_RANK: Record<KeywordKind, number> = {
  keyword: 0,
  cluster: 1,
  subinterest: 2,
  subcategory: 3,
};

async function upsertTierKeyword(
  userId: string,
  tierId: number,
  keyword: string,
  kind: KeywordKind,
) {
  const label = keyword.trim();
  if (label.length < 2) return;
  const { data: existing } = await supabase
    .from("tier_keywords")
    .select("id, count, kind")
    .eq("user_id", userId)
    .eq("tier_id", tierId)
    .eq("keyword", label)
    .maybeSingle();
  if (existing) {
    const currentRank = KIND_RANK[(existing.kind as KeywordKind) ?? "keyword"] ?? 0;
    const promote = KIND_RANK[kind] > currentRank;
    await supabase
      .from("tier_keywords")
      .update({
        count: existing.count + 1,
        last_seen: new Date().toISOString(),
        ...(promote ? { kind } : {}),
      })
      .eq("id", existing.id);
  } else {
    await supabase
      .from("tier_keywords")
      .insert({ user_id: userId, tier_id: tierId, keyword: label, kind });
  }
}

/**
 * Upserts each extracted keyword into `tier_keywords` (kind='keyword').
 */
export async function persistKeywords(userId: string, tierId: number, keywords: string[]) {
  for (const keyword of keywords) {
    await upsertTierKeyword(userId, tierId, keyword, "keyword");
  }
}

/**
 * Legacy helper — stores a flat list as subcategories.
 */
export async function persistSubcategories(userId: string, tierId: number, subs: string[]) {
  for (const sub of subs) {
    await upsertTierKeyword(userId, tierId, sub, "subcategory");
  }
}

/**
 * Persists the full zero-party taxonomy produced by the Mistral classifier:
 * main category (the tier itself) → subcategory → subinterest, plus the
 * semantic clusters mined from the query. Nothing personal is stored — only
 * the topic hierarchy, which is what makes intent inferable without tracking.
 * The taxonomy is self-scaling: a new specialisation (e.g. virology) simply
 * appears as a fresh subinterest under its subcategory (Microbiology).
 */
export async function persistTaxonomy(
  userId: string,
  tierId: number,
  taxonomy: { subcategory?: string | null; subinterest?: string | null; clusters?: string[] },
) {
  if (taxonomy.subcategory) await upsertTierKeyword(userId, tierId, taxonomy.subcategory, "subcategory");
  if (taxonomy.subinterest) await upsertTierKeyword(userId, tierId, taxonomy.subinterest, "subinterest");
  for (const c of taxonomy.clusters ?? []) {
    await upsertTierKeyword(userId, tierId, c, "cluster");
  }
}
