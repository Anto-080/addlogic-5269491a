/**
 * Academic Connection — an almost invisible wooden collapsible strip that sits
 * between the silver-framed priority tiers and the rest of the tier list.
 *
 * Inside: a SAML / university SSO entry point. The university directory here is
 * a minimal seed list; it is designed to be swapped for a server-parsed
 * InCommon / eduGAIN metadata feed without touching this component's contract
 * (search → pick → redirect to the IdP).
 */
import { useMemo, useState } from "react";
import { ChevronDown, GraduationCap, Loader2, Search, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const IVY_GREEN = "#01563F";

/** Stylised ivy leaf-fan, traced from the Ivy League mark. */
function IvyLeaf({ className = "", flip = false }: { className?: string; flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      style={{ transform: flip ? "scaleX(-1)" : undefined }}
      aria-hidden="true"
      fill={IVY_GREEN}
    >
      {/* central tall leaf */}
      <path d="M33 4c4 6 6 13 6 20 0 8-2 15-6 24-4-9-6-16-6-24 0-7 2-14 6-20z" />
      {/* inner right leaf */}
      <path d="M41 12c5 4 8 10 9 17 1 7-1 14-5 22-2-9-4-16-6-23-1-6-1-11 2-16z" />
      {/* outer right leaf */}
      <path d="M53 26c4 3 7 7 9 12-6 5-13 8-21 10 4-8 8-15 12-22z" />
      {/* inner left leaf */}
      <path d="M25 12c-5 4-8 10-9 17-1 7 1 14 5 22 2-9 4-16 6-23 1-6 1-11-2-16z" />
      {/* outer left leaf */}
      <path d="M13 26c-4 3-7 7-9 12 6 5 13 8 21 10-4-8-8-15-12-22z" />
    </svg>
  );
}

type University = { name: string; domain: string; country: string };

/** Seed directory — replace with InCommon/eduGAIN metadata parsing server-side. */
const UNIVERSITIES: University[] = [
  { name: "Harvard University", domain: "harvard.edu", country: "US" },
  { name: "Yale University", domain: "yale.edu", country: "US" },
  { name: "Princeton University", domain: "princeton.edu", country: "US" },
  { name: "Columbia University", domain: "columbia.edu", country: "US" },
  { name: "Brown University", domain: "brown.edu", country: "US" },
  { name: "Cornell University", domain: "cornell.edu", country: "US" },
  { name: "Dartmouth College", domain: "dartmouth.edu", country: "US" },
  { name: "University of Pennsylvania", domain: "upenn.edu", country: "US" },
  { name: "Massachusetts Institute of Technology", domain: "mit.edu", country: "US" },
  { name: "Stanford University", domain: "stanford.edu", country: "US" },
  { name: "California Institute of Technology", domain: "caltech.edu", country: "US" },
  { name: "University of California, Berkeley", domain: "berkeley.edu", country: "US" },
  { name: "University of Chicago", domain: "uchicago.edu", country: "US" },
  { name: "Johns Hopkins University", domain: "jhu.edu", country: "US" },
  { name: "University of Michigan", domain: "umich.edu", country: "US" },
  { name: "University of Washington", domain: "uw.edu", country: "US" },
  { name: "University of Oxford", domain: "ox.ac.uk", country: "UK" },
  { name: "University of Cambridge", domain: "cam.ac.uk", country: "UK" },
  { name: "Imperial College London", domain: "imperial.ac.uk", country: "UK" },
  { name: "University College London", domain: "ucl.ac.uk", country: "UK" },
  { name: "University of Edinburgh", domain: "ed.ac.uk", country: "UK" },
  { name: "ETH Zürich", domain: "ethz.ch", country: "CH" },
  { name: "EPFL Lausanne", domain: "epfl.ch", country: "CH" },
  { name: "University of Zurich", domain: "uzh.ch", country: "CH" },
  { name: "Technical University of Munich", domain: "tum.de", country: "DE" },
  { name: "Heidelberg University", domain: "uni-heidelberg.de", country: "DE" },
  { name: "Sorbonne University", domain: "sorbonne-universite.fr", country: "FR" },
  { name: "Université PSL", domain: "psl.eu", country: "FR" },
  { name: "KU Leuven", domain: "kuleuven.be", country: "BE" },
  { name: "Delft University of Technology", domain: "tudelft.nl", country: "NL" },
  { name: "University of Amsterdam", domain: "uva.nl", country: "NL" },
  { name: "Karolinska Institutet", domain: "ki.se", country: "SE" },
  { name: "University of Copenhagen", domain: "ku.dk", country: "DK" },
  { name: "Sapienza University of Rome", domain: "uniroma1.it", country: "IT" },
  { name: "University of Bologna", domain: "unibo.it", country: "IT" },
  { name: "Politecnico di Milano", domain: "polimi.it", country: "IT" },
  { name: "University of Toronto", domain: "utoronto.ca", country: "CA" },
  { name: "McGill University", domain: "mcgill.ca", country: "CA" },
  { name: "University of Melbourne", domain: "unimelb.edu.au", country: "AU" },
  { name: "National University of Singapore", domain: "nus.edu.sg", country: "SG" },
  { name: "University of Tokyo", domain: "u-tokyo.ac.jp", country: "JP" },
];

export function AcademicConnection() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return UNIVERSITIES.filter(
      (u) => u.name.toLowerCase().includes(q) || u.domain.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [query]);

  const notFound = query.trim().length > 2 && matches.length === 0;

  const connect = async (uni: University) => {
    setError(null);
    setPending(uni.domain);
    try {
      const { data, error } = await supabase.auth.signInWithSSO({
        domain: uni.domain,
        options: { redirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.assign(data.url);
        return;
      }
      setError("No identity provider is registered for this university yet.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "SSO request failed.";
      setError(
        /provider|not found|no sso/i.test(msg)
          ? `${uni.name} is listed in the directory but its SAML identity provider is not federated with us yet.`
          : msg
      );
    } finally {
      setPending(null);
    }
  };

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        border: "1px solid rgba(94, 64, 38, 0.45)",
        background:
          "linear-gradient(180deg, rgba(120,84,50,0.16) 0%, rgba(78,52,30,0.20) 100%)",
        boxShadow: "inset 0 1px 0 rgba(196,158,112,0.18)",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full px-4 py-2.5 flex items-center justify-center gap-3"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0 2px, rgba(0,0,0,0.03) 2px 6px)",
        }}
      >
        <IvyLeaf className="h-5 w-5 shrink-0" />
        <span
          className="text-sm sm:text-base font-bold tracking-wide"
          style={{
            color: IVY_GREEN,
            fontFamily: "'Playfair Display', 'Times New Roman', Georgia, serif",
          }}
        >
          Academic Connection
        </span>
        <IvyLeaf className="h-5 w-5 shrink-0" flip />
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          style={{ color: IVY_GREEN }}
        />
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 space-y-3 border-t" style={{ borderColor: "rgba(94,64,38,0.35)" }}>
          <p className="text-xs text-muted-foreground">
            Sign in with your university account (SAML 2.0 single sign-on). We read your
            institutional email, name and <em>eduPersonAffiliation</em> to confirm active
            student or faculty enrolment — nothing else. InCommon and eduGAIN federations
            roll out progressively.
          </p>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setError(null);
              }}
              placeholder="Search your university…"
              aria-label="Search your university"
              className="w-full rounded-lg bg-background/70 border border-border/60 pl-9 pr-3 py-2 text-sm text-foreground outline-none focus:border-primary/60"
            />
          </div>

          {matches.length > 0 && (
            <ul className="space-y-1.5">
              {matches.map((u) => (
                <li key={u.domain}>
                  <button
                    type="button"
                    onClick={() => connect(u)}
                    disabled={pending !== null}
                    className="w-full flex items-center gap-3 rounded-lg border border-border/50 bg-card/70 px-3 py-2 text-left hover:border-primary/40 transition-colors disabled:opacity-60"
                  >
                    <span
                      className="h-7 w-7 shrink-0 rounded-md flex items-center justify-center"
                      style={{ backgroundColor: "rgba(1,86,63,0.12)" }}
                    >
                      {pending === u.domain ? (
                        <Loader2 className="h-4 w-4 animate-spin" style={{ color: IVY_GREEN }} />
                      ) : (
                        <GraduationCap className="h-4 w-4" style={{ color: IVY_GREEN }} />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-foreground truncate">{u.name}</span>
                      <span className="block text-[11px] text-muted-foreground">
                        {u.domain} · {u.country}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {notFound && (
            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary" />
              University not found in the federation directory yet. Ask your IT office to
              publish SAML metadata to InCommon or eduGAIN.
            </p>
          )}

          {error && (
            <p className="flex items-start gap-2 text-xs text-crimson">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
