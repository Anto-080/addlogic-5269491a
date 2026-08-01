/**
 * academic-directory — searchable university identity-provider directory.
 *
 * Source: the eduGAIN technical API (https://technical.edugain.org), which is
 * the interfederation aggregate and therefore already contains the InCommon
 * registry (entities carry `regauth: https://incommon.org` / code `InCommon`).
 * The raw InCommon aggregate host (wayf.incommon.org / md.incommon.org) is not
 * resolvable from this runtime, so eduGAIN is used as the single feed and the
 * federation of origin is reported per entity.
 *
 * GET /academic-directory?q=stanford -> { entities, total, sources }
 */
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

type Entity = {
  name: string;
  entityId: string;
  domains: string[];
  federation: string;
  ssoUrl: string | null;
};

const EDUGAIN_API =
  'https://technical.edugain.org/api.php?action=list_entities&type=idp&format=json';

let cache: { at: number; entities: Entity[] } | null = null;
const TTL_MS = 6 * 60 * 60 * 1000;

/** eduGAIN display names look like "en;Stanford University" (multi-lang, ; separated). */
function displayName(raw: unknown): string {
  const s = typeof raw === 'string' ? raw : '';
  const first = s.split('|')[0];
  const parts = first.split(';');
  return (parts.length > 1 ? parts.slice(1).join(';') : first).trim();
}

function scopes(raw: unknown): string[] {
  if (typeof raw !== 'string' || !raw) return [];
  return raw
    .split(/[,\s|]+/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.includes('.') && !s.includes('*'))
    .slice(0, 4);
}

async function build(): Promise<Entity[]> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.entities;
  const res = await fetch(EDUGAIN_API, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`eduGAIN feed ${res.status}: ${await res.text()}`);
  const raw = (await res.json()) as unknown;
  const rows: Array<Record<string, unknown>> = [];
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (Array.isArray(item)) rows.push(...(item as Array<Record<string, unknown>>));
      else if (item && typeof item === 'object') rows.push(item as Record<string, unknown>);
    }
  }
  const seen = new Set<string>();
  const entities: Entity[] = [];
  for (const r of rows) {
    if (String(r.roledesc ?? '') !== 'IDPSSODescriptor') continue;
    const entityId = String(r.entityid ?? r.entityID ?? '');
    if (!entityId || seen.has(entityId)) continue;
    const name = displayName(r.e_displayname ?? r.r_displayname) || entityId;
    seen.add(entityId);
    entities.push({
      name,
      entityId,
      domains: scopes(r.scopes),
      federation: String(r.code ?? '').trim() || 'eduGAIN',
      ssoUrl: null,
    });
  }
  cache = { at: Date.now(), entities };
  return entities;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const q = (new URL(req.url).searchParams.get('q') ?? '').trim().toLowerCase();
    const entities = await build();
    const matches = q
      ? entities
          .filter(
            (e) =>
              e.name.toLowerCase().includes(q) ||
              e.domains.some((d) => d.includes(q)) ||
              e.entityId.toLowerCase().includes(q),
          )
          .sort((a, b) => a.name.length - b.name.length)
          .slice(0, 10)
      : [];
    return new Response(
      JSON.stringify({ entities: matches, total: entities.length, sources: ['eduGAIN', 'InCommon'] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : 'directory unavailable';
    console.error('academic-directory failed:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
