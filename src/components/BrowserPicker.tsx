import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExternalLink, ShieldCheck, Lock } from "lucide-react";
import { isNative, openInOperaWebView } from "@/lib/operaWebView";
import { OperaLogo } from "@/components/icons/OperaLogo";
import { recordSearch } from "@/lib/userInterestProfiler";

type BrowserPickerProps = {
  onSearch?: (args: { url: string; engineName: string }) => void;
  userLevel?: number;
};

const OPERA_SEARCH = "https://www.opera.com/search?q={q}";
const SEARCH_GATE_LEVEL = 25;

export function BrowserPicker({ onSearch, userLevel = 0 }: BrowserPickerProps) {
  const [query, setQuery] = useState("");
  const gated = userLevel < SEARCH_GATE_LEVEL;

  const launch = async () => {
    const q = encodeURIComponent(query.trim());
    if (!q || gated) return;
    recordSearch(query.trim());
    const url = OPERA_SEARCH.replace("{q}", q);

    if (isNative()) {
      const handed = await openInOperaWebView(url);
      if (handed) return;
    }
    if (onSearch) onSearch({ url, engineName: "Opera WebView" });
    else window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Card className="bg-card border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <OperaLogo size={20} />
          Powered by Opera WebView
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          On Android, your search is routed through Opera's hardened WebView — multiple layers of anti-fraud, anti-tracking
          and malicious-redirect protection keep scammers from siphoning research funds. In the web preview the same
          query opens through an in-app sandboxed view.
        </p>

        <div className="flex items-center gap-2 p-3 rounded-lg border border-[#9A7246]/30 bg-[#9A7246]/5">
          <OperaLogo size={32} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground">Opera WebView</p>
            <p className="text-[10px] text-muted-foreground leading-tight inline-flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-money" />
              Anti-tracker · anti-malware · crypto wallet aware
            </p>
          </div>
          <span className="text-[10px] uppercase tracking-wider text-money font-medium">Default</span>
        </div>

        <div className="relative">
          <div className="flex gap-2">
            <Input
              placeholder={gated ? `Unlocks at Level ${SEARCH_GATE_LEVEL}` : "Search the web…"}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") launch(); }}
              disabled={gated}
              className="bg-secondary/50"
            />
            <Button onClick={launch} disabled={gated} className="gap-2 shrink-0 bg-money hover:bg-money/90 text-white">
              <ExternalLink className="h-4 w-4" />
              Open
            </Button>
          </div>
          {gated && (
            <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
              <Lock className="h-3 w-3" />
              In-app Opera search unlocks at <span className="text-money font-semibold">Level {SEARCH_GATE_LEVEL}</span> — keep researching to unlock.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
