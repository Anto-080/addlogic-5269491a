import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Building2, ExternalLink, Loader2, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Link } from "react-router-dom";

const ASH_GOLD = "#8C6F54";
const EVERGREEN = "#004627";

/** Baseline yield: 3% from Level 15 until the Financial Phase (Level 50). */
export const BASELINE_LEVEL = 15;
export const BASELINE_RATE = 3;

/** Staking yield ladder — base 4% at Level 50, one step per 10 further levels, MAX 10%. */
export const YIELD_LADDER = [4, 5, 6, 7, 8, 9, 10];

export function yieldForLevel(level: number) {
  if (level < BASELINE_LEVEL) return { rate: 0, idx: -1, baseline: true };
  if (level < 50) return { rate: BASELINE_RATE, idx: -1, baseline: true };
  const steps = Math.max(0, Math.floor((level - 50) / 10));
  const idx = Math.min(YIELD_LADDER.length - 1, steps);
  return { rate: YIELD_LADDER[idx], idx, baseline: false };
}

function projection(amount: number, rate: number, years: number) {
  return Array.from({ length: years + 1 }, (_, y) => ({
    year: `Y${y}`,
    value: Number((amount * Math.pow(1 + rate / 100, y)).toFixed(2)),
  }));
}

const money = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function Chart({ data, color }: { data: { year: string; value: number }[]; color: string }) {
  const gid = `grad-${color.replace("#", "")}`;
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.55} />
              <stop offset="100%" stopColor={color} stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.35} />
          <XAxis dataKey="year" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
          <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={62} />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(v: number) => [`$${money(v)}`, "Projected"]}
          />
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#${gid})`} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** The only interactive controls: hypothetical amount + projected years. */
function ProjectionControls({
  amount,
  setAmount,
  years,
  setYears,
}: {
  amount: number;
  setAmount: (n: number) => void;
  years: number;
  setYears: (n: number) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <label className="text-[11px] uppercase tracking-wide text-muted-foreground">
          Hypothetical deposit (own funds)
        </label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">$</span>
          <Input
            type="number"
            min={0}
            step={100}
            value={amount}
            onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
            className="bg-secondary/50 h-9"
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-[11px] uppercase tracking-wide text-muted-foreground">
          Years projected · <span className="text-foreground font-semibold">{years}</span>
        </label>
        <Slider min={1} max={10} step={1} value={[years]} onValueChange={(v) => setYears(v[0])} />
      </div>
    </div>
  );
}

function PanelShell({
  title,
  subtitle,
  onBack,
  children,
}: {
  title: string;
  subtitle: string;
  onBack: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>
      {children}
    </div>
  );
}

/* ───────────────────────── 1 — Stablecoin staking ───────────────────────── */

export function StakingPanel({ balance, level, onBack }: { balance: number; level: number; onBack: () => void }) {
  const { rate, idx, baseline } = yieldForLevel(level);
  const [preview, setPreview] = useState(rate || BASELINE_RATE);
  const [amount, setAmount] = useState(Math.round(balance) || 1000);
  const [years, setYears] = useState(10);
  const data = useMemo(() => projection(amount, preview, years), [amount, preview, years]);
  const final = data[data.length - 1]?.value ?? amount;

  return (
    <PanelShell
      title="Stablecoin Staking"
      subtitle={
        baseline
          ? `Baseline ${BASELINE_RATE}% / year active from Level ${BASELINE_LEVEL} (Level ${level})`
          : `Ladder yield ${rate}% / year (Level ${level})`
      }
      onBack={onBack}
    >
      <Card className="bg-card border-border/50">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            {[BASELINE_RATE, ...YIELD_LADDER].map((r, i) => {
              const isBaseline = i === 0;
              const unlocked = isBaseline ? level >= BASELINE_LEVEL : i - 1 <= idx;
              const active = preview === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => unlocked && setPreview(r)}
                  disabled={!unlocked}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                    active ? "text-white" : "text-muted-foreground"
                  } ${unlocked ? "cursor-pointer" : "opacity-40 cursor-not-allowed"}`}
                  style={{
                    backgroundColor: active ? EVERGREEN : "hsl(var(--secondary))",
                    borderColor: active ? ASH_GOLD : "hsl(var(--border))",
                  }}
                >
                  {r}%{isBaseline ? " BASE" : i - 1 === YIELD_LADDER.length - 1 ? " MAX" : ""}
                </button>
              );
            })}
          </div>

          <ProjectionControls amount={amount} setAmount={setAmount} years={years} setYears={setYears} />
          <Chart data={data} color={ASH_GOLD} />

          <p className="text-xs text-foreground/90">
            ${money(amount)} at {preview}% for {years} year{years > 1 ? "s" : ""} → <span className="font-semibold">${money(final)}</span>{" "}
            (+${money(final - amount)})
          </p>
          <p className="text-xs text-muted-foreground">
            The projected amount is an artificial value, detached from your on-site Time-Coin balance — it simulates what
            personal funds deposited into the same plan would return. Baseline {BASELINE_RATE}% runs from Level{" "}
            {BASELINE_LEVEL} until the Financial Phase; the ladder then rises one step every 10 levels, up to 10%.
          </p>
        </CardContent>
      </Card>
    </PanelShell>
  );
}

/* ─────────────────────── 2 — ∆Delta-neutral plans ─────────────────────── */

type LiveRate = {
  key: string;
  label: string;
  symbol: string;
  rate: number;
  annualizedVolatility: number | null;
  avgVolume: number | null;
  price: number | null;
};

const INTERVALS = [
  { key: "1d", label: "Daily" },
  { key: "1wk", label: "Weekly" },
  { key: "1mo", label: "Monthly" },
] as const;

const PLAN_NOTES: Record<string, string> = {
  paxg: "Gold-backed spot hedged ∆delta-neutral, funding capture on PAXG market volume.",
  wbtc: "Basis trade: long wBTC spot, short perpetual — market-neutral funding yield.",
  lending: "Over-collateralised lending pools across audited institutional venues.",
};

const PLAN_COLORS: Record<string, string> = { paxg: ASH_GOLD, wbtc: "#B4623A", lending: EVERGREEN };

function fnBase() {
  return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/company-finance`;
}
function fnHeaders() {
  return { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` };
}

export function DeltaNeutralPanel({ onBack }: { balance?: number; onBack: () => void }) {
  const [interval, setInterval] = useState<(typeof INTERVALS)[number]["key"]>("1d");
  const [amount, setAmount] = useState(1000);
  const [years, setYears] = useState(10);
  const [rates, setRates] = useState<LiveRate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch(`${fnBase()}?action=rates&interval=${interval}`, { headers: fnHeaders() })
      .then((r) => r.json())
      .then((j) => {
        if (alive) setRates(Array.isArray(j?.rates) ? j.rates : []);
      })
      .catch(() => alive && setRates([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [interval]);

  return (
    <PanelShell
      title="∆Delta-Neutral Plans"
      subtitle="Yields computed in real time from market volume and realised volatility."
      onBack={onBack}
    >
      <Card className="bg-card border-border/50">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            {INTERVALS.map((i) => (
              <button
                key={i.key}
                type="button"
                onClick={() => setInterval(i.key)}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                  interval === i.key ? "text-white" : "text-muted-foreground"
                }`}
                style={{
                  backgroundColor: interval === i.key ? EVERGREEN : "hsl(var(--secondary))",
                  borderColor: interval === i.key ? ASH_GOLD : "hsl(var(--border))",
                }}
              >
                {i.label}
              </button>
            ))}
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground self-center" />}
          </div>
          <ProjectionControls amount={amount} setAmount={setAmount} years={years} setYears={setYears} />
        </CardContent>
      </Card>

      {rates.map((r) => {
        const data = projection(amount, r.rate, years);
        const final = data[data.length - 1]?.value ?? amount;
        return (
          <Card key={r.key} className="bg-card border-border/50">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-sm font-semibold text-foreground">{r.label}</h3>
                <span className="text-xs font-semibold" style={{ color: PLAN_COLORS[r.key] ?? ASH_GOLD }}>
                  {r.rate}% / year
                </span>
              </div>
              <Chart data={data} color={PLAN_COLORS[r.key] ?? ASH_GOLD} />
              <p className="text-xs text-foreground/90">
                ${money(amount)} → <span className="font-semibold">${money(final)}</span> in {years} year
                {years > 1 ? "s" : ""}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {PLAN_NOTES[r.key] ?? ""} {r.annualizedVolatility != null && `Annualised volatility ${r.annualizedVolatility}%.`}{" "}
                {r.avgVolume != null && `Avg ${INTERVALS.find((i) => i.key === interval)?.label.toLowerCase()} volume ${Intl.NumberFormat(undefined, { notation: "compact" }).format(r.avgVolume)}.`}
              </p>
            </CardContent>
          </Card>
        );
      })}

      {!loading && rates.length === 0 && (
        <p className="text-xs text-destructive">Live market data unavailable right now — try again shortly.</p>
      )}
    </PanelShell>
  );
}

/* ──────────────── 3 — Sector-based investing (Yahoo Finance) ──────────────── */

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

const CACHE_KEY = "yf-company-cache-v1";
const DAY_MS = 86_400_000;

type CacheShape = Record<string, { at: number; companies: Company[] }>;

function readCache(): CacheShape {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
  } catch {
    return {};
  }
}
function writeCache(c: CacheShape) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(c));
  } catch {
    /* quota — ignore */
  }
}

const compactCap = (n: number | null, currency: string | null) =>
  n == null ? "—" : `${currency ? `${currency} ` : ""}${Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(n)}`;

export function CompaniesPanel({ onBack }: { onBack: () => void }) {
  const [q, setQ] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cachedAt, setCachedAt] = useState<number | null>(null);
  const reqRef = useRef(0);

  const run = async (query: string, force = false) => {
    const key = query.trim().toLowerCase();
    if (!key) return;
    const cache = readCache();
    const hit = cache[key];
    if (!force && hit && Date.now() - hit.at < DAY_MS) {
      setCompanies(hit.companies);
      setCachedAt(hit.at);
      setError(null);
      return;
    }
    const id = ++reqRef.current;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${fnBase()}?action=search&q=${encodeURIComponent(key)}`, { headers: fnHeaders() });
      const json = await res.json();
      if (reqRef.current !== id) return;
      const list: Company[] = Array.isArray(json?.companies) ? json.companies : [];
      setCompanies(list);
      setCachedAt(Date.now());
      cache[key] = { at: Date.now(), companies: list };
      writeCache(cache);
      if (list.length === 0) setError("No public companies matched that ticker or name.");
    } catch {
      if (reqRef.current === id) setError("Market directory unavailable right now.");
    } finally {
      if (reqRef.current === id) setLoading(false);
    }
  };

  return (
    <PanelShell
      title="Sector-Based Investing"
      subtitle="Public-company directory powered by Yahoo Finance — cached locally and refreshed daily."
      onBack={onBack}
    >
      <Card className="bg-card border-border/50">
        <CardContent className="p-4 space-y-3">
          <div className="flex gap-2">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") run(q);
              }}
              placeholder="Ticker or company name — e.g. NVDA, Novo Nordisk"
              className="bg-secondary/50"
            />
            <Button
              onClick={() => run(q)}
              disabled={loading || !q.trim()}
              className="gap-2 shrink-0 text-white"
              style={{ backgroundColor: EVERGREEN }}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Search
            </Button>
          </div>
          {cachedAt && (
            <button
              type="button"
              onClick={() => run(q, true)}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <RefreshCw className="h-3 w-3" /> Cached {new Date(cachedAt).toLocaleString()} — refresh now
            </button>
          )}
          {error && <p className="text-xs text-destructive">{error}</p>}
        </CardContent>
      </Card>

      <div className="space-y-2">
        {companies.map((c) => (
          <Card key={c.symbol} className="bg-card border-border/50">
            <CardContent className="p-3 space-y-2">
              <div className="flex items-start gap-2">
                <Building2 className="h-4 w-4 mt-0.5 shrink-0" style={{ color: ASH_GOLD }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{c.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {c.symbol}
                    {c.exchange ? ` · ${c.exchange}` : ""}
                    {c.sector ? ` · ${c.sector}` : ""}
                  </p>
                </div>
                <span className="text-[11px] font-semibold shrink-0" style={{ color: EVERGREEN }}>
                  {compactCap(c.marketCap, c.currency)}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {c.website && (
                  <a
                    href={c.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] px-2 py-1 rounded-full border text-foreground/90 inline-flex items-center gap-1"
                    style={{ borderColor: ASH_GOLD }}
                  >
                    <ExternalLink className="h-3 w-3" /> Website
                  </a>
                )}
                <Link
                  to={`/connections?company=${encodeURIComponent(c.symbol)}`}
                  className="text-[11px] px-2 py-1 rounded-full border text-foreground/90"
                  style={{ borderColor: ASH_GOLD, backgroundColor: "hsl(var(--secondary))" }}
                >
                  Researcher profiles
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </PanelShell>
  );
}
