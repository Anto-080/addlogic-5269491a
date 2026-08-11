import { TIERS } from "@/lib/mockData";

/**
 * Zero-party cookies = a structured, user-derived signal we WRITE to
 * `document.cookie` ourselves, using the user's in-app behaviour. Unlike
 * first-party cookies (set by other sites we visit) and third-party cookies
 * (set by ad networks we don't control), zero-party data is volunteered.
 *
 * We persist:
 *   - `rr.zero.perTier` : { [tierId]: secondsActive }
 *   - `rr.zero.bumps`   : { [tierId]: multiplierBonus } (every 8h → +1)
 *   - `rr.zero.top`     : ordered list of top tier ids
 *   - `rr.zero.searches`: total search count
 *
 * The cookie is updated locally; the server-side mirror lives in
 * `tier_progress` (per-user RLS).
 */

const COOKIE_PREFIX = "rr_zero_";
const ONE_YEAR = 60 * 60 * 24 * 365;
// 1 hour of validated active research = +1 permanent multiplier (lifetime,
// no upper cap — modeled on the reward you get from real-world practice).
export const SECONDS_PER_BUMP = 60 * 60;

function setCookie(name: string, value: string) {
  try {
    document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${ONE_YEAR};SameSite=Lax`;
  } catch {
    /* noop */
  }
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

export function readAllCookies(): Record<string, string> {
  if (typeof document === "undefined") return {};
  const out: Record<string, string> = {};
  document.cookie.split(/;\s*/).forEach((pair) => {
    const [k, ...rest] = pair.split("=");
    if (!k) return;
    out[k] = decodeURIComponent(rest.join("="));
  });
  return out;
}

type PerTier = Record<number, number>;

function readJson<T>(key: string, fallback: T): T {
  const raw = getCookie(COOKIE_PREFIX + key);
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

function writeJson(key: string, value: unknown) {
  setCookie(COOKIE_PREFIX + key, JSON.stringify(value));
}

export function getPerTierSeconds(): PerTier {
  return readJson<PerTier>("perTier", {});
}

export function getPerTierBumps(): PerTier {
  return readJson<PerTier>("bumps", {});
}

export function getTopInterestTiers(): number[] {
  return readJson<number[]>("top", []);
}

export function getSearchCount(): number {
  return Number(getCookie(COOKIE_PREFIX + "searches") ?? "0") || 0;
}

export function bumpSearchCount() {
  setCookie(COOKIE_PREFIX + "searches", String(getSearchCount() + 1));
}

/**
 * Add `seconds` of research to `tierId`, recompute the bump count, and
 * return both the new total and any newly granted multiplier bonus.
 */
export function bumpInterestSignal(tierId: number, seconds: number): {
  totalSeconds: number;
  multiplierBonus: number;
  newlyGranted: number;
} {
  const perTier = getPerTierSeconds();
  const bumps = getPerTierBumps();
  const next = (perTier[tierId] ?? 0) + Math.max(0, Math.floor(seconds));
  perTier[tierId] = next;

  const earnedBumps = Math.floor(next / SECONDS_PER_BUMP);
  const previousBumps = bumps[tierId] ?? 0;
  const newlyGranted = Math.max(0, earnedBumps - previousBumps);
  bumps[tierId] = earnedBumps;

  writeJson("perTier", perTier);
  writeJson("bumps", bumps);

  // Recompute top interests (descending by seconds).
  const top = Object.entries(perTier)
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => Number(id))
    .slice(0, 5);
  writeJson("top", top);

  return { totalSeconds: next, multiplierBonus: earnedBumps, newlyGranted };
}

/**
 * Field Experience — "Science field → Sport field".
 *
 * Base field-experience rate is a FLAT 1.5 for every graded tier (it adds to
 * the lifetime multiplier once per level passed). What changes per tier is the
 * COST of a level: 50 000 XP at the Sciences end down to 1 000 XP at the
 * Sport end, decaying exponentially across the graded band.
 *
 * Top-Tier Research (1–3), Betting (16) and Adult (17) are excluded — they get
 * their own progression later.
 */
export const FIELD_BASE_MULTIPLIER = 1.5;

const EXCLUDED_TIER_IDS = new Set([1, 2, 3, 16, 17]);

/** Graded tier ids, in the canonical list order (Sciences → Sports). */
const GRADED_TIER_IDS: number[] = TIERS.map((t) => t.id).filter((id) => !EXCLUDED_TIER_IDS.has(id));

export const XP_PER_LEVEL_TOP = 50_000;
export const XP_PER_LEVEL_FLOOR = 1_000;

export function isGradedTier(tierId: number): boolean {
  return !EXCLUDED_TIER_IDS.has(Math.floor(tierId || 0));
}

/**
 * XP required per Field-Experience level for a tier — exponential decay from
 * 50 000 (highest graded tier) to 1 000 (lowest graded tier).
 */
export function xpPerLevelForTier(tierId: number): number {
  const idx = GRADED_TIER_IDS.indexOf(Math.floor(tierId || 0));
  const n = GRADED_TIER_IDS.length;
  if (idx < 0 || n < 2) return XP_PER_LEVEL_TOP;
  const ratio = XP_PER_LEVEL_FLOOR / XP_PER_LEVEL_TOP;
  const raw = XP_PER_LEVEL_TOP * Math.pow(ratio, idx / (n - 1));
  // Round to a readable step (nearest 100, min floor).
  return Math.max(XP_PER_LEVEL_FLOOR, Math.round(raw / 100) * 100);
}

/** Kept for API stability — the field base rate is now flat across tiers. */
export function tierXpRate(_tierId?: number): number {
  return FIELD_BASE_MULTIPLIER;
}

/**
 * 1 validated second of research → 1 XP, scaled by the flat field base rate.
 * Level cost comes from the tier's own `xpPerLevelForTier`.
 */
export function tierLevelFromSeconds(seconds: number, tierId = 1): {
  level: number;
  xpInLevel: number;
  percent: number;
  rate: number;
  xpPerLevel: number;
} {
  const rate = FIELD_BASE_MULTIPLIER;
  const xpPerLevel = xpPerLevelForTier(tierId);
  const xp = Math.max(0, Math.floor(Math.max(0, seconds) * rate));
  const level = Math.floor(xp / xpPerLevel) + 1;
  const xpInLevel = xp % xpPerLevel;
  return { level, xpInLevel, percent: (xpInLevel / xpPerLevel) * 100, rate, xpPerLevel };
}

