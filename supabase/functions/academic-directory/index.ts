/**
 * academic-directory — builds a searchable university IdP directory from the
 * InCommon and eduGAIN SAML federations.
 *
 * InCommon publishes a compact discovery feed (JSON) and eduGAIN exposes a
 * technical API; both are far smaller than the raw multi-hundred-MB metadata
 * aggregates, so they can be fetched and parsed inside a function invocation.
 * If a feed is unavailable we degrade to whatever the other one returned.
 *
 * GET /academic-directory?q=stanford  ->  { entities: [...], sources: [...] }
 */
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

type Entity = {
  name: string;
  entityId: string;
  ssoUrl: string | null;
  domains: string[];
  federation: 'InCommon' | 'eduGAIN';
};

const INCOMMON_DISCOFEED = 'https://wayf.incommon.org/InCommon/discofeed';
const EDUGAIN_API =
  'https://technical.edugain.org/api.php?action=list_entities&type=idp&format=json';

let cache: { at: number; entities: Entity[]; sources: string[] } | null = null;
const TTL_MS = 6 * 60 * 60 * 1000;

function hostToDomain(url: string | null | undefined): string[] {
  if (!url) return [];
  try {
    const host = new URL(url).hostname.toLowerCase();
    const parts = host.split('.');
    // keep the registrable-ish tail: foo.idp.stanford.edu -> stanford.edu
    const tail = parts.slice(-3).join('.').match(/(ac|edu|gov)\.[a-z]{2}$/)
      ? parts.slice(-3).join('.')
      : parts.slice(-2).join('.');
    return [tail];
  } catch {
    return [];
  }
}

async function fetchInCommon(): Promise<Entity[]> {
  const res = await fetch(INCOMMON_DISCOFEED, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`InCommon ${res.status}`);
  const raw = (await res.json()) as Array<Record<string, unknown>>;
  return raw.map((e) => {
    const names = (e.DisplayNames as Array<{ value: string }> | undefined) ?? [];
    const entityId = String(e.entityID ?? '');
    return {
      name: names[0]?.value ?? entityId,
      entityId,
      ssoUrl: null,
      domains: hostToDomain(entityId.startsWith('http') ? entityId : null),
      federation: 'InCommon' as const,
    };
  });
}

async function fetchEduGain(): Promise<Entity[]> {
  const res = await fetch(EDUGAIN_API, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`eduGAIN ${res.status}`);
  const raw = (await res.json()) as Array<Record<string, unknown>>;
  return raw.map((e) => {
    const entityId = String(e.entityid ?? e.entityID ?? '');
    return {
      name: String(e.name ?? e.displayname ?? entityId),
      entityId,
      ssoUrl: null,
      domains: hostToDomain(entityId.startsWith('http') ? entityId : null),
      federation: 'eduGAIN' as const,
    };
  });
}

async function build() {
  if (cache && Date.now() - cache.at < TTL_MS) return cache;
  const sources: string[] = [];
  const entities: Entity[] = [];
  const results = await Promise.allSettled([fetchInCommon(), fetchEduGain()]);
  const labels = ['InCommon', 'eduGAIN'];
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      entities.push(...r.value);
      sources.push(labels[i]);
    } else {
      console.error(`${labels[i]} feed failed:`, r.reason);
    }
  });
  const seen = new Set<string>();
  const deduped = entities.filter((e) => {
    if (!e.entityId || !e.name || seen.has(e.entityId)) return false;
    seen.add(e.entityId);
    return true;
  });
  cache = { at: Date.now(), entities: deduped, sources };
  return cache;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const q = (new URL(req.url).searchParams.get('q') ?? '').trim().toLowerCase();
    const { entities, sources } = await build();
    const matches = q
      ? entities
          .filter(
            (e) =>
              e.name.toLowerCase().includes(q) ||
              e.entityId.toLowerCase().includes(q) ||
              e.domains.some((d) => d.includes(q)),
          )
          .sort((a, b) => a.name.length - b.name.length)
          .slice(0, 10)
      : [];
    return new Response(JSON.stringify({ entities: matches, total: entities.length, sources }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'directory unavailable';
    console.error('academic-directory failed:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
