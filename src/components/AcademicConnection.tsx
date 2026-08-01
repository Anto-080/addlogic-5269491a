/**
 * Academic Connection — a single light ash-brown rule that opens into an empty,
 * borderless panel (same footprint as the Biochemistry section above it).
 *
 * No pills, no cards: type rules and hairlines only. University records come
 * from the live InCommon + eduGAIN federation directory (academic-directory
 * edge function), with a small offline seed so the field is never dead.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ivyLeaf from "@/assets/ivy-leaf.png.asset.json";

const IVY_GREEN = "#01563F";
const ASH_BROWN = "#C2A487";

type Entity = {
  name: string;
  entityId: string;
  ssoUrl?: string | null;
  domains?: string[];
  federation?: string;
};

/** Offline fallback so search still resolves if the federation feeds are down. */
const SEED: Entity[] = [
  { name: "Stanford University", entityId: "https://idp.stanford.edu/", domains: ["stanford.edu"] },
  { name: "Harvard University", entityId: "https://fed.huit.harvard.edu/idp/shibboleth", domains: ["harvard.edu"] },
  { name: "Massachusetts Institute of Technology", entityId: "https://idp.mit.edu/shibboleth", domains: ["mit.edu"] },
  { name: "Yale University", entityId: "https://auth.yale.edu/idp/shibboleth", domains: ["yale.edu"] },
  { name: "Princeton University", entityId: "https://idp.princeton.edu/idp/shibboleth", domains: ["princeton.edu"] },
  { name: "University of Oxford", entityId: "https://registry.shibboleth.ox.ac.uk/idp", domains: ["ox.ac.uk"] },
  { name: "University of Cambridge", entityId: "https://shib.raven.cam.ac.uk/shibboleth", domains: ["cam.ac.uk"] },
  { name: "ETH Zürich", entityId: "https://aai-logon.ethz.ch/idp/shibboleth", domains: ["ethz.ch"] },
];

export function AcademicConnection() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Entity[]>([]);
  const [searching, setSearching] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [sources, setSources] = useState<string[]>([]);
  const reqRef = useRef(0);

  const seedMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return SEED.filter(
      (u) => u.name.toLowerCase().includes(q) || (u.domains ?? []).some((d) => d.includes(q)),
    );
  }, [query]);

  // Live federation lookup, debounced.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) {
      setResults([]);
      return;
    }
    const id = ++reqRef.current;
    setSearching(true);
    const t = window.setTimeout(async () => {
      try {
        const base = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/academic-directory`;
        const res = await fetch(`${base}?q=${encodeURIComponent(q)}`, {
          headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        });
        const json = await res.json();
        if (reqRef.current !== id) return;
        setSources(Array.isArray(json?.sources) ? json.sources : []);
        setResults(Array.isArray(json?.entities) ? json.entities : []);
      } catch {
        if (reqRef.current === id) setResults([]);
      } finally {
        if (reqRef.current === id) setSearching(false);
      }
    }, 350);
    return () => window.clearTimeout(t);
  }, [query]);

  const matches = useMemo(() => {
    const seen = new Set<string>();
    return [...results, ...seedMatches].filter((e) => {
      if (seen.has(e.entityId)) return false;
      seen.add(e.entityId);
      return true;
    }).slice(0, 8);
  }, [results, seedMatches]);

  const connect = async (uni: Entity) => {
    setNotice(null);
    setPending(uni.entityId);
    try {
      const domain = (uni.domains ?? [])[0];
      const { data, error } = await supabase.auth.signInWithSSO({
        ...(domain ? { domain } : { providerId: uni.entityId }),
        options: { redirectTo: `${window.location.origin}/dashboard` },
      } as never);
      if (!error && data?.url) {
        window.location.assign(data.url);
        return;
      }
      // Not federated with us yet — hand the user to the institution's own
      // identity provider so they can reach their research system directly.
      const target = uni.ssoUrl ?? (uni.entityId.startsWith("http") ? uni.entityId : null);
      if (target) {
        window.open(target, "_blank", "noopener,noreferrer");
        setNotice(`${uni.name} is not federated with us yet — opened its identity provider.`);
        return;
      }
      setNotice(`No reachable identity provider for ${uni.name}.`);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Single sign-on request failed.");
    } finally {
      setPending(null);
    }
  };

  return (
    <div>
      {/* the brown rule */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 py-2.5 group"
      >
        <span className="h-px flex-1" style={{ backgroundColor: `${ASH_BROWN}66` }} />
        <img
          src={ivyLeaf.url}
          alt=""
          aria-hidden="true"
          className="h-5 w-5 object-contain brand-asset"
          style={{ mixBlendMode: "screen" }}
        />
        <span
          className="text-sm sm:text-base tracking-wide whitespace-nowrap"
          style={{
            color: IVY_GREEN,
            fontFamily: "'Playfair Display', Georgia, serif",
            filter: "brightness(1.9)",
          }}
        >
          Academic Connection
        </span>
        <img
          src={ivyLeaf.url}
          alt=""
          aria-hidden="true"
          className="h-5 w-5 object-contain brand-asset"
          style={{ transform: "scaleX(-1)", mixBlendMode: "screen" }}
        />
        <span className="h-px flex-1" style={{ backgroundColor: `${ASH_BROWN}66` }} />
      </button>

      {open && (
        <div className="pb-4 pt-1 space-y-4">
          <p className="text-xs leading-relaxed" style={{ color: `${ASH_BROWN}` }}>
            Academies Research System — sign in through your institution (SAML 2.0). We read only
            your institutional email, name and <em>eduPersonAffiliation</em> to confirm active
            enrolment. Directory served live from
            {sources.length ? ` ${sources.join(" + ")}` : " InCommon + eduGAIN"}.
          </p>

          <div>
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setNotice(null);
              }}
              placeholder="Type your university…"
              aria-label="Search your university"
              className="w-full bg-transparent border-0 border-b py-2 text-sm text-foreground placeholder:opacity-50 outline-none focus:border-b-2"
              style={{ borderColor: `${ASH_BROWN}80`, color: "inherit" }}
            />
          </div>

          {searching && (
            <p className="flex items-center gap-2 text-[11px]" style={{ color: `${ASH_BROWN}` }}>
              <Loader2 className="h-3 w-3 animate-spin" /> searching federations…
            </p>
          )}

          {matches.length > 0 && (
            <ul>
              {matches.map((u) => (
                <li key={u.entityId} className="border-b last:border-0" style={{ borderColor: `${ASH_BROWN}33` }}>
                  <button
                    type="button"
                    onClick={() => connect(u)}
                    disabled={pending !== null}
                    className="w-full flex items-baseline justify-between gap-4 py-2 text-left transition-opacity hover:opacity-70 disabled:opacity-50"
                  >
                    <span className="text-sm text-foreground">{u.name}</span>
                    <span className="text-[11px] shrink-0" style={{ color: `${ASH_BROWN}` }}>
                      {pending === u.entityId ? "connecting…" : (u.domains ?? [])[0] ?? u.federation ?? "SAML"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {query.trim().length > 2 && !searching && matches.length === 0 && (
            <p className="text-[11px]" style={{ color: `${ASH_BROWN}` }}>
              Not published to InCommon or eduGAIN yet — ask your IT office to release its SAML
              metadata.
            </p>
          )}

          {notice && (
            <p className="text-[11px]" style={{ color: `${ASH_BROWN}` }}>
              {notice}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
