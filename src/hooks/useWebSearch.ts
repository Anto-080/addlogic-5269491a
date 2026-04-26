import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { SearchResultItem } from "@/components/SearchResults";

export function useWebSearch() {
  return useMutation({
    mutationFn: async (query: string): Promise<SearchResultItem[]> => {
      const { data, error } = await supabase.functions.invoke("web-search", {
        body: { query, limit: 8 },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return (data?.results ?? []) as SearchResultItem[];
    },
  });
}
