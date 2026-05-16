import { supabase } from "@/integrations/supabase/client";
import { persistKeywords, persistSubcategories, extractKeywords } from "@/hooks/useClassifyInterest";

/**
 * Site-wide interest lock-in. Called from EVERY search bar (PLOS,
 * DuckDuckGo, OpenAlex). Mistral classifies the query, sets the
 * multiplier and stamps a 5-minute window on `user_stats.locked_until`.
 * The ExperienceBar accumulator only ticks while now() < locked_until.
 */
export async function lockInterestFromQuery(text: string): Promise<void> {
  const trimmed = text.trim();
  if (trimmed.length < 2) return;
  const { data: u } = await supabase.auth.getUser();
  const userId = u?.user?.id;
  if (!userId) return;
  try {
    const { data } = await supabase.functions.invoke("classify-interest", {
      body: { text: trimmed },
    });
    if (!data?.tierId) return;
    await persistSubcategories(userId, data.tierId, Array.isArray(data.subcategories) ? data.subcategories : []);
    await persistKeywords(userId, data.tierId, extractKeywords(trimmed));
  } catch (e) {
    console.warn("interest lock failed:", (e as Error).message);
  }
}
