import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Building2,
  ExternalLink,
  FolderArchive,
  Loader2,
  Lock,
  Pin,
  RefreshCw,
  Search,
  Star,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const ASH_GOLD = "#8C6F54";
const EVERGREEN = "#004627";
const BRONZE = "#A67D3D";
const SILVER = "#D3D6D8";
const EMERALD_MSG = "#8BE796";

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

/** Non-interactive chart: only the projection dot responds to the pointer. */
function Chart({ data, color }: { data: { year: string; value: number }[]; color: string }) {
  const gid = `grad-${color.replace("#", "")}`;
  return (
    <div className="h-56 w-full select-none" style={{ WebkitTapHighlightColor: "transparent" }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.55} />
              <stop offset="100%" stopColor={color} stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.35} />
          <XAxis
            dataKey="year"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            width={62}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={false}
            isAnimationActive={false}
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(v: number) => [`$${money(v)}`, "Projected"]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gid})`}
            activeDot={{ r: 5, fill: color, stroke: "hsl(var(--card))", strokeWidth: 2 }}
            animationDuration={700}
            animationEasing="ease-in-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Bronze-bordered live-feed meter. */
function MeterBar({ label, value, pct }: { label: string; value: string; pct: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
        <span className="text-[11px] font-semibold" style={{ color: BRONZE }}>{value}</span>
      </div>
      <div
        className="h-3 w-full overflow-hidden"
        style={{ border: `1px solid ${BRONZE}`, borderRadius: 2, background: "hsl(var(--secondary))" }}
      >
        <div
          className="h-full transition-all duration-700 ease-out"
          style={{ width: `${Math.max(2, Math.min(100, pct))}%`, backgroundColor: BRONZE }}
        />
      </div>
    </div>
  );
}

function InvestPersonalButton({ label = "Invest your Personal Assets" }: { label?: string }) {
  return (
    <button
      type="button"
      className="w-full text-xs font-semibold px-4 py-2 text-white transition-transform active:scale-[0.99]"
      style={{
        backgroundColor: BRONZE,
        border: `2px solid ${SILVER}`,
        borderRadius: 9999,
        boxShadow: `0 0 0 1px ${SILVER}33`,
      }}
    >
      {label}
    </button>
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
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Projected Earnings on Deposit
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
      <InvestPersonalButton />
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
        <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground shrink-0" onClick={onBack}>
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

          <p
            className="text-center text-xs font-semibold px-3 py-2 rounded-md"
            style={{ color: EMERALD_MSG, backgroundColor: "hsl(150 60% 20% / 0.18)", border: `1px solid ${EMERALD_MSG}44` }}
          >
            Investing Personal Assets increase both Overall &amp; Financial Sector Field Experience
          </p>

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

/** Yearly interest average swings shown above each graph. */
const PLAN_SWINGS: Record<string, [number, number]> = {
  paxg: [6.5, 10],
  wbtc: [7, 20],
  lending: [4, 12],
};

const LOCKED_PLANS = [
  {
    key: "food",
    label: "Wrapped Food Futures",
    color: "#2D8442",
    requirement: "Lv.25 Field Experience on both Financial & Ecology",
  },
  {
    key: "energy",
    label: "Wrapped Energy Futures",
    color: "#0892D0",
    requirement: "Lv.25 Field Experience on both Financial & Energy",
  },
  {
    key: "science",
    label: "Science & Biotechnology Futures",
    color: "#4E387E",
    requirement: "Lv.25 Field Experience on both Financial & Science",
  },
];

function fnBase() {
  return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/company-finance`;
}
function fnHeaders() {
  return { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` };
}

const compact = (n: number) => Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(n);

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

  const maxVolume = Math.max(1, ...rates.map((r) => r.avgVolume ?? 0));

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
        const swing = PLAN_SWINGS[r.key];
        const color = PLAN_COLORS[r.key] ?? ASH_GOLD;
        const interestPct = swing
          ? ((r.rate - swing[0]) / Math.max(0.1, swing[1] - swing[0])) * 100
          : Math.min(100, r.rate * 8);
        const volumePct = ((r.avgVolume ?? 0) / maxVolume) * 100;
        return (
          <Card key={r.key} className="bg-card border-border/50">
            <CardContent className="p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">{r.label}</h3>
              {swing && (
                <p className="text-center text-[11px] font-semibold" style={{ color }}>
                  Yearly Interests Averages Swings · {String(swing[0]).replace(".", ",")}–{swing[1]}%
                </p>
              )}
              <Chart data={data} color={color} />
              <p className="text-xs text-foreground/90">
                ${money(amount)} → <span className="font-semibold">${money(final)}</span> in {years} year
                {years > 1 ? "s" : ""}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <MeterBar
                  label="Percentage of Interest Live Feed"
                  value={`${r.rate}%`}
                  pct={interestPct}
                />
                <MeterBar
                  label="Trade Volume / Liquidity"
                  value={r.avgVolume != null ? compact(r.avgVolume) : "—"}
                  pct={volumePct}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">{PLAN_NOTES[r.key] ?? ""}</p>
            </CardContent>
          </Card>
        );
      })}

      {!loading && rates.length === 0 && (
        <p className="text-xs text-destructive">Live market data unavailable right now — try again shortly.</p>
      )}

      {/* Locked future markets */}
      {LOCKED_PLANS.map((p) => (
        <Card key={p.key} className="border-border/50 overflow-hidden" style={{ backgroundColor: `${p.color}14` }}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold" style={{ color: p.color }}>{p.label}</h3>
              <span
                className="text-[10px] font-semibold px-2 py-1 rounded-full inline-flex items-center gap-1 text-white"
                style={{ backgroundColor: p.color }}
              >
                <Lock className="h-3 w-3" /> LOCKED
              </span>
            </div>
            <div
              className="h-32 w-full rounded-md flex items-center justify-center select-none"
              style={{
                background: `repeating-linear-gradient(135deg, ${p.color}22 0 10px, transparent 10px 20px)`,
                border: `1px solid ${p.color}55`,
              }}
            >
              <Lock className="h-6 w-6" style={{ color: p.color }} />
            </div>
            <p className="text-[11px] text-muted-foreground">{p.requirement}.</p>
          </CardContent>
        </Card>
      ))}
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
const PIN_KEY = "yf-pinned-companies-v1";
const RATED_KEY = "yf-rated-companies-v1";
const PORTFOLIO_KEY = "yf-portfolio-companies-v1";
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

function readStore<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeStore(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

type RatedCompany = Company & { stars: number; ratedAt: number };
type Holding = Company & { addedAt: number };

const compactCap = (n: number | null, currency: string | null) =>
  n == null ? "—" : `${currency ? `${currency} ` : ""}${Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(n)}`;

/** Non-emoji filing-cabinet glyph reused for the Portfolio button. */
function FilingCabinetIcon({ className }: { className?: string }) {
  return <FolderArchive className={className} />;
}

function StarRow({
  value,
  onChange,
  size = 20,
}: {
  value: number;
  onChange?: (n: number) => void;
  size?: number;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          className={onChange ? "transition-transform hover:scale-110" : "cursor-default"}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
        >
          <Star
            style={{ width: size, height: size, color: BRONZE }}
            fill={n <= value ? BRONZE : "none"}
            strokeWidth={1.6}
          />
        </button>
      ))}
    </div>
  );
}

function CompanyMeta({ c }: { c: Company }) {
  return (
    <p className="text-[11px] text-muted-foreground">
      {c.symbol}
      {c.exchange ? ` · ${c.exchange}` : ""}
      {c.sector ? ` · ${c.sector}` : ""}
    </p>
  );
}

export function CompaniesPanel({ onBack }: { onBack: () => void }) {
  const [q, setQ] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cachedAt, setCachedAt] = useState<number | null>(null);
  const reqRef = useRef(0);

  const [pinned, setPinned] = useState<Company[]>(() => readStore<Company[]>(PIN_KEY, []));
  const [rated, setRated] = useState<RatedCompany[]>(() => readStore<RatedCompany[]>(RATED_KEY, []));
  const [portfolio, setPortfolio] = useState<Holding[]>(() => readStore<Holding[]>(PORTFOLIO_KEY, []));
  const [rating, setRating] = useState<{ company: Company; stars: number } | null>(null);
  const [drawer, setDrawer] = useState<null | "rated" | "portfolio">(null);

  useEffect(() => writeStore(PIN_KEY, pinned), [pinned]);
  useEffect(() => writeStore(RATED_KEY, rated), [rated]);
  useEffect(() => writeStore(PORTFOLIO_KEY, portfolio), [portfolio]);

  const isPinned = (s: string) => pinned.some((p) => p.symbol === s);
  const togglePin = (c: Company) =>
    setPinned((prev) => (prev.some((p) => p.symbol === c.symbol) ? prev.filter((p) => p.symbol !== c.symbol) : [c, ...prev]));

  const addToPortfolio = (c: Company) =>
    setPortfolio((prev) =>
      prev.some((p) => p.symbol === c.symbol) ? prev : [{ ...c, addedAt: Date.now() }, ...prev],
    );

  const saveRating = () => {
    if (!rating) return;
    const entry: RatedCompany = { ...rating.company, stars: rating.stars, ratedAt: Date.now() };
    setRated((prev) => [entry, ...prev.filter((p) => p.symbol !== entry.symbol)]);
    setRating(null);
  };

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

  /* ── Full-screen 5-star rating overlay ── */
  if (rating) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 p-6 bg-background/98 backdrop-blur-sm animate-fade-in">
        <button
          type="button"
          onClick={() => setRating(null)}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
          aria-label="Close rating"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="text-center space-y-1">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Rate Company</p>
          <h2 className="text-xl font-bold text-foreground">{rating.company.name}</h2>
          <CompanyMeta c={rating.company} />
        </div>
        <StarRow value={rating.stars} size={44} onChange={(n) => setRating({ ...rating, stars: n })} />
        <p className="text-xs text-muted-foreground">{rating.stars || 0} / 5</p>
        <Button
          disabled={!rating.stars}
          onClick={saveRating}
          className="text-white"
          style={{ backgroundColor: EVERGREEN, border: `2px solid ${SILVER}`, borderRadius: 9999 }}
        >
          Save rating
        </Button>
      </div>
    );
  }

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

          {pinned.length > 0 && (
            <div className="space-y-2 pt-1">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                <Pin className="h-3 w-3" style={{ color: BRONZE }} /> Saved Pinned Companies
              </p>
              <div className="flex flex-wrap gap-2">
                {pinned.map((p) => (
                  <span
                    key={p.symbol}
                    className="text-[11px] px-2 py-1 rounded-full inline-flex items-center gap-1.5 text-foreground/90"
                    style={{ border: `1px solid ${BRONZE}`, backgroundColor: "hsl(var(--secondary))" }}
                  >
                    {p.symbol}
                    <button type="button" onClick={() => togglePin(p)} aria-label={`Unpin ${p.symbol}`}>
                      <X className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

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
                  <CompanyMeta c={c} />
                </div>
                <span className="text-[11px] font-semibold shrink-0" style={{ color: EVERGREEN }}>
                  {compactCap(c.marketCap, c.currency)}
                </span>
                <button
                  type="button"
                  onClick={() => togglePin(c)}
                  className="shrink-0 rounded-full p-1 transition-colors"
                  style={{
                    border: `1px solid ${isPinned(c.symbol) ? BRONZE : "hsl(var(--border))"}`,
                    backgroundColor: isPinned(c.symbol) ? `${BRONZE}22` : "transparent",
                  }}
                  aria-label={isPinned(c.symbol) ? `Unpin ${c.symbol}` : `Pin ${c.symbol}`}
                  title={isPinned(c.symbol) ? "Pinned" : "Pin this company"}
                >
                  <Pin
                    className="h-3.5 w-3.5"
                    style={{ color: isPinned(c.symbol) ? BRONZE : "hsl(var(--muted-foreground))" }}
                    fill={isPinned(c.symbol) ? BRONZE : "none"}
                  />
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
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
                <button
                  type="button"
                  onClick={() => setRating({ company: c, stars: rated.find((r) => r.symbol === c.symbol)?.stars ?? 0 })}
                  className="text-[11px] px-2 py-1 rounded-full border text-foreground/90 inline-flex items-center gap-1"
                  style={{ borderColor: ASH_GOLD, backgroundColor: "hsl(var(--secondary))" }}
                >
                  <Star className="h-3 w-3" style={{ color: BRONZE }} /> Rate Company
                </button>
                <button
                  type="button"
                  onClick={() => addToPortfolio(c)}
                  className="text-[11px] font-semibold px-3 py-1 text-white"
                  style={{ backgroundColor: BRONZE, border: `2px solid ${SILVER}`, borderRadius: 9999 }}
                >
                  {portfolio.some((p) => p.symbol === c.symbol) ? "In Portfolio" : "Invest"}
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bottom storage buttons */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={() => setDrawer(drawer === "rated" ? null : "rated")}
          className="text-[11px] font-semibold px-3 py-2 rounded-md inline-flex items-center gap-1.5 text-foreground/90"
          style={{ border: `1px solid ${BRONZE}`, backgroundColor: "hsl(var(--secondary))" }}
        >
          <Star className="h-3.5 w-3.5" style={{ color: BRONZE }} fill={BRONZE} /> Saved Rated Companies
          {rated.length > 0 && <span className="text-muted-foreground">({rated.length})</span>}
        </button>
        <button
          type="button"
          onClick={() => setDrawer(drawer === "portfolio" ? null : "portfolio")}
          className="text-[11px] font-semibold px-3 py-2 rounded-md inline-flex items-center gap-1.5 text-foreground/90"
          style={{ border: `1px solid ${BRONZE}`, backgroundColor: "hsl(var(--secondary))" }}
        >
          <FilingCabinetIcon className="h-3.5 w-3.5" /> Portfolio
          {portfolio.length > 0 && <span className="text-muted-foreground">({portfolio.length})</span>}
        </button>
      </div>

      {drawer === "rated" && (
        <Card className="bg-card border-border/50 animate-fade-in">
          <CardContent className="p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Saved Rated Companies</h3>
            {rated.length === 0 ? (
              <p className="text-xs text-muted-foreground">No ratings saved yet.</p>
            ) : (
              rated.map((r) => (
                <div key={r.symbol} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{r.name}</p>
                    <CompanyMeta c={r} />
                  </div>
                  <StarRow value={r.stars} size={14} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {drawer === "portfolio" && (
        <Card className="bg-card border-border/50 animate-fade-in">
          <CardContent className="p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Portfolio — Wrapped Stock Options Owned</h3>
            {portfolio.length === 0 ? (
              <p className="text-xs text-muted-foreground">No wrapped stock options held yet.</p>
            ) : (
              portfolio.map((h) => (
                <div key={h.symbol} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{h.name}</p>
                    <CompanyMeta c={h} />
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-semibold" style={{ color: BRONZE }}>
                      {h.price != null ? `$${money(h.price)}` : "—"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPortfolio((prev) => prev.filter((p) => p.symbol !== h.symbol))}
                      aria-label={`Remove ${h.symbol}`}
                    >
                      <X className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </PanelShell>
  );
}
