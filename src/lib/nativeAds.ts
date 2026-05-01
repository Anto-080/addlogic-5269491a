import type { NativeAd } from "@/components/NativeAdSlot";
import { TIERS } from "@/lib/mockData";

/**
 * Curated native-ad pool. Each tier gets a deterministic sponsor so the
 * 1-time star rating per sponsor stays meaningful. This replaces a real
 * ad-network bid call for now — when sponsors come online we swap this
 * for an edge function fetch keyed by tierId + zero-party signals.
 */
const POOL: NativeAd[] = TIERS.map((t) => ({
  id: `ad-${t.id}`,
  sponsorId: `sponsor-${t.id}`,
  tierId: t.id,
  title: nativeTitle(t.name),
  body: nativeBody(t.name, t.subcategories[0] ?? "research"),
  ctaUrl: `https://duckduckgo.com/?q=${encodeURIComponent(`${t.name} sponsors`)}&ia=web`,
  cta: "Visit sponsor",
}));

function nativeTitle(name: string): string {
  return `${name} — featured partner`;
}
function nativeBody(name: string, sub: string): string {
  return `Curated sponsor matched to your ${sub.toLowerCase()} interests inside ${name}. Tap to credit your retribution before continuing.`;
}

/**
 * Returns the tier-matched sponsor ad. Falls back to the user's top
 * zero-party tier when the requested tier has no slot.
 */
export function pickNativeAd(tierId: number, fallbackTierIds: number[] = []): NativeAd | null {
  const direct = POOL.find((a) => a.tierId === tierId);
  if (direct) return direct;
  for (const id of fallbackTierIds) {
    const m = POOL.find((a) => a.tierId === id);
    if (m) return m;
  }
  return POOL[0] ?? null;
}
