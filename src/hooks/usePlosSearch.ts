import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PlosResult = {
  id: string;
  title: string;
  journal: string | null;
  date: string | null;
  abstract: string | null;
  url: string;
};

export function usePlosSearch() {
  return useMutation({
    mutationFn: async (query: string): Promise<PlosResult[]> => {
      const { data, error } = await supabase.functions.invoke("plos-search", {
        body: { query, limit: 8 },
        headers: { "Content-Type": "application/json" },
      });
      if (error) {
        console.error("plos-search invoke error:", error);
        throw error;
      }
      return (data?.results ?? []) as PlosResult[];
    },
  });
}
