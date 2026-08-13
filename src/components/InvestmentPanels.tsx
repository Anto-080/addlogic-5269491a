import { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TIERS } from "@/lib/mockData";

const ASH_GOLD = "#8C6F54";
const EVERGREEN = "#004627";

/** Staking yield ladder — base 4%, one step per 10 levels above 50, MAX 10%. */
export const YIELD_LADDER = [4, 5, 6, 7, 8, 9, 10];

export function yieldForLevel(level: number) {
  const steps = Math.max(0, Math.floor((level - 50) / 10));
  const idx = Math.min(YIELD_LADDER.length - 1, steps);
  return { rate: YIELD_LADDER[idx], idx };
}

function projection(balance: number, rate: number, years = 10) {
  return Array.from({ length: years + 1 }, (_, y) => ({
    year: `Y${y}`,
    value: Number((balance * Math.pow(1 + rate / 100, y)).toFixed(2)),
  }));
}

function Chart({ data, color }: { data: { year: string; value: number }[]; color: string }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.55} />
              <stop offset="100%" stopColor={color} stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.35} />
          <XAxis dataKey="year" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
          <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={54} />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(v: number) => [`T$${v.toFixed(2)}`, "Projected"]}
          />
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#grad-${color.replace("#", "")})`} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function PanelShell({ title, subtitle, onBack, children }: { title: string; subtitle: string; onBack: () => void; children: React.ReactNode }) {
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

/** 1 — Stablecoin staking projection */
export function StakingPanel({ balance, level, onBack }: { balance: number; level: number; onBack: () => void }) {
  const { rate, idx } = yieldForLevel(level);
  const [preview, setPreview] = useState(rate);
  const data = useMemo(() => projection(balance, preview), [balance, preview]);

  return (
    <PanelShell
      title="Stablecoin Staking"
      subtitle={`Time-Coin balance T$${balance.toFixed(2)} · current yield ${rate}% / year (Level ${level})`}
      onBack={onBack}
    >
      <Card className="bg-card border-border/50">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            {YIELD_LADDER.map((r, i) => {
              const unlocked = i <= idx;
              const active = preview === r;
              return (
                <button
                  key={r}
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
                  {r}%{i === YIELD_LADDER.length - 1 ? " MAX" : ""}
                </button>
              );
            })}
          </div>
          <Chart data={data} color={ASH_GOLD} />
          <p className="text-xs text-muted-foreground">
            Projection over 10 years, compounded yearly. The yield ladder rises one step every 10 experience levels
            beyond Level 50, up to a 10% maximum.
          </p>
        </CardContent>
      </Card>
    </PanelShell>
  );
}

/** 2 — ∆Delta-neutral plans */
const DELTA_PLANS = [
  { key: "paxg", label: "wGold / PAXG", rate: 4.5, note: "Gold-backed, ∆delta-neutral hedged spot with funding capture." },
  { key: "wbtc", label: "wBTC", rate: 6.8, note: "Basis trade: long wBTC spot, short perpetual — market-neutral funding yield." },
  { key: "lending", label: "Lending Pools", rate: 8.2, note: "Over-collateralised lending pools across audited institutional venues." },
] as const;

export function DeltaNeutralPanel({ balance, onBack }: { balance: number; onBack: () => void }) {
  const [plan, setPlan] = useState<(typeof DELTA_PLANS)[number]["key"]>("paxg");
  const active = DELTA_PLANS.find((p) => p.key === plan)!;
  const data = useMemo(() => projection(balance, active.rate), [balance, active.rate]);

  return (
    <PanelShell
      title="∆Delta-Neutral Plans"
      subtitle={`Time-Coin balance T$${balance.toFixed(2)} · average yearly yields per strategy`}
      onBack={onBack}
    >
      <Card className="bg-card border-border/50">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            {DELTA_PLANS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPlan(p.key)}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                  plan === p.key ? "text-white" : "text-muted-foreground"
                }`}
                style={{
                  backgroundColor: plan === p.key ? EVERGREEN : "hsl(var(--secondary))",
                  borderColor: plan === p.key ? ASH_GOLD : "hsl(var(--border))",
                }}
              >
                {p.label} · {p.rate}%
              </button>
            ))}
          </div>
          <Chart data={data} color={EVERGREEN} />
          <p className="text-xs text-muted-foreground">{active.note}</p>
        </CardContent>
      </Card>
    </PanelShell>
  );
}

/** 3 — Sector companies per tier (placeholder directory) */
const TIER_COMPANIES: Record<number, string[]> = {
  1: ["Moderna", "CRISPR Therapeutics", "Novo Nordisk"],
  2: ["Roche", "Danaher", "Thermo Fisher"],
  3: ["ASML", "Commonwealth Fusion", "IBM Quantum"],
  19: ["BASF", "Merck KGaA", "Agilent"],
  20: ["Ørsted", "Vestas", "First Solar"],
  4: ["Veolia", "Xylem", "Tomra"],
  5: ["Visa", "BlackRock", "Adyen"],
  6: ["NVIDIA", "TSMC", "ARM"],
  7: ["Sotheby's", "Pearson", "Netflix"],
  18: ["Booking Holdings", "Airbnb", "Trip.com"],
  8: ["Thomson Reuters", "Axel Springer", "NYT"],
  21: ["L'Oréal", "Lululemon", "Peloton"],
  9: ["Nintendo", "Ubisoft", "Spotify"],
  10: ["Nestlé", "HelloFresh", "Danone"],
  11: ["CBRE", "Vonovia", "Zillow"],
  12: ["Amazon", "Zalando", "MercadoLibre"],
  13: ["Estée Lauder", "Beiersdorf", "Shiseido"],
  14: ["Inditex", "LVMH", "EssilorLuxottica"],
  15: ["Nike", "Adidas", "Electronic Arts"],
};

export function CompaniesPanel({ onBack }: { onBack: () => void }) {
  return (
    <PanelShell
      title="Sector-Based Investing"
      subtitle="Companies grouped by research tier — directory expands as partners come online."
      onBack={onBack}
    >
      <div className="space-y-2">
        {TIERS.filter((t) => TIER_COMPANIES[t.id]).map((t) => (
          <Card key={t.id} className="bg-card border-border/50">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{t.icon}</span>
                <span className="text-xs font-semibold text-foreground">{t.name}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {TIER_COMPANIES[t.id].map((c) => (
                  <span
                    key={c}
                    className="text-[11px] px-2 py-1 rounded-full border text-foreground/90"
                    style={{ backgroundColor: `${t.color.replace("hsl(", "hsla(").replace(")", ", 0.18)")}`, borderColor: ASH_GOLD }}
                  >
                    {c}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </PanelShell>
  );
}
