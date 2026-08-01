Deno.serve(async () => {
  const out: Record<string, unknown> = {};
  for (const [k, u] of Object.entries({
    md: 'https://md.incommon.org/InCommon/InCommon-metadata-idp-only.xml',
    disco: 'https://discovery.incommon.org/DiscoFeed',
  })) {
    try {
      const r = await fetch(u, { headers: { Accept: '*/*' } });
      const t = (await r.text()).slice(0, 300);
      out[k] = { status: r.status, head: t };
    } catch (e) { out[k] = { err: String(e) }; }
  }
  return new Response(JSON.stringify(out), { headers: { 'Content-Type': 'application/json' } });
});
