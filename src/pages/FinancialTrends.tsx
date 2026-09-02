import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LineChart, TrendingUp, TrendingDown, Search, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

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

  useEffect(() => {
    loadRates(interval);
  }, [interval]);

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
