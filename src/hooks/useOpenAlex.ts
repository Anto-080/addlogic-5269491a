import { useQuery } from "@tanstack/react-query";

export type OpenAlexWork = {
  id: string;
  title: string;
  doi: string | null;
  publication_year: number | null;
  host_venue: string | null;
  landing_page_url: string | null;
  open_access_url: string | null;
  authors: string[];
};

type RawWork = {
  id?: string;
  title?: string | null;
  display_name?: string | null;
  doi?: string | null;
  publication_year?: number | null;
  primary_location?: {
    landing_page_url?: string | null;
    source?: { display_name?: string | null } | null;
  } | null;
  open_access?: { oa_url?: string | null } | null;
  authorships?: { author?: { display_name?: string | null } | null }[];
};

const POLITE_PARAM = "mailto=research@addlogic.app";

async function fetchOpenAlex(query: string): Promise<OpenAlexWork[]> {
  const url =
    `https://api.openalex.org/works?search=${encodeURIComponent(query)}` +
    `&per-page=5&sort=relevance_score:desc&${POLITE_PARAM}`;
  const r = await fetch(url, { headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error(`OpenAlex error ${r.status}`);
  const j = await r.json();
  const results: RawWork[] = Array.isArray(j?.results) ? j.results : [];
  return results.map((w) => ({
    id: w.id ?? "",
    title: w.title ?? w.display_name ?? "(untitled)",
    doi: w.doi ?? null,
    publication_year: w.publication_year ?? null,
    host_venue: w.primary_location?.source?.display_name ?? null,
    landing_page_url: w.primary_location?.landing_page_url ?? null,
    open_access_url: w.open_access?.oa_url ?? null,
    authors: (w.authorships ?? [])
      .map((a) => a.author?.display_name ?? "")
      .filter(Boolean)
      .slice(0, 3),
  }));
}

export function useOpenAlex(query: string | null) {
  return useQuery({
    queryKey: ["openalex", query],
    queryFn: () => fetchOpenAlex(query!),
    enabled: !!query,
    staleTime: 60 * 60 * 1000,
    retry: 1,
  });
}
