import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, UserCheck, ExternalLink, Check, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  buildAuthUrl,
  consumeRedirect,
  disconnect as disconnectProvider,
  hasProviderConfig,
  isConnected,
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

function FacebookGlyph({ size = 24 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden>
      <circle cx="16" cy="16" r="15" fill="#1877F2" />
      <path d="M19 11h-2c-.6 0-1 .4-1 1v2h3l-.5 3H16v8h-3v-8h-2v-3h2v-2.4C13 9.5 14.5 8 16.6 8H19v3z" fill="#fff" />
    </svg>
  );
}
function LinkedInGlyph({ size = 24 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden>
      <rect x="1" y="1" width="30" height="30" rx="4" fill="#0A66C2" />
      <circle cx="9" cy="10" r="2" fill="#fff" />
      <rect x="7.5" y="13" width="3" height="11" fill="#fff" />
      <path d="M13 13h3v1.6c.6-1 1.9-1.9 3.6-1.9 3 0 4.4 1.7 4.4 4.8V24h-3v-5.6c0-1.6-.6-2.6-2-2.6s-2.4 1-2.4 2.6V24h-3.6V13z" fill="#fff" />
    </svg>
  );
}

const BRAND: Record<SocialProvider, { color: string; label: string; cta: string; Glyph: (p: { size?: number }) => JSX.Element }> = {
  facebook: { color: "#1877F2", label: "Facebook", cta: "Connect with Meta", Glyph: FacebookGlyph },
  linkedin: { color: "#0A66C2", label: "LinkedIn", cta: "Sign in with LinkedIn", Glyph: LinkedInGlyph },
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
        description: `Set ${provider === "facebook" ? "VITE_FACEBOOK_APP_ID" : "VITE_LINKEDIN_CLIENT_ID"} in your environment to enable real OAuth.`,
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
      className="rounded-xl border bg-card transition-colors"
      style={{ borderColor: connection ? cfg.color : "hsl(var(--border) / 0.5)" }}
    >
      <div className="p-4 text-center space-y-2">
        <div className="flex justify-center"><cfg.Glyph size={36} /></div>
        <p className="text-sm font-semibold text-foreground">{cfg.label}</p>

        {connection ? (
          <>
            <span
              className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full"
              style={{ color: cfg.color, backgroundColor: `${cfg.color}1A` }}
            >
              <Check className="h-3 w-3" /> Connected
            </span>
            <p className="text-[10px] text-muted-foreground">
              since {new Date(connection.connectedAt).toLocaleDateString()}
            </p>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={handleDisconnect}>
              <X className="h-3 w-3 mr-1" /> Disconnect
            </Button>
          </>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              {provider === "facebook"
                ? "Find friends with similar research interests"
                : "Connect with professionals in your tier"}
            </p>
            <button
              onClick={handleConnect}
              className="inline-flex items-center gap-1 text-[11px] font-medium hover:underline"
              style={{ color: cfg.color }}
            >
              <ExternalLink className="h-3 w-3" /> {cfg.cta}
            </button>
            {!configured && (
              <p className="text-[10px] text-muted-foreground italic">
                Provider ID not set — click to see setup hint
              </p>
            )}
          </>
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
      toast({ title: `${BRAND[provider].label} connected`, description: "Authorization complete." });
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
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Connections</h1>
          <p className="text-sm text-muted-foreground">Connect with researchers who share your interests.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <ProviderCard provider="facebook" uid={uid} connection={fb} onChanged={refresh} />
          <ProviderCard provider="linkedin" uid={uid} connection={li} onChanged={refresh} />

          <div className="rounded-xl border border-border/50 bg-card">
            <div className="p-4 text-center space-y-2">
              <Mail className="h-9 w-9 text-money mx-auto" />
              <p className="text-sm font-semibold text-foreground">Share ID Card</p>
              <p className="text-xs text-muted-foreground">Exchange contact info with high-affinity matches</p>
            </div>
          </div>
        </div>

        <Card className="bg-card border-border/50">
          <CardHeader><CardTitle className="text-base">Suggested Connections</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {MOCK_CONNECTIONS.map((conn, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
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
      </div>
    </AppLayout>
  );
}
