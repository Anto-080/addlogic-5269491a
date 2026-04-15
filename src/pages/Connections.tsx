import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, Briefcase, Mail, UserCheck } from "lucide-react";

const MOCK_CONNECTIONS = [
  { name: "Dr. Sarah Chen", platform: "linkedin", interests: ["Biological Systems", "Biochem"], affinity: 92, avatar: "SC" },
  { name: "Marco Rossi", platform: "facebook", interests: ["Technology", "Finance"], affinity: 85, avatar: "MR" },
  { name: "Aisha Patel", platform: "linkedin", interests: ["Scientific Research", "Climate"], affinity: 88, avatar: "AP" },
  { name: "James Okafor", platform: "facebook", interests: ["Global News", "Economics"], affinity: 78, avatar: "JO" },
];

export default function Connections() {
  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Connections</h1>
          <p className="text-sm text-muted-foreground">Connect with researchers who share your interests.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: Facebook, label: "Facebook", desc: "Find friends with similar research interests" },
            { icon: Linkedin, label: "LinkedIn", desc: "Connect with professionals in your tier" },
            { icon: Mail, label: "Share ID Card", desc: "Exchange contact info with high-affinity matches" },
          ].map((item) => (
            <Card key={item.label} className="bg-card border-border/50 hover:border-primary/30 transition-colors cursor-pointer">
              <CardContent className="p-4 text-center space-y-2">
                <item.icon className="h-8 w-8 text-primary mx-auto" />
                <p className="text-sm font-semibold text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-card border-border/50">
          <CardHeader><CardTitle className="text-base">Suggested Connections</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {MOCK_CONNECTIONS.map((conn, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
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
                    <p className="text-sm font-bold text-gradient-gold">{conn.affinity}%</p>
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
