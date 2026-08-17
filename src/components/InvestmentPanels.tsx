import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Building2,
  ExternalLink,
  Folder,
  Loader2,
  Pin,
  RefreshCw,
  Search,
  Star,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { YearDial } from "@/components/YearDial";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Link } from "react-router-dom";

const ASH_GOLD = "#8C6F54";
const EVERGREEN = "#004627";
const BRONZE = "#A67D3D";
const AMBER = "#F2B23E";

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

const money = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Month-by-month projection. Month 0 is the user's starting capital ("Zero" of the graph). */
function projection(amount: number, rate: number, years: number) {
  const months = Math.max(1, Math.round(years * 12));
  const m = Math.pow(1 + rate / 100, 1 / 12);
  return Array.from({ length: months + 1 }, (_, i) => ({
    m: i,
    label: i % 12 === 0 ? `Y${i / 12}` : `M${i}`,
    value: Number((amount * Math.pow(m, i)).toFixed(2)),
  }));
}

function Chart({
  data,
  color,
  base,
  unit = "$",
}: {
  data: { m: number; label: string; value: number }[];
  color: string;
  base: number;
  unit?: string;
}) {
  const gid = `grad-${color.replace("#", "")}`;
  const years = Math.round((data.length - 1) / 12);
  const ticks = Array.from({ length: years + 1 }, (_, y) => y * 12);
  return (
    // Everything is inert; only the dots on the projection line react to pointers.
    <div className="h-56 w-full select-none [&_.recharts-cartesian-axis]:pointer-events-none [&_.recharts-cartesian-grid]:pointer-events-none [&_.recharts-surface]:outline-none [&_*]:outline-none">
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
            dataKey="m"
            type="number"
            domain={[0, data.length - 1]}
            ticks={ticks}
            tickFormatter={(m: number) => (m === 0 ? "0" : `${m / 12}y`)}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          />
          <YAxis
            domain={[base, "auto"]}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            width={62}
            tickFormatter={(v: number) => Intl.NumberFormat(undefined, { notation: "compact" }).format(v)}
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
            labelFormatter={(m: number) => `Month ${m} · ${(m / 12).toFixed(1)}y`}
            formatter={(v: number) => [`${unit}${money(v)}`, "Projected"]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gid})`}
            animationDuration={650}
            dot={false}
            activeDot={{ r: 5, fill: color, stroke: "hsl(var(--card))", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
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
          <ArrowLeft className="h-4 w-4" /> Back to Investment Phase
        </Button>
      </div>
      {children}
    </div>
  );
}

function InvestPersonalAssetsButton() {
  return (
    <Button
      type="button"
      className="w-full text-white"
      style={{ backgroundColor: EVERGREEN, borderColor: ASH_GOLD }}
      onClick={() => window.open("https://mountainprotocol.com/usdm/", "_blank", "noopener,noreferrer")}
    >
      <Wallet className="mr-2 h-4 w-4" /> Invest your Personal Assets
    </Button>
  );
}

/** Deposit field + year dial + personal-assets CTA (the only interactive controls). */
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
      <YearDial value={years} onChange={setYears} />
      <InvestPersonalAssetsButton />
    </div>
  );
}

/** Two side-by-side graphs: on-site balance vs. user-inserted value. */
function DualProjection({
  balance,
  amount,
  rate,
  years,
  color,
}: {
  balance: number;
  amount: number;
  rate: number;
  years: number;
  color: string;
}) {
  const onSite = useMemo(() => projection(balance, rate, years), [balance, rate, years]);
  const own = useMemo(() => projection(amount, rate, years), [amount, rate, years]);
  const endA = onSite[onSite.length - 1]?.value ?? balance;
  const endB = own[own.length - 1]?.value ?? amount;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-2">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
          On-site balance · zero = T$ {money(balance)}
        </p>
        <Chart data={onSite} color={color} base={balance} unit="T$ " />
        <p className="text-xs text-foreground/90">
          T$ {money(balance)} → <span className="font-semibold">T$ {money(endA)}</span> (+T$ {money(endA - balance)})
        </p>
      </div>
      <div className="space-y-2">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
          Projected returns on deposit · zero = ${money(amount)}
        </p>
        <Chart data={own} color={ASH_GOLD} base={amount} />
        <p className="text-xs text-foreground/90">
          ${money(amount)} → <span className="font-semibold">${money(endB)}</span> (+${money(endB - amount)})
        </p>
      </div>
    </div>
  );
}

/* ───────────────────────── 1 — Stablecoin staking ───────────────────────── */

export function StakingPanel({ balance, level, onBack }: { balance: number; level: number; onBack: () => void }) {
  const { rate, idx, baseline } = yieldForLevel(level);
  const [preview, setPreview] = useState(rate || BASELINE_RATE);
  const [amount, setAmount] = useState(Math.round(balance) || 1000);
  const [years, setYears] = useState(10);

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
          <DualProjection balance={balance} amount={amount} rate={preview} years={years} color={EVERGREEN} />

          <p className="text-xs font-semibold" style={{ color: AMBER }}>
            Investing Personal Assets increase both Financial Sector &amp; Overall Experience.
          </p>
          <p className="text-xs text-muted-foreground">
            The right-hand projection is an artificial value, detached from your on-site Time-Coin balance — it
            simulates what personal funds deposited into the same plan would return. Baseline {BASELINE_RATE}% runs
            from Level {BASELINE_LEVEL} until the Financial Phase; the ladder then rises one step every 10 levels, up
            to 10%.
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
  periodRate?: number | null;
  volumeShare?: number | null;
  annualizedVolatility: number | null;
  avgVolume: number | null;
  price: number | null;
};

const INTERVALS = [
  { key: "1d", label: "Daily" },
  { key: "1wk", label: "Weekly" },
  { key: "1mo", label: "Monthly" },
] as const;

/** Yearly interest average swings per plan. */
const SWINGS: Record<string, [number, number]> = {
  paxg: [6.5, 10],
  wbtc: [7, 20],
  lending: [4, 12],
};

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

/** Bronze square-bordered metric bar with a live + historical forecast average. */
function BronzeBar({
  title,
  period,
  pct,
  scale = 100,
  suffix = "%",
}: {
  title: string;
  period: string;
  pct: number | null;
  scale?: number;
  suffix?: string;
}) {
  const v = pct ?? 0;
  const w = Math.max(2, Math.min(100, (v / scale) * 100));
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between text-[10px] uppercase tracking-wide">
        <span className="text-muted-foreground">
          {title} · {period}
        </span>
        <span className="font-semibold" style={{ color: BRONZE }}>
          {pct == null ? "—" : `${v.toFixed(2)}${suffix}`}
        </span>
      </div>
      <div
        className="h-3 w-full overflow-hidden"
        style={{ border: `1px solid ${BRONZE}`, borderRadius: 2, background: "hsl(var(--secondary))" }}
      >
        <div
          className="h-full transition-all duration-700"
          style={{ width: `${w}%`, backgroundColor: BRONZE, opacity: 0.85 }}
        />
      </div>
    </div>
  );
}

export function DeltaNeutralPanel({ balance = 0, onBack }: { balance?: number; onBack: () => void }) {
  const [interval, setInterval] = useState<(typeof INTERVALS)[number]["key"]>("1d");
  const [amount, setAmount] = useState(1000);
  const [years, setYears] = useState(10);
  const [rates, setRates] = useState<LiveRate[]>([]);
  const [loading, setLoading] = useState(true);
  const periodLabel = INTERVALS.find((i) => i.key === interval)?.label ?? "Daily";

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
        const swing = SWINGS[r.key];
        return (
          <Card key={r.key} className="bg-card border-border/50">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-sm font-semibold text-foreground">{r.label}</h3>
                <span className="text-[11px] font-semibold text-right" style={{ color: PLAN_COLORS[r.key] ?? ASH_GOLD }}>
                  Yearly Interests Averages Swings
                  <br />
                  {swing ? `${swing[0]}–${swing[1]}%` : "—"}
                </span>
              </div>

              <DualProjection
                balance={balance}
                amount={amount}
                rate={r.rate}
                years={years}
                color={PLAN_COLORS[r.key] ?? ASH_GOLD}
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <BronzeBar
                  title="Interest for period"
                  period={periodLabel}
                  pct={r.periodRate ?? null}
                  scale={interval === "1mo" ? 2 : interval === "1wk" ? 0.5 : 0.1}
                />
                <BronzeBar title="Trade volume share" period={periodLabel} pct={r.volumeShare ?? null} />
              </div>

              <p className="text-[11px] text-muted-foreground">{PLAN_NOTES[r.key] ?? ""}</p>
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
const SAVED_KEY = "yf-saved-companies-v1";
const PORTFOLIO_KEY = "yf-wrapped-portfolio-v1";
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
function readList<T>(key: string): T[] {
  try {
    const v = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

/** Pinned research-relevant public companies, always visible. */
const PINNED: Company[] = [
  { symbol: "NVDA", name: "NVIDIA Corporation", sector: "Technology", exchange: "NasdaqGS", marketCap: null, currency: "USD", website: "https://www.nvidia.com", price: null },
  { symbol: "ASML", name: "ASML Holding N.V.", sector: "Technology", exchange: "NasdaqGS", marketCap: null, currency: "USD", website: "https://www.asml.com", price: null },
  { symbol: "NVO", name: "Novo Nordisk A/S", sector: "Healthcare", exchange: "NYSE", marketCap: null, currency: "USD", website: "https://www.novonordisk.com", price: null },
  { symbol: "MRNA", name: "Moderna, Inc.", sector: "Healthcare", exchange: "NasdaqGS", marketCap: null, currency: "USD", website: "https://www.modernatx.com", price: null },
  { symbol: "TMO", name: "Thermo Fisher Scientific", sector: "Healthcare", exchange: "NYSE", marketCap: null, currency: "USD", website: "https://www.thermofisher.com", price: null },
  { symbol: "ENPH", name: "Enphase Energy, Inc.", sector: "Energy", exchange: "NasdaqGM", marketCap: null, currency: "USD", website: "https://www.enphase.com", price: null },
];

const compactCap = (n: number | null, currency: string | null) =>
  n == null ? "—" : `${currency ? `${currency} ` : ""}${Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(n)}`;

function CompanyRow({
  c,
  saved,
  onToggleSave,
  pinned,
}: {
  c: Company;
  saved: boolean;
  onToggleSave: (c: Company) => void;
  pinned?: boolean;
}) {
  return (
    <Card className="bg-card border-border/50">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start gap-2">
          {pinned ? (
            <Pin className="h-4 w-4 mt-0.5 shrink-0" style={{ color: BRONZE }} />
          ) : (
            <Building2 className="h-4 w-4 mt-0.5 shrink-0" style={{ color: ASH_GOLD }} />
          )}
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
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleSave(c)}
            className="text-[11px] px-2 py-1 rounded-full border inline-flex items-center gap-1 text-foreground/90"
            style={{ borderColor: saved ? BRONZE : "hsl(var(--border))", backgroundColor: saved ? "hsl(var(--secondary))" : "transparent" }}
          >
            <Star className="h-3 w-3" style={{ color: saved ? BRONZE : undefined }} />
            {saved ? "Saved" : "Save in memory list"}
          </button>
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
  );
}

export function CompaniesPanel({ onBack }: { onBack: () => void }) {
  const [q, setQ] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cachedAt, setCachedAt] = useState<number | null>(null);
  const [saved, setSaved] = useState<Company[]>(() => readList<Company>(SAVED_KEY));
  const [view, setView] = useState<"search" | "saved" | "portfolio">("search");
  const portfolio = useMemo(
    () => readList<{ symbol: string; name: string; units: number; wrapped: string }>(PORTFOLIO_KEY),
    [],
  );
  const reqRef = useRef(0);

  const isSaved = (s: string) => saved.some((x) => x.symbol === s);
  const toggleSave = (c: Company) => {
    setSaved((prev) => {
      const next = prev.some((x) => x.symbol === c.symbol) ? prev.filter((x) => x.symbol !== c.symbol) : [...prev, c];
      try {
        localStorage.setItem(SAVED_KEY, JSON.stringify(next));
      } catch {
        /* quota */
      }
      return next;
    });
  };

  const run = async (query: string, force = false) => {
    const key = query.trim().toLowerCase();
    if (!key) return;
    setView("search");
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

      {view === "search" && (
        <div className="space-y-4 animate-fade-in">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Pinned companies</p>
            {PINNED.map((c) => (
              <CompanyRow key={c.symbol} c={c} pinned saved={isSaved(c.symbol)} onToggleSave={toggleSave} />
            ))}
          </div>
          {companies.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Search results</p>
              {companies.map((c) => (
                <CompanyRow key={c.symbol} c={c} saved={isSaved(c.symbol)} onToggleSave={toggleSave} />
              ))}
            </div>
          )}
        </div>
      )}

      {view === "saved" && (
        <div className="space-y-2 animate-fade-in">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Saved companies</p>
          {saved.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Nothing saved yet — use “Save in memory list” on any company to follow its andament here.
            </p>
          ) : (
            saved.map((c) => <CompanyRow key={c.symbol} c={c} saved onToggleSave={toggleSave} />)
          )}
        </div>
      )}

      {view === "portfolio" && (
        <div className="space-y-2 animate-fade-in">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Portfolio — wrapped stock options</p>
          {portfolio.length === 0 ? (
            <Card className="bg-card border-border/50">
              <CardContent className="p-4 space-y-1">
                <p className="text-xs text-foreground/90">No wrapped stock options owned yet.</p>
                <p className="text-[11px] text-muted-foreground">
                  Wrapped positions acquired in the Financial Phase will be listed here with their live andament.
                </p>
              </CardContent>
            </Card>
          ) : (
            portfolio.map((p) => (
              <Card key={p.symbol} className="bg-card border-border/50">
                <CardContent className="p-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {p.symbol} · {p.wrapped}
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold" style={{ color: BRONZE }}>
                    {p.units} units
                  </span>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          style={{ borderColor: BRONZE, color: "hsl(var(--foreground))" }}
          onClick={() => setView(view === "saved" ? "search" : "saved")}
        >
          <Star className="h-4 w-4" style={{ color: BRONZE }} /> Saved Companies
        </Button>
        <button
          type="button"
          onClick={() => setView(view === "portfolio" ? "search" : "portfolio")}
          className="relative inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-foreground"
          style={{
            backgroundColor: "hsl(var(--secondary))",
            border: `1px solid ${BRONZE}`,
            borderRadius: "2px 10px 6px 6px",
            clipPath: "polygon(0 12%, 42% 12%, 50% 0, 100% 0, 100% 100%, 0 100%)",
          }}
        >
          <Folder className="h-4 w-4" style={{ color: BRONZE }} /> Portfolio
        </button>
      </div>
    </PanelShell>
  );
}
