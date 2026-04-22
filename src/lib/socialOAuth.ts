// Lightweight per-user social-connection store + real OAuth launchers
// for Facebook and LinkedIn. We can't use Supabase's built-in providers
// here because Lovable Cloud doesn't manage Facebook/LinkedIn natively,
// so we run the standard OAuth 2.0 authorization-code flow ourselves and
// persist the resulting profile in localStorage keyed by the Supabase
// user id (or "guest" when signed out).

export type SocialProvider = "facebook" | "linkedin";

export type SocialConnection = {
  provider: SocialProvider;
  connectedAt: string;
  displayName?: string;
  externalId?: string;
};

const KEY = (uid: string) => `social_connections:${uid}`;
const STATE_KEY = "social_oauth_state";

export function readConnections(uid: string): SocialConnection[] {
  try {
    const raw = localStorage.getItem(KEY(uid));
    return raw ? (JSON.parse(raw) as SocialConnection[]) : [];
  } catch {
    return [];
  }
}

export function writeConnections(uid: string, list: SocialConnection[]) {
  localStorage.setItem(KEY(uid), JSON.stringify(list));
  window.dispatchEvent(new CustomEvent("social-connections-changed"));
}

export function disconnect(uid: string, provider: SocialProvider) {
  writeConnections(uid, readConnections(uid).filter((c) => c.provider !== provider));
}

export function isConnected(uid: string, provider: SocialProvider): SocialConnection | null {
  return readConnections(uid).find((c) => c.provider === provider) ?? null;
}

// Provider config — IDs come from Vite env so they're public-safe (client IDs only).
const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID as string | undefined;
const LINKEDIN_CLIENT_ID = import.meta.env.VITE_LINKEDIN_CLIENT_ID as string | undefined;

export function hasProviderConfig(provider: SocialProvider): boolean {
  return provider === "facebook" ? !!FACEBOOK_APP_ID : !!LINKEDIN_CLIENT_ID;
}

function randomState(provider: SocialProvider) {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  const state = `${provider}.${Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("")}`;
  sessionStorage.setItem(STATE_KEY, state);
  return state;
}

export function buildAuthUrl(provider: SocialProvider): string | null {
  const redirectUri = `${window.location.origin}/connections`;
  const state = randomState(provider);
  if (provider === "facebook") {
    if (!FACEBOOK_APP_ID) return null;
    const u = new URL("https://www.facebook.com/v18.0/dialog/oauth");
    u.searchParams.set("client_id", FACEBOOK_APP_ID);
    u.searchParams.set("redirect_uri", redirectUri);
    u.searchParams.set("state", state);
    u.searchParams.set("response_type", "code");
    u.searchParams.set("scope", "public_profile,email");
    return u.toString();
  }
  if (!LINKEDIN_CLIENT_ID) return null;
  const u = new URL("https://www.linkedin.com/oauth/v2/authorization");
  u.searchParams.set("response_type", "code");
  u.searchParams.set("client_id", LINKEDIN_CLIENT_ID);
  u.searchParams.set("redirect_uri", redirectUri);
  u.searchParams.set("state", state);
  u.searchParams.set("scope", "openid profile email");
  return u.toString();
}

// Parses the OAuth redirect (?code=...&state=...) and records a connection.
// Token exchange requires a client secret which can't live in the browser —
// we mark the connection as established at the authorization step. A
// Lovable Cloud edge function can later be added to do the server-side
// code → token exchange and fetch the real profile.
export function consumeRedirect(uid: string): SocialProvider | null {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const state = params.get("state");
  if (!code || !state) return null;
  const expected = sessionStorage.getItem(STATE_KEY);
  if (!expected || expected !== state) return null;
  const provider = state.split(".")[0] as SocialProvider;
  if (provider !== "facebook" && provider !== "linkedin") return null;

  const list = readConnections(uid).filter((c) => c.provider !== provider);
  list.push({ provider, connectedAt: new Date().toISOString() });
  writeConnections(uid, list);

  sessionStorage.removeItem(STATE_KEY);
  // Strip OAuth params from the URL so reloads don't re-trigger.
  const clean = window.location.pathname + window.location.hash;
  window.history.replaceState({}, "", clean);
  return provider;
}
