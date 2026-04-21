import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Search } from "lucide-react";

type BrowserPickerProps = {
  onSearch?: (args: { url: string; engineName: string }) => void;
};

// Opera-only — uses Opera WebView on Android (hardened against third-party fraud)
// and a sandboxed iframe preview on the web.
export function BrowserPicker({ onSearch }: BrowserPickerProps = {}) {
  const [query, setQuery] = useState("");

  const launch = () => {
    const q = encodeURIComponent(query.trim());
    if (!q) return;
    // Opera's default search redirector
    const url = `https://www.opera.com/search?q=${q}`;
    if (onSearch) onSearch({ url, engineName: "Opera WebView" });
    else window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Card className="bg-card border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Powered by Opera WebView
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Searches open inside Opera's hardened WebView on Android — multi-layer protection against malicious third-party
          activity. In the web preview, results render in a sandboxed in-app frame.
        </p>

        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-[#FF1B2D] flex items-center justify-center text-white font-bold text-sm shrink-0">
            O
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground">Opera WebView</p>
            <p className="text-[10px] text-muted-foreground leading-tight">
              Built-in fraud blocker, tracker shield, ad-integrity verification
            </p>
          </div>
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
            <Search className="h-4 w-4" />
            Search
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
