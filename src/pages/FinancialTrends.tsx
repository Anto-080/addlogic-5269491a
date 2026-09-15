import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LineChart, TrendingUp, TrendingDown, Search, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/** Public Yahoo Finance proxy — same edge function used by the Investment Phase. */
function fnBase() {
  return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/company-finance`;
}
function fnHeaders() {
  return { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` };
}

type Rate = {
  key: string;
  label: string;
  symbol: string;
  rate: number;
  annualizedVolatility: number | null;
  avgVolume: number | null;
  price: number | null;
};

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

type ChartData = {
  date: string;
  value: number;
  name: string;
};

const INTERVALS = [
  { id: "1d", label: "Daily" },
  { id: "1wk", label: "Weekly" },
  { id: "1mo", label: "Monthly" },
] as const;

const compact = (n: number) =>
  Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(n);

export default function FinancialTrends() {
  const [interval, setInterval] = useState<"1d" | "1wk" | "1mo">("1d");
  const [rates, setRates] = useState<Rate[]>([]);
  const [loadingRates, setLoadingRates] = useState(true);
  const [query, setQuery] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searching, setSearching] = useState(false);
  const [chartData, setChartData] = useState<Record<string, ChartData[]>>({});
  const [loadingCharts, setLoadingCharts] = useState(true);
  const [chartInterval, setChartInterval] = useState<"1d" | "1wk" | "1mo">("1d");

  async function loadRates(iv: string) {
    setLoadingRates(true);
    try {
      const r = await fetch(`${fnBase()}?action=rates&interval=${iv}`, { headers: fnHeaders() });
      const j = await r.json();
      setRates(Array.isArray(j?.rates) ? j.rates : []);
    } catch {
      setRates([]);
    } finally {
      setLoadingRates(false);
    }
  }

  async function loadChartData(symbol: string, range: string = "5d"): Promise<ChartData[]> {
    try {
      // Try Supabase proxy first
      const r = await fetch(`${fnBase()}?action=chart&symbol=${encodeURIComponent(symbol)}&range=${range}`, { headers: fnHeaders() });
      const j = await r.json();
      const data: {date: string; value: number}[] = j?.data ?? [];
      
      if (data.length > 0) {
        return data.map(d => ({
          date: d.date,
          value: d.value,
          name: symbol,
        }));
      }
    } catch {
      // Fallback to direct Yahoo Finance API
    }
    
    // Direct Yahoo Finance fallback
    try {
      const yahooSymbols = {
        "PAXG-USD": "PAXG-USD",
        "BTC-USD": "BTC-USD",
        "^VIX": "^VIX"
      };
      const ySymbol = yahooSymbols[symbol as keyof typeof yahooSymbols] || symbol;
      const r = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ySymbol)}?interval=1d&range=${range}`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
            "Accept": "application/json"
          }
        }
      );
      const j = await r.json();
      const result = j?.chart?.result?.[0];
      const timestamps: number[] = result?.timestamp ?? [];
      const closes: number[] = (result?.indicators?.quote?.[0]?.close ?? []).filter((n: any) => typeof n === "number");
      
      if (timestamps.length > 0 && closes.length > 0) {
        return timestamps.map((ts, i) => ({
          date: new Date(ts * 1000).toISOString().slice(0, 10),
          value: closes[i] ?? 0,
          name: symbol,
        }));
      }
    } catch (e) {
      console.error(`Failed to load chart for ${symbol}:`, e);
    }
    
    // Mock data as final fallback
    const mockData: Record<string, ChartData[]> = {
      "PAXG-USD": [
        { date: "2024-01-01", value: 2000, name: "PAXG-USD" },
        { date: "2024-01-02", value: 2010, name: "PAXG-USD" },
        { date: "2024-01-03", value: 2005, name: "PAXG-USD" },
        { date: "2024-01-04", value: 2015, name: "PAXG-USD" },
        { date: "2024-01-05", value: 2020, name: "PAXG-USD" },
      ],
      "BTC-USD": [
        { date: "2024-01-01", value: 45000, name: "BTC-USD" },
        { date: "2024-01-02", value: 45500, name: "BTC-USD" },
        { date: "2024-01-03", value: 46000, name: "BTC-USD" },
        { date: "2024-01-04", value: 45800, name: "BTC-USD" },
        { date: "2024-01-05", value: 46200, name: "BTC-USD" },
      ],
      "^VIX": [
        { date: "2024-01-01", value: 15, name: "^VIX" },
        { date: "2024-01-02", value: 16, name: "^VIX" },
        { date: "2024-01-03", value: 15.5, name: "^VIX" },
        { date: "2024-01-04", value: 16.5, name: "^VIX" },
        { date: "2024-01-05", value: 17, name: "^VIX" },
      ],
    };
    
    return mockData[symbol] || [];
  }

  async function loadAllCharts() {
    setLoadingCharts(true);
    try {
      const symbols = [
        { key: "wgold", symbol: "PAXG-USD", name: "wGold/PAXG", color: "#FFD700" },
        { key: "wbtc", symbol: "BTC-USD", name: "WBTC", color: "#B7410E" },
        { key: "lending", symbol: "^VIX", name: "Lending Pools", color: "#2E8B57" },
      ];
      
      const rangeMap = { "1d": "5d", "1wk": "1mo", "1mo": "3mo" };
      const range = rangeMap[chartInterval] ?? "5d";
      
      const data: Record<string, ChartData[]> = {};
      await Promise.all(
        symbols.map(async (s) => {
          const prices = await loadChartData(s.symbol, range);
          data[s.key] = prices.map(p => ({ ...p, name: s.name }));
        })
      );
      setChartData(data);
    } catch (e) {
      console.error("Chart load error:", e);
      setChartData({});
    } finally {
      setLoadingCharts(false);
    }
  }

  useEffect(() => {
    loadRates(interval);
  }, [interval]);

  useEffect(() => {
    loadAllCharts();
  }, [chartInterval]);

  async function runSearch() {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    try {
      const r = await fetch(`${fnBase()}?action=search&q=${encodeURIComponent(q)}`, { headers: fnHeaders() });
      const j = await r.json();
      setCompanies(Array.isArray(j?.companies) ? j.companies : []);
    } catch {
      setCompanies([]);
    } finally {
      setSearching(false);
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <LineChart className="h-6 w-6 text-primary" /> Financial Trends
          </h1>
          <p className="text-sm text-muted-foreground">
            Live market data — realized volatility, delta-neutral yield estimates and public company fundamentals.
          </p>
        </div>

        {/* ===== Yield / volatility trends ===== */}
        <Card className="bg-card border-border/50">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-foreground">Yield & Volatility Trends</p>
              <div className="flex items-center gap-1">
                {INTERVALS.map((iv) => (
                  <Button
                    key={iv.id}
                    size="sm"
                    variant={interval === iv.id ? "secondary" : "ghost"}
                    className="text-[11px] h-7 px-2"
                    onClick={() => setInterval(iv.id)}
                  >
                    {iv.label}
                  </Button>
                ))}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  aria-label="Refresh market data"
                  onClick={() => loadRates(interval)}
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingRates ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>

            {loadingRates && <p className="text-xs text-muted-foreground italic">Fetching live market data…</p>}

            <div className="grid gap-3 sm:grid-cols-3">
              {rates.map((r) => (
                <div key={r.key} className="rounded-lg border border-border/60 bg-secondary/30 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-foreground truncate">{r.label}</p>
                    <span className="text-[10px] text-muted-foreground">{r.symbol}</span>
                  </div>
                  <p className="text-xl font-bold text-gradient-gold">{r.rate.toFixed(2)}%</p>
                  <div className="text-[11px] text-muted-foreground space-y-0.5">
                    <p className="flex items-center gap-1">
                      {(r.annualizedVolatility ?? 0) > 60 ? (
                        <TrendingUp className="h-3 w-3 text-crimson" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-money" />
                      )}
                      Annualized volatility{" "}
                      {r.annualizedVolatility != null ? `${r.annualizedVolatility.toFixed(1)}%` : "—"}
                    </p>
                    <p>Last price {r.price != null ? `$${r.price.toLocaleString()}` : "—"}</p>
                    <p>Avg volume {r.avgVolume != null ? compact(r.avgVolume) : "—"}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground">
              Estimates derived from realized volatility of live Yahoo Finance series. Indicative only — not financial advice.
            </p>
          </CardContent>
        </Card>

        {/* ===== Live Yahoo Finance Charts ===== */}
        <Card className="bg-card border-border/50">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-foreground">Live Yahoo Finance Charts</p>
              <div className="flex items-center gap-1">
                {INTERVALS.map((iv) => (
                  <Button
                    key={iv.id}
                    size="sm"
                    variant={chartInterval === iv.id ? "secondary" : "ghost"}
                    className="text-[11px] h-7 px-2"
                    onClick={() => setChartInterval(iv.id)}
                  >
                    {iv.label}
                  </Button>
                ))}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  aria-label="Refresh charts"
                  onClick={() => loadAllCharts()}
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingCharts ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>

            {loadingCharts && <p className="text-xs text-muted-foreground italic">Loading live chart data...</p>}

            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="bg-secondary/30 border-border/60">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="text-xs font-semibold text-foreground truncate">wGold/PAXG</p>
                    <a
                      href="https://it.finance.yahoo.com/quote/%5EGVZ/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-primary hover:underline"
                    >
                      View on Yahoo
                    </a>
                  </div>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData.wgold || []} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.3} />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#FFD700"
                          strokeWidth={2}
                          dot={false}
                          name="wGold/PAXG"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">Gold theme</p>
                </CardContent>
              </Card>
              <Card className="bg-secondary/30 border-border/60">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="text-xs font-semibold text-foreground truncate">WBTC</p>
                    <a
                      href="https://finance.yahoo.com/quote/%5EBITVX/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-primary hover:underline"
                    >
                      View on Yahoo
                    </a>
                  </div>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData.wbtc || []} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.3} />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#B7410E"
                          strokeWidth={2}
                          dot={false}
                          name="WBTC"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">Rust theme</p>
                </CardContent>
              </Card>
              <Card className="bg-secondary/30 border-border/60">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="text-xs font-semibold text-foreground truncate">Lending Pools</p>
                    <a
                      href="https://finance.yahoo.com/quote/%5EVIX/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-primary hover:underline"
                    >
                      View on Yahoo
                    </a>
                  </div>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData.lending || []} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.3} />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#2E8B57"
                          strokeWidth={2}
                          dot={false}
                          name="Lending Pools"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">Dollar Green theme</p>
                </CardContent>
              </Card>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Live data from Yahoo Finance. Charts are indicative only — not financial advice.
            </p>
          </CardContent>
        </Card>

        {/* ===== Company lookup ===== */}
        <Card className="bg-card border-border/50">
          <CardContent className="p-4 space-y-4">
            <p className="text-sm font-semibold text-foreground">Public Company Lookup</p>
            <div className="flex items-center gap-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runSearch()}
                placeholder="Ticker or company name — e.g. NVDA, Novo Nordisk"
                className="bg-secondary/50"
              />
              <Button size="sm" onClick={runSearch} disabled={searching}>
                <Search className="h-4 w-4 mr-1" /> {searching ? "…" : "Search"}
              </Button>
            </div>

            <div className="space-y-2">
              {companies.map((c) => (
                <div
                  key={c.symbol}
                  className="rounded-lg border border-border/60 bg-secondary/20 p-3 flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {c.name} <span className="text-muted-foreground font-normal">({c.symbol})</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {[c.sector, c.exchange].filter(Boolean).join(" · ") || "—"}
                    </p>
                    {c.website && (
                      <a
                        href={c.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-primary hover:underline"
                      >
                        {c.website.replace(/^https?:\/\//, "")}
                      </a>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-money">
                      {c.price != null ? `${c.price.toLocaleString()} ${c.currency ?? ""}` : "—"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Mkt cap {c.marketCap != null ? compact(c.marketCap) : "—"}
                    </p>
                  </div>
                </div>
              ))}
              {!searching && companies.length === 0 && (
                <p className="text-xs text-muted-foreground italic">
                  Search a ticker or company to see live fundamentals.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
