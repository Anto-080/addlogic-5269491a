import { TIERS } from "@/lib/mockData";
import { TierIcon } from "@/components/TierIcon";

type Props = {
  position: "top" | "bottom";
  tierId?: number;
  required?: boolean;
  opened?: boolean;
  onOpen?: () => void;
};

export function AdBanner({ position, tierId = 4, required, opened, onOpen }: Props) {
  const tier = TIERS.find((t) => t.id === tierId) ?? TIERS[3];
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full text-left rounded-lg border p-3 transition-colors"
      style={{
        borderColor: opened ? "hsl(var(--border))" : tier.color,
        background: opened
          ? "hsl(var(--secondary) / 0.4)"
          : `linear-gradient(90deg, ${tier.color}26, transparent)`,
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span style={{ color: tier.color }}><TierIcon tierId={tier.id} size={22} /></span>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Sponsored · {position === "top" ? "Pre-roll" : "Post-roll"}
            </p>
            <p className="text-xs font-medium text-foreground truncate">
              {tier.name} · tier-matched ad
            </p>
          </div>
        </div>
        <span
          className="text-[10px] px-2 py-0.5 rounded-full shrink-0"
          style={{
            background: opened ? "hsl(var(--secondary))" : `${tier.color}33`,
            color: opened ? "hsl(var(--muted-foreground))" : tier.color,
          }}
        >
          {opened ? "Viewed ✓" : required ? "Tap to open" : "View"}
        </span>
      </div>
    </button>
  );
}
