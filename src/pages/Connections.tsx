import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, UserCheck, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const MOCK_CONNECTIONS = [
  { name: "Dr. Sarah Chen", platform: "linkedin", interests: ["Biological Systems", "Biochem"], affinity: 92, avatar: "SC" },
  { name: "Marco Rossi", platform: "facebook", interests: ["Technology", "Finance"], affinity: 85, avatar: "MR" },
  { name: "Aisha Patel", platform: "linkedin", interests: ["Scientific Research", "Climate"], affinity: 88, avatar: "AP" },
  { name: "James Okafor", platform: "facebook", interests: ["Global News", "Economics"], affinity: 78, avatar: "JO" },
];

// Real OAuth handoff. Both providers use Lovable Cloud's OAuth proxy when
// configured; if the provider is not enabled in the project, the call
// surfaces a toast pointing to the connection setup.
async function startOAuth(provider: "facebook" | "linkedin_oidc") {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider as "facebook",
      options: { redirectTo: `${window.location.origin}/connections` },
    });
    if (error) throw error;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Connection failed";
    toast({
      title: provider === "facebook" ? "Facebook connect" : "LinkedIn connect",
      description: `${msg}. Provider must be enabled in backend settings.`,
    });
  }
}

// Brand-accurate inline glyphs (no third-party assets / no orange).
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

export default function Connections() {
  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Connections</h1>
          <p className="text-sm text-muted-foreground">Connect with researchers who share your interests.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => startOAuth("facebook")}
            className="text-left rounded-xl border border-border/50 bg-card hover:border-[#1877F2]/60 transition-colors"
          >
            <div className="p-4 text-center space-y-2">
              <FacebookGlyph size={36} />
              <p className="text-sm font-semibold text-foreground">Facebook</p>
              <p className="text-xs text-muted-foreground">Find friends with similar research interests</p>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium" style={{ color: "#1877F2" }}>
                <ExternalLink className="h-3 w-3" /> Connect with Meta
              </span>
            </div>
          </button>

          <button
            onClick={() => startOAuth("linkedin_oidc")}
            className="text-left rounded-xl border border-border/50 bg-card hover:border-[#0A66C2]/60 transition-colors"
          >
            <div className="p-4 text-center space-y-2">
              <LinkedInGlyph size={36} />
              <p className="text-sm font-semibold text-foreground">LinkedIn</p>
              <p className="text-xs text-muted-foreground">Connect with professionals in your tier</p>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium" style={{ color: "#0A66C2" }}>
                <ExternalLink className="h-3 w-3" /> Sign in with LinkedIn
              </span>
            </div>
          </button>

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
