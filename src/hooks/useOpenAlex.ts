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
  /**
   * Pre-resolved HTML-only URL for the in-app outbound browser.
   * PDF links are intentionally filtered out — opening a `.pdf` would
   * leave our browser shell and break the polling/chronology system.
   */
  safe_url: string | null;
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

/** Detect direct PDF links (path ends `.pdf` or contains `/pdf/`). */
function isPdfLike(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    const path = u.pathname.toLowerCase();
    return path.endsWith(".pdf") || path.includes("/pdf/");
  } catch {
    return /\.pdf($|\?)/i.test(url) || /\/pdf\//i.test(url);
  }
}

function pickSafeUrl(w: {
  id: string;
  doi: string | null;
  landing_page_url: string | null;
  open_access_url: string | null;
}): string | null {
  if (w.landing_page_url && !isPdfLike(w.landing_page_url)) return w.landing_page_url;
  if (w.open_access_url && !isPdfLike(w.open_access_url)) return w.open_access_url;
  if (w.doi) {
    const doi = w.doi.replace(/^https?:\/\/doi\.org\//, "");
    return `https://doi.org/${doi}`;
  }
  if (w.id) {
    // OpenAlex IDs come back as `https://openalex.org/W12345…`
    return w.id.startsWith("http") ? w.id : `https://openalex.org/${w.id}`;
  }
  return null;
}

async function fetchOpenAlex(query: string): Promise<OpenAlexWork[]> {
  // `has_doi:true` drops a large class of pure-PDF preprints upstream so
  // we don't have to filter them client-side.
  const url =
    `https://api.openalex.org/works?search=${encodeURIComponent(query)}` +
    `&filter=has_doi:true` +
    `&per-page=5&sort=relevance_score:desc&${POLITE_PARAM}`;
  const r = await fetch(url, { headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error(`OpenAlex error ${r.status}`);
  const j = await r.json();
  const results: RawWork[] = Array.isArray(j?.results) ? j.results : [];
  return results.map((w) => {
    const rawLanding = w.primary_location?.landing_page_url ?? null;
    const rawOa = w.open_access?.oa_url ?? null;
    // Drop PDF candidates entirely — never expose them in the UI.
    const landing_page_url = isPdfLike(rawLanding) ? null : rawLanding;
    const open_access_url = isPdfLike(rawOa) ? null : rawOa;
    const id = w.id ?? "";
    const doi = w.doi ?? null;
    return {
      id,
      title: w.title ?? w.display_name ?? "(untitled)",
      doi,
      publication_year: w.publication_year ?? null,
      host_venue: w.primary_location?.source?.display_name ?? null,
      landing_page_url,
      open_access_url,
      authors: (w.authorships ?? [])
        .map((a) => a.author?.display_name ?? "")
        .filter(Boolean)
        .slice(0, 3),
      safe_url: pickSafeUrl({ id, doi, landing_page_url, open_access_url }),
    };
  });
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
