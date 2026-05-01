import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { AppLayout } from "@/components/AppLayout";
import { TIERS } from "@/lib/mockData";
import { useEffect, useState } from "react";
import { Star, ShieldAlert, Newspaper, Tag, ChevronDown, ChevronUp, ExternalLink, Cookie, MapPin, Info } from "lucide-react";
import { ShieldStar } from "@/components/icons/ShieldStar";
import { HexDollar } from "@/components/icons/HexDollar";
import { SandglassIcon } from "@/components/icons/SandglassIcon";
import { ClockIcon } from "@/components/icons/ClockIcon";
import { useSettings, COOKIE_BONUS, GPS_BONUS } from "@/contexts/SettingsContext";
import { TierIcon } from "@/components/TierIcon";
import { ExperienceBar } from "@/components/ExperienceBar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useArticles, useMilestones, useUserStats } from "@/hooks/useAppData";
import { readGeolocationPermission, type GeolocationPermissionState } from "@/lib/webGeolocation";
import { AdBlockConsentSlide, adBlockSlideAlreadySatisfied } from "@/components/AdBlockConsentSlide";
import { GeoConsentSlide } from "@/components/GeoConsentSlide";

function AnimatedCounter({ target }: { target: number }) {
  return <span>${target.toFixed(2)}</span>;
}

export default function Dashboard() {
  const { cookieAutoAccept, gpsPrecision, setCookieAutoAccept, setGpsPrecision } = useSettings();
  const [couponsOpen, setCouponsOpen] = useState(false);
  const [permission, setPermission] = useState<GeolocationPermissionState>("prompt");
  const [adBlockSlideOpen, setAdBlockSlideOpen] = useState(false);
  const [geoSlideOpen, setGeoSlideOpen] = useState(false);
  const primaryTier = TIERS[3];

  const { data: stats } = useUserStats();
  const { data: dailyDesk = [] } = useArticles({ dailyDesk: true });
  const { data: milestones = [] } = useMilestones(5);

  useEffect(() => {
    let cancelled = false;
    readGeolocationPermission().then((s) => { if (!cancelled) setPermission(s); });
    return () => { cancelled = true; };
  }, []);

  const handleCookieToggle = (v: boolean) => {
    setCookieAutoAccept(v);
    if (v && !adBlockSlideAlreadySatisfied()) {
      setAdBlockSlideOpen(true);
    }
  };

  const handleGpsToggle = (v: boolean) => {
    if (!v) {
      setGpsPrecision(false);
      return;
    }
    // Open the consent slide; it stays until coords are obtained.
    setGeoSlideOpen(true);
  };

  const summary = [
    { label: "Today",     value: stats?.earnings_today ?? 0,    Icon: SandglassIcon },
    { label: "This Week", value: stats?.earnings_week ?? 0,     Icon: ClockIcon },
    { label: "All Time",  value: stats?.earnings_all_time ?? 0, Icon: HexDollar },
  ];

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground">AddLogic Dashboard</h1>
          <p className="text-sm text-muted-foreground">Your research hub — keep exploring, keep earning.</p>
        </div>

        {/* Data permissions — single compact card. Powers the entire earning engine. */}
        <Card className="bg-card border-border/50 glow-amber">
          <CardContent className="p-4 space-y-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Data permissions</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                These two consents are what the rewards engine runs on. Toggle them off any time.
              </p>
            </div>

            {/* Cookie row */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <Cookie
                  className={`h-7 w-7 mt-0.5 shrink-0 transition-opacity ${cookieAutoAccept ? "opacity-100" : "opacity-50"}`}
                  style={{ color: "hsl(var(--cookie-chip))" }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">Cookie auto-accept &amp; profile sync</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Reads first-party cookies on this device to map dominant interests and auto-accepts cookie banners while you browse in-app.
                  </p>
                  <p className="text-[11px] mt-1 font-semibold text-crimson">
                    Multiplier x{COOKIE_BONUS} {cookieAutoAccept ? "· active" : "· inactive"}
                  </p>
                </div>
              </div>
              <Switch checked={cookieAutoAccept} onCheckedChange={handleCookieToggle} data-emerald="true" />
            </div>

            <div className="border-t border-border/40" />

            {/* GPS row */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <MapPin
                  className={`h-7 w-7 mt-0.5 shrink-0 transition-opacity ${gpsPrecision ? "opacity-100" : "opacity-50"}`}
                  style={{ color: gpsPrecision ? "#9A7246" : "hsl(var(--muted-foreground))" }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">Location &amp; non-PII device profile</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Coarse location plus anonymous signals (timezone, locale, screen, hardware tier, network type) used to surface higher-paying regional ads and coupons. No contacts, no IMEI, no browsing history.
                  </p>
                  <p className="text-[11px] mt-1 font-semibold text-crimson">
                    Multiplier x{GPS_BONUS} {gpsPrecision ? "· active" : "· inactive"}
                  </p>
                  {permission === "denied" && (
                    <p className="text-[11px] mt-2 flex items-start gap-1 text-destructive">
                      <Info className="h-3 w-3 mt-0.5 shrink-0" />
                      <span>
                        Your browser is blocking location for this site. Tap the lock/info icon next to the address bar → Site settings → Location → Allow, then toggle this back on.
                      </span>
                    </p>
                  )}
                </div>
              </div>
              <Switch
                checked={gpsPrecision}
                onCheckedChange={handleGpsToggle}
                data-emerald="true"
              />
            </div>

            {/* Coupons appear right under the GPS row when location is on */}
            {gpsPrecision && (
              <div className="border-t border-border/40 pt-3">
                <Collapsible open={couponsOpen} onOpenChange={setCouponsOpen}>
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="w-full flex items-center justify-between gap-2 text-left"
                      aria-expanded={couponsOpen}
                    >
                      <span className="text-sm font-semibold flex items-center gap-2 text-foreground">
                        <Tag className="h-4 w-4 text-money" /> Regional coupons
                        <span className="text-[10px] text-muted-foreground font-normal ml-1">
                          live feed · tap to {couponsOpen ? "hide" : "open"}
                        </span>
                      </span>
                      {couponsOpen
                        ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        { brand: "GreenLeaf Café", offer: "20% off espresso", dist: "0.4 km" },
                        { brand: "MetroBooks", offer: "Buy 2 get 1 free — science", dist: "1.1 km" },
                        { brand: "EcoMart", offer: "$5 off bulk produce", dist: "2.0 km" },
                        { brand: "FitLab Gym", offer: "First week free trial", dist: "2.6 km" },
                      ].map((c) => (
                        <div key={c.brand} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                          <div>
                            <p className="text-sm font-medium text-foreground">{c.brand}</p>
                            <p className="text-xs text-muted-foreground">{c.offer}</p>
                          </div>
                          <span className="text-[10px] text-money font-medium">{c.dist}</span>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Earnings Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {summary.map((item) => (
            <Card key={item.label} className="bg-card border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="text-2xl font-bold text-money">
                      <AnimatedCounter target={item.value} />
                    </p>
                  </div>
                  <item.Icon size={32} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Shared Experience Bar — base multiplier comes from the user's saved stats. */}
        <Card className="bg-card border-border/50 glow-amber">
          <CardContent className="p-4 space-y-2">
            <ExperienceBar baseMultiplier={1} />
            <p className="text-xs text-muted-foreground">
              XP grows by <span className="text-foreground/90 font-medium">time × active multiplier</span> while you research. The black
              marker shows the <span className="text-foreground/90 font-medium">x10 cap</span> — when boosters push the
              multiplier above 10×, the marker slides left and the crimson fill extends past it.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div style={{ color: primaryTier.color }}><TierIcon tierId={primaryTier.id} size={32} /></div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Primary Research Tier</p>
              <p className="text-sm font-semibold text-foreground">{primaryTier.name}</p>
              <p className="text-xs text-foreground/70">x{primaryTier.multiplier} earning multiplier</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Newspaper className="h-5 w-5 text-money" />
              Information Desk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Curated articles. Topics involving dual-use technologies (CRISPR-Cas9, molecular chirality, receptor chimerism) are marked with safety advisories from accredited sources. AddLogic does not sponsor speculative dual-use research.
            </p>

            {/* Recommended reading on dual-use technology — fixed references */}
            <div className="space-y-2 mb-4">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                Recommended reading on dual-use technology
              </p>
              <a
                href="https://dualuse.mit.edu/defining-dual-use/"
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 rounded-lg border border-gold/40 bg-gold/5 hover:bg-gold/10 transition-colors"
              >
                <div className="flex items-start gap-2">
                  <ShieldStar className="h-4 w-4 text-gold mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground flex items-center gap-1">
                      Defining Dual Use — MIT
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      MIT's working framework for distinguishing legitimate research from technology that can be
                      weaponized. Reflects the operating consensus between academic biosecurity and DoD-acquainted
                      reviewers on what counts as "dual use" and how institutions should triage it.
                    </p>
                  </div>
                </div>
              </a>
              <a
                href="https://www.technologyreview.com/2016/02/09/71575/top-us-intelligence-official-calls-gene-editing-a-wmd-threat/"
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 rounded-lg border border-gold/40 bg-gold/5 hover:bg-gold/10 transition-colors"
              >
                <div className="flex items-start gap-2">
                  <ShieldStar className="h-4 w-4 text-gold mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground flex items-center gap-1">
                      Gene editing flagged as a WMD threat — MIT Technology Review
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      James Clapper's Worldwide Threat Assessment placed CRISPR-class genome editing on the ODNI's
                      WMD/proliferation list. Essential context for why AddLogic flags DNA-modification research with
                      safety advisories.
                    </p>
                  </div>
                </div>
              </a>
            </div>
            <div className="space-y-2">
              {dailyDesk.length === 0 && (
                <p className="text-xs text-muted-foreground italic">Loading today's desk…</p>
              )}
              {dailyDesk.map((item) => {
                const tier = TIERS.find((t) => t.id === item.tier_id);
                const Inner = (
                  <div className="flex items-start gap-3">
                    <span className="shrink-0" style={{ color: tier?.color }}>{tier && <TierIcon tierId={tier.id} size={20} />}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground hover:underline">{item.title}</p>
                      <p className="text-[11px] text-muted-foreground">{item.source}{item.read_time ? ` · ${item.read_time}` : ""}</p>
                      {item.dual_use_warning && item.warning_text && (
                        <div className="mt-2 flex items-start gap-2 p-2 rounded-md border border-destructive/40 bg-destructive/10">
                          <ShieldAlert className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
                          <p className="text-[11px] text-destructive-foreground/90">{item.warning_text}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
                return (
                  <div key={item.id} className="p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                    {item.url ? (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="block">
                        {Inner}
                      </a>
                    ) : Inner}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-5 w-5 text-gold" />
              Top Milestones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {milestones.length === 0 && (
                <p className="text-xs text-muted-foreground italic">No milestones yet — start a research session to log your first.</p>
              )}
              {milestones.map((m) => {
                const tier = TIERS.find((t) => t.id === m.tier_id);
                return (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span style={{ color: tier?.color }}>{tier && <TierIcon tierId={tier.id} size={22} />}</span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{m.title}</p>
                        <p className="text-xs text-muted-foreground">{new Date(m.occurred_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-money">${m.earned.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">+{m.xp_gained} XP</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <AdBlockConsentSlide
        open={adBlockSlideOpen}
        onSatisfied={() => setAdBlockSlideOpen(false)}
      />
      <GeoConsentSlide
        open={geoSlideOpen}
        onSatisfied={() => { setGpsPrecision(true); setGeoSlideOpen(false); }}
        onCancel={() => { setGpsPrecision(false); setGeoSlideOpen(false); }}
      />
    </AppLayout>
  );
}
