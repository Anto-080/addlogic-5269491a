import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Globe, ExternalLink } from "lucide-react";

type Browser = {
  id: string;
  name: string;
  emoji: string;
  // {q} placeholder for the URL-encoded query
  searchUrl: string;
  blurb: string;
};

const BROWSERS: Browser[] = [
  { id: "google",  name: "Google",  emoji: "🔎", searchUrl: "https://www.google.com/search?q={q}",                 blurb: "Largest index, fastest results" },
  { id: "ecosia",  name: "Ecosia",  emoji: "🌳", searchUrl: "https://www.ecosia.org/search?q={q}",                 blurb: "Plants trees with ad revenue" },
  { id: "brave",   name: "Brave",   emoji: "🦁", searchUrl: "https://search.brave.com/search?q={q}",               blurb: "Independent index, privacy-first" },
  { id: "opera",   name: "Opera",   emoji: "🅾️", searchUrl: "https://www.opera.com/search?q={q}",                  blurb: "Built-in VPN & crypto wallet" },
];

export function BrowserPicker() {
  const [selected, setSelected] = useState<string>("google");
  const [query, setQuery] = useState("");
  const [customUrl, setCustomUrl] = useState("");

  const launch = () => {
    const q = encodeURIComponent(query.trim());
    if (!q) return;
    if (selected === "custom") {
      const tmpl = customUrl.trim();
      if (!tmpl) return;
      const url = tmpl.includes("{q}") ? tmpl.replace("{q}", q) : `${tmpl}${tmpl.includes("?") ? "&" : "?"}q=${q}`;
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    const browser = BROWSERS.find((b) => b.id === selected);
    if (!browser) return;
    window.open(browser.searchUrl.replace("{q}", q), "_blank", "noopener,noreferrer");
  };

  return (
    <Card className="bg-card border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          External Browser Search
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Pick a search engine, type a query, and we'll open the results in a new tab. Earn full XP whether you stay in-app or roam the wider web.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {BROWSERS.map((b) => (
            <button
              key={b.id}
              onClick={() => setSelected(b.id)}
              className={`p-3 rounded-lg border text-left transition-colors ${
                selected === b.id
                  ? "border-primary bg-primary/10"
                  : "border-border/50 bg-secondary/30 hover:bg-secondary/50"
              }`}
            >
              <div className="text-xl mb-1">{b.emoji}</div>
              <p className="text-xs font-semibold text-foreground">{b.name}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{b.blurb}</p>
            </button>
          ))}
          <button
            onClick={() => setSelected("custom")}
            className={`p-3 rounded-lg border text-left transition-colors ${
              selected === "custom"
                ? "border-primary bg-primary/10"
                : "border-border/50 bg-secondary/30 hover:bg-secondary/50"
            }`}
          >
            <div className="text-xl mb-1">⚙️</div>
            <p className="text-xs font-semibold text-foreground">Custom</p>
            <p className="text-[10px] text-muted-foreground leading-tight">Your own search URL</p>
          </button>
        </div>

        {selected === "custom" && (
          <Input
            placeholder="https://example.com/search?q={q}"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            className="bg-secondary/50 text-xs"
          />
        )}

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
