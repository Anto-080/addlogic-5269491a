import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Globe, ExternalLink, ShieldCheck } from "lucide-react";
import { isNative, openInOperaWebView } from "@/lib/operaWebView";

type BrowserPickerProps = {
  onSearch?: (args: { url: string; engineName: string }) => void;
};

const OPERA_SEARCH = "https://www.opera.com/search?q={q}";

export function BrowserPicker({ onSearch }: BrowserPickerProps = {}) {
  const [query, setQuery] = useState("");

  const launch = async () => {
    const q = encodeURIComponent(query.trim());
    if (!q) return;
    const url = OPERA_SEARCH.replace("{q}", q);

    // On a real Android Capacitor build, hand off to Opera WebView immediately.
    if (isNative()) {
      const handed = await openInOperaWebView(url);
      if (handed) return;
    }

    // Web preview: render through hardened in-app iframe.
    if (onSearch) onSearch({ url, engineName: "Opera WebView" });
    else window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Card className="bg-card border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          Powered by Opera WebView
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          On Android, your search is routed through Opera's hardened WebView — multiple layers of anti-fraud, anti-tracking
          and malicious-redirect protection keep scammers from siphoning research funds. In the web preview the same
          query opens through an in-app sandboxed view.
        </p>

        <div className="flex items-center gap-2 p-3 rounded-lg border border-primary/30 bg-primary/5">
          <div className="h-9 w-9 rounded-md bg-primary/15 flex items-center justify-center text-primary font-bold">
            O
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground">Opera WebView</p>
            <p className="text-[10px] text-muted-foreground leading-tight inline-flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-primary" />
              Anti-tracker · anti-malware · crypto wallet aware
            </p>
          </div>
          <span className="text-[10px] uppercase tracking-wider text-primary font-medium">Default</span>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Search the web…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") launch(); }}
            className="bg-secondary/50"
          />
          <Button onClick={launch} className="gap-2 shrink-0">
            <ExternalLink className="h-4 w-4" />
            Open
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
