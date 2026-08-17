// Public Yahoo Finance proxy — no API key required.
// Actions:
//   ?action=search&q=<ticker or company name>  -> company directory rows
//   ?action=rates&interval=1d|1wk|1mo          -> live delta-neutral yield estimates
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

async function yf(url: string, extra: Record<string, string> = {}) {
  const r = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json", ...extra } });
  if (!r.ok) throw new Error(`Yahoo ${r.status}`);
  return await r.json();
}

/** Yahoo requires a cookie + crumb pair for quoteSummary. Cached per invocation. */
let session: { cookie: string; crumb: string } | null = null;
async function ensureSession() {
  if (session) return session;
  try {
    const res = await fetch("https://fc.yahoo.com", { headers: { "User-Agent": UA }, redirect: "manual" });
    const raw = res.headers.get("set-cookie") ?? "";
    const cookie = raw.split(";")[0];
    if (!cookie) return null;
    const cr = await fetch("https://query1.finance.yahoo.com/v1/test/getcrumb", {
      headers: { "User-Agent": UA, Cookie: cookie },
    });
    const crumb = (await cr.text()).trim();
    if (!crumb || crumb.length > 32) return null;
    session = { cookie, crumb };
    return session;
  } catch {
    return null;
  }
}

type Company = {
  symbol: string;
  name: string;
  sector: string | null;
  exchange: string | null;
  marketCap: number | null;
  currency: string | null;
  website: string | null;
  price: number | null;
};

async function detail(symbol: string): Promise<Partial<Company>> {
  try {
    const s = await ensureSession();
    if (!s) return {};
    const j = await yf(
      `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=assetProfile,price,summaryProfile&crumb=${encodeURIComponent(s.crumb)}`,
      { Cookie: s.cookie },
    );
    const res = j?.quoteSummary?.result?.[0];
    const price = res?.price ?? {};
    const prof = res?.assetProfile ?? res?.summaryProfile ?? {};
    return {
      sector: prof?.sector ?? null,
      website: prof?.website ?? null,
      marketCap: price?.marketCap?.raw ?? null,
      currency: price?.currency ?? null,
      price: price?.regularMarketPrice?.raw ?? null,
    };
  } catch {
    return {};
  }
}

async function search(q: string): Promise<Company[]> {
  const j = await yf(
    `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=8&newsCount=0&listsCount=0`,
  );
  const quotes: any[] = (j?.quotes ?? []).filter((x: any) => x?.symbol && x?.quoteType !== "OPTION");
  const base: Company[] = quotes.slice(0, 8).map((x: any) => ({
    symbol: x.symbol,
    name: x.longname ?? x.shortname ?? x.symbol,
    sector: x.sector ?? null,
    exchange: x.exchDisp ?? x.exchange ?? null,
    marketCap: null,
    currency: null,
    website: null,
    price: null,
  }));
  const filled = await Promise.all(
    base.map(async (c) => ({ ...c, ...(await detail(c.symbol)) })),
  );
  return filled;
}

/** Realized-volatility driven yield estimate — market volume/vol drives funding capture. */
async function rates(interval: string) {
  const range = interval === "1mo" ? "5y" : interval === "1wk" ? "2y" : "6mo";
  const symbols = [
    { key: "paxg", label: "wGold / PAXG", symbol: "PAXG-USD", base: 3.2, k: 0.14 },
    { key: "wbtc", label: "wBTC", symbol: "BTC-USD", base: 4.0, k: 0.075 },
    { key: "lending", label: "Lending Pools", symbol: "ETH-USD", base: 5.0, k: 0.09 },
  ];
  const per = Math.sqrt(interval === "1mo" ? 12 : interval === "1wk" ? 52 : 365);

  const out = await Promise.all(
    symbols.map(async (s) => {
      try {
        const j = await yf(
          `https://query1.finance.yahoo.com/v8/finance/chart/${s.symbol}?interval=${interval}&range=${range}`,
        );
        const r = j?.chart?.result?.[0];
        const closes: number[] = (r?.indicators?.quote?.[0]?.close ?? []).filter((n: any) => typeof n === "number");
        const vols: number[] = (r?.indicators?.quote?.[0]?.volume ?? []).filter((n: any) => typeof n === "number");
        const rets: number[] = [];
        for (let i = 1; i < closes.length; i++) rets.push(Math.log(closes[i] / closes[i - 1]));
        const mean = rets.reduce((a, b) => a + b, 0) / Math.max(1, rets.length);
        const variance = rets.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, rets.length - 1);
        const annVol = Math.sqrt(variance) * per * 100;
        const rate = Math.max(1.5, Math.min(14, s.base + s.k * annVol));
        const avgVolume = vols.length ? vols.reduce((a, b) => a + b, 0) / vols.length : null;
        return {
          key: s.key,
          label: s.label,
          symbol: s.symbol,
          rate: Number(rate.toFixed(2)),
          annualizedVolatility: Number(annVol.toFixed(1)),
          avgVolume,
          price: closes.length ? closes[closes.length - 1] : null,
        };
      } catch {
        return { key: s.key, label: s.label, symbol: s.symbol, rate: s.base, annualizedVolatility: null, avgVolume: null, price: null };
      }
    }),
  );
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") ?? "search";
    if (action === "rates") {
      const interval = ["1d", "1wk", "1mo"].includes(url.searchParams.get("interval") ?? "")
        ? url.searchParams.get("interval")!
        : "1d";
      return new Response(JSON.stringify({ interval, rates: await rates(interval) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const q = (url.searchParams.get("q") ?? "").trim();
    if (!q) return new Response(JSON.stringify({ companies: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    return new Response(JSON.stringify({ companies: await search(q) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
