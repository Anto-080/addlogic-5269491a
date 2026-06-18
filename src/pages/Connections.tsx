import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, UserCheck, ExternalLink, Check, X, Shield, Link2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  buildAuthUrl,
  consumeRedirect,
  disconnect as disconnectProvider,
  hasProviderConfig,
  readConnections,
  type SocialConnection,
  type SocialProvider,
} from "@/lib/socialOAuth";

const MOCK_CONNECTIONS = [
  { name: "Dr. Sarah Chen", platform: "linkedin", interests: ["Biological Systems", "Biochem"], affinity: 92, avatar: "SC" },
  { name: "Marco Rossi", platform: "facebook", interests: ["Technology", "Finance"], affinity: 85, avatar: "MR" },
  { name: "Aisha Patel", platform: "linkedin", interests: ["Scientific Research", "Climate"], affinity: 88, avatar: "AP" },
  { name: "James Okafor", platform: "facebook", interests: ["Global News", "Economics"], affinity: 78, avatar: "JO" },
];

function FacebookGlyph({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden>
      <circle cx="16" cy="16" r="15" fill="#1877F2" />
      <path d="M19 11h-2c-.6 0-1 .4-1 1v2h3l-.5 3H16v8h-3v-8h-2v-3h2v-2.4C13 9.5 14.5 8 16.6 8H19v3z" fill="#fff" />
    </svg>
  );
}
function LinkedInGlyph({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden>
      <rect x="1" y="1" width="30" height="30" rx="4" fill="#0A66C2" />
      <circle cx="9" cy="10" r="2" fill="#fff" />
      <rect x="7.5" y="13" width="3" height="11" fill="#fff" />
      <path d="M13 13h3v1.6c.6-1 1.9-1.9 3.6-1.9 3 0 4.4 1.7 4.4 4.8V24h-3v-5.6c0-1.6-.6-2.6-2-2.6s-2.4 1-2.4 2.6V24h-3.6V13z" fill="#fff" />
    </svg>
  );
}

const BRAND: Record<SocialProvider, {
  color: string;
  label: string;
  cta: string;
  subtext: string;
  connectedSubtext: string;
  Glyph: (p: { size?: number }) => JSX.Element;
  bgClass: string;
  borderClass: string;
}> = {
  facebook: {
    color: "#1877F2",
    label: "Facebook",
    cta: "Link Facebook Account",
    subtext: "Find friends & share research interests with your Facebook network",
    connectedSubtext: "Your Facebook account is linked. Discover connections from your network.",
    Glyph: FacebookGlyph,
    bgClass: "bg-[#1877F2]/5",
    borderClass: "border-[#1877F2]/20",
  },
  linkedin: {
    color: "#0A66C2",
    label: "LinkedIn",
    cta: "Link LinkedIn Account",
    subtext: "Connect with professionals & researchers in your tier network",
    connectedSubtext: "Your LinkedIn account is linked. Expand your professional research circle.",
    Glyph: LinkedInGlyph,
    bgClass: "bg-[#0A66C2]/5",
    borderClass: "border-[#0A66C2]/20",
  },
};

function ProviderCard({
  provider,
  uid,
  connection,
  onChanged,
}: {
  provider: SocialProvider;
  uid: string;
  connection: SocialConnection | null;
  onChanged: () => void;
}) {
  const cfg = BRAND[provider];
  const configured = hasProviderConfig(provider);

  const handleConnect = () => {
    const url = buildAuthUrl(provider);
    if (!url) {
      toast({
        title: `${cfg.label} not configured`,
        description: `Add VITE_${provider === "facebook" ? "FACEBOOK_APP_ID" : "LINKEDIN_CLIENT_ID"} to your environment to enable real OAuth.`,
      });
      return;
    }
    window.location.href = url;
  };

  const handleDisconnect = () => {
    disconnectProvider(uid, provider);
    onChanged();
    toast({ title: `${cfg.label} disconnected` });
  };

  return (
    <div
      className={`rounded-xl border-2 transition-all duration-300 ${cfg.borderClass} ${
        connection ? "bg-card" : cfg.bgClass
      } hover:shadow-lg hover:-translate-y-0.5`}
    >
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div
            className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: connection ? `${cfg.color}15` : `${cfg.color}10` }}
          >
            <cfg.Glyph size={32} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-semibold text-foreground">{cfg.label}</h3>
              {connection && (
                <span
                  className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ color: cfg.color, backgroundColor: `${cfg.color}18` }}
                >
                  <Check className="h-3 w-3" /> Linked
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              {connection ? cfg.connectedSubtext : cfg.subtext}
            </p>

            <div className="mt-4">
              {connection ? (
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs text-muted-foreground">
                    Linked on {new Date(connection.connectedAt).toLocaleDateString()}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={handleDisconnect}
                  >
                    <X className="h-3.5 w-3.5 mr-1" /> Unlink
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={handleConnect}
                  className="h-9 text-sm font-medium gap-2"
                  style={{
                    backgroundColor: cfg.color,
                    color: "#fff",
                  }}
                >
                  <Link2 className="h-4 w-4" />
                  {cfg.cta}
                </Button>
              )}
            </div>
          </div>
        </div>

        {!configured && !connection && (
          <div className="mt-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
            <p className="text-xs text-amber-400/90">
              <Shield className="h-3 w-3 inline mr-1" />
              Provider not configured. Add your {cfg.label} client ID in settings to enable linking.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Connections() {
  const { user } = useAuth();
  const uid = user?.id ?? "guest";
  const [connections, setConnections] = useState<SocialConnection[]>(() => readConnections(uid));

  const refresh = () => setConnections(readConnections(uid));

  useEffect(() => { refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [uid]);

  useEffect(() => {
    const provider = consumeRedirect(uid);
    if (provider) {
      refresh();
      toast({ title: `${BRAND[provider].label} linked`, description: "Your social account has been connected." });
    }
    const onChange = () => refresh();
    window.addEventListener("social-connections-changed", onChange);
    return () => window.removeEventListener("social-connections-changed", onChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const fb = connections.find((c) => c.provider === "facebook") ?? null;
  const li = connections.find((c) => c.provider === "linkedin") ?? null;

  return (
    <AppLayout>
      <div className="space-y-8 max-w-5xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Connections</h1>
          <p className="text-sm text-muted-foreground mt-1">Link your social accounts to discover researchers who share your interests.</p>
        </div>

        {/* Link Accounts Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-money" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Link Your Accounts</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ProviderCard provider="facebook" uid={uid} connection={fb} onChanged={refresh} />
            <ProviderCard provider="linkedin" uid={uid} connection={li} onChanged={refresh} />
          </div>
        </section>

        {/* Share ID Card */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-money" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Share</h2>
          </div>

          <Card className="bg-card border-border/50 hover:border-border transition-colors">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-money/10 flex items-center justify-center">
                <Mail className="h-6 w-6 text-money" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-foreground">Share ID Card</h3>
                <p className="text-sm text-muted-foreground">Exchange contact info with high-affinity matches</p>
              </div>
              <Button variant="outline" size="sm" className="h-9">
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Share
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Suggested Connections */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-money" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Suggested Connections</h2>
          </div>

          <Card className="bg-card border-border/50">
            <CardContent className="p-4 space-y-2">
              {MOCK_CONNECTIONS.map((conn, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: conn.platform === "facebook" ? "#1877F2" : "#0A66C2" }}
                    >
                      {conn.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{conn.name}</p>
                      <div className="flex gap-1 flex-wrap">
                        {conn.interests.map((int) => (
                          <span key={int} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{int}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-bold text-money">{conn.affinity}%</p>
                      <p className="text-[10px] text-muted-foreground">affinity</p>
                    </div>
                    <Button size="sm" variant="secondary"><UserCheck className="h-3 w-3" /></Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    </AppLayout>
  );
}
