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

/** XP per cosmetic level inside a tier ExperienceBar (1 000 points = 1 lvl). */
export const TIER_XP_PER_LEVEL = 1_000;

/**
 * 1 second of research → 1 XP (multiplied by tier multiplier elsewhere).
 * Returns `{ level, xpInLevel, percent }` from a raw seconds total.
 */
export function tierLevelFromSeconds(seconds: number): {
  level: number;
  xpInLevel: number;
  percent: number;
} {
  const xp = Math.max(0, Math.floor(seconds));
  const level = Math.floor(xp / TIER_XP_PER_LEVEL) + 1;
  const xpInLevel = xp % TIER_XP_PER_LEVEL;
  return { level, xpInLevel, percent: (xpInLevel / TIER_XP_PER_LEVEL) * 100 };
}
