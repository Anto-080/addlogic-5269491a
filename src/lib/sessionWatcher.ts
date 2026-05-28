/**
 * Approved-session cache for the post-entry VPN watcher.
 *
 * Once a user passes the entrance check, we remember the pair
 *   { visitorId, ip }
 * in sessionStorage. While the user is browsing we periodically check
 * the current IP (cheap) and compare:
 *
 *   IP same                          → do nothing
 *   IP changed, visitorId unchanged  → silently refresh cached IP
 *   IP + visitorId both changed      → escalate to a full Fingerprint re-check
 *
 * This avoids hammering Fingerprint for mobile users whose IP rotates,
 * while still catching a real VPN/proxy hop (which changes the device
 * signature as well).
 *
 * This cache is NEVER used to bypass blocks — only to skip redundant
 * Fingerprint calls. The block decision always belongs to vpnDetection.ts.
 */

import { fetchIpInfo } from "@/lib/vpnDetection";
import { getVisitorId } from "@/lib/fingerprint";

type ApprovedSession = { visitorId: string | null; ip: string | null; at: number };

const KEY_PREFIX = "addlogic.session.approved.";

function key(userId: string | null) {
  return `${KEY_PREFIX}${userId ?? "anon"}`;
}

export function getApprovedSession(userId: string | null): ApprovedSession | null {
  try {
    const raw = sessionStorage.getItem(key(userId));
    if (!raw) return null;
    return JSON.parse(raw) as ApprovedSession;
  } catch {
    return null;
  }
}

export function setApprovedSession(
  userId: string | null,
  v: { visitorId: string | null; ip: string | null },
) {
  try {
    sessionStorage.setItem(
      key(userId),
      JSON.stringify({ visitorId: v.visitorId, ip: v.ip, at: Date.now() }),
    );
  } catch {
    /* ignore */
  }
}

export function clearApprovedSession(userId: string | null) {
  try {
    sessionStorage.removeItem(key(userId));
  } catch {
    /* ignore */
  }
}

export type DriftResult =
  | "same"
  | "ip-changed"
  | "device-changed"
  | "both-changed"
  | "no-session";

/**
 * Lightweight drift check. Uses the IP-info lookup (Cloudflare metadata)
 * and the cached Fingerprint visitorId — does NOT request a fresh
 * Fingerprint event. The caller escalates to a fresh event only when this
 * returns `device-changed` or `both-changed`.
 */
export async function checkSessionDrift(userId: string | null): Promise<DriftResult> {
  const cached = getApprovedSession(userId);
  if (!cached) return "no-session";

  const [info, visitorId] = await Promise.all([fetchIpInfo(), getVisitorId()]);
  const currentIp = info?.ip ?? null;

  const ipChanged = !!cached.ip && !!currentIp && cached.ip !== currentIp;
  const deviceChanged =
    !!cached.visitorId && !!visitorId && cached.visitorId !== visitorId;

  if (!ipChanged && !deviceChanged) return "same";
  if (ipChanged && deviceChanged) return "both-changed";
  if (deviceChanged) return "device-changed";

  // IP-only change: silently update the cached IP and stay allowed.
  setApprovedSession(userId, { visitorId: cached.visitorId, ip: currentIp });
  return "ip-changed";
}
