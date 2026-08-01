Deno.serve(async () => {
  const out: Record<string, unknown> = {};
  for (const [k, u] of Object.entries({
    inc: 'https://wayf.incommon.org/InCommon/discofeed',
    edu: 'https://technical.edugain.org/api.php?action=list_entities&type=idp&format=json',
  })) {
    try {
      const r = await fetch(u, { headers: { Accept: 'application/json' } });
      const t = await r.text();
      out[k] = { status: r.status, len: t.length, head: t.slice(0, 600) };
    } catch (e) { out[k] = { err: String(e) }; }
  }
  return new Response(JSON.stringify(out), { headers: { 'Content-Type': 'application/json' } });
});
