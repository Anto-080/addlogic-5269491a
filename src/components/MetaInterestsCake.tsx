/**
 * Meta-Interests Cake — dependency-free SVG donut showing the user's
 * percentage of accumulated research time per tier. Powers the affinity
 * matchmaking flow on the Dashboard "Top Milestones" card.
 */
type Slice = { color: string; percent: number; label: string };

export function MetaInterestsCake({ slices }: { slices: Slice[] }) {
  const total = slices.reduce((s, x) => s + x.percent, 0);
  const data = total > 0 ? slices : [{ color: "hsl(var(--muted))", percent: 100, label: "No data yet" }];

  const size = 180;
  const r = 70;
  const cx = size / 2;
  const cy = size / 2;
  const stroke = 22;

  let acc = 0;
  const arcs = data.map((s, i) => {
    const start = (acc / 100) * Math.PI * 2 - Math.PI / 2;
    acc += Math.max(0, s.percent);
    const end = (acc / 100) * Math.PI * 2 - Math.PI / 2;
    const large = end - start > Math.PI ? 1 : 0;
    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);
    const d = `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
    return <path key={i} d={d} stroke={s.color} strokeWidth={stroke} fill="none" strokeLinecap="butt" />;
  });

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Meta-interests donut chart">
        {arcs}
        <text x={cx} y={cy - 4} textAnchor="middle" className="fill-foreground" fontSize="13" fontWeight="600">
          Affinity
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" className="fill-muted-foreground" fontSize="10">
          Map
        </text>
      </svg>
      <ul className="w-full space-y-1">
        {data.slice(0, 3).map((s, i) => (
          <li key={i} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 min-w-0">
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
              <span className="truncate text-foreground/90">{s.label}</span>
            </span>
            <span className="font-medium text-foreground/80">{Math.round(s.percent)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
