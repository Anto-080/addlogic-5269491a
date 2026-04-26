import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, Cookie, ShieldCheck, AlertTriangle, Hand } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { AdBanner } from "@/components/AdBanner";
import { isNative, openInOperaWebView } from "@/lib/operaWebView";

type Props = {
  url: string;
  fallbackUrl: string;
  engineName: string;
  primaryTierId: number;
  onClose: () => void;
};

export function InAppBrowser({ url, fallbackUrl, engineName, primaryTierId, onClose }: Props) {
  const { cookieAutoAccept } = useSettings();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [topAdOpened, setTopAdOpened] = useState(false);
  const [bottomAdOpened, setBottomAdOpened] = useState(false);
  const [touches, setTouches] = useState(0);

  // If iframe doesn't fire load within 4s, assume X-Frame-Options blocked it.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!loaded) setBlocked(true);
    }, 8000);
    return () => clearTimeout(timer);
  }, [loaded]);

  // Track screen interactions to deter bots from collecting passive revenue.
  useEffect(() => {
    const onTouch = () => setTouches((t) => t + 1);
    window.addEventListener("touchstart", onTouch, { passive: true });
    window.addEventListener("wheel", onTouch, { passive: true });
    window.addEventListener("mousedown", onTouch);
    return () => {
      window.removeEventListener("touchstart", onTouch);
      window.removeEventListener("wheel", onTouch);
      window.removeEventListener("mousedown", onTouch);
    };
  }, []);

  // On native Android: hand off to Opera WebView and close this overlay.
  useEffect(() => {
    if (!isNative()) return;
    let cancelled = false;
    (async () => {
      const handed = await openInOperaWebView(url);
      if (handed && !cancelled) onClose();
    })();
    return () => { cancelled = true; };
  }, [url, onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header strip */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border bg-card">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs text-primary shrink-0 font-semibold">Opera WebView</span>
          <span className="text-xs text-foreground/70 truncate font-mono">{url}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {cookieAutoAccept ? (
            <span className="text-[10px] flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/15 text-primary">
              <Cookie className="h-3 w-3" /> Cookies auto-accepted
            </span>
          ) : (
            <span className="text-[10px] flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
              <ShieldCheck className="h-3 w-3" /> Cookies prompt
            </span>
          )}
          <Button size="sm" variant="ghost" onClick={onClose}>Close</Button>
        </div>
      </div>

      {/* Top ad */}
      <div className="px-3 pt-3">
        <AdBanner
          position="top"
          tierId={primaryTierId}
          required={blocked}
          opened={topAdOpened}
          onOpen={() => setTopAdOpened(true)}
        />
      </div>

      {/* Body */}
      <div className="flex-1 px-3 py-3 min-h-0">
        {!blocked ? (
          <iframe
            ref={iframeRef}
            src={url}
            onLoad={() => setLoaded(true)}
            className="w-full h-full rounded-lg border border-border bg-white"
            sandbox="allow-scripts allow-forms allow-popups"
            title="In-app search"
          />
        ) : (
          <div className="h-full w-full rounded-lg border border-dashed border-border/60 bg-card flex items-center justify-center p-4">
            <div className="max-w-md text-center space-y-3">
              <AlertTriangle className="h-8 w-8 text-primary mx-auto" />
              <p className="text-sm font-semibold text-foreground">
                {engineName} blocks in-app embedding
              </p>
              <p className="text-xs text-muted-foreground">
                Many search engines (Google, etc.) refuse iframe loading. Open the highest-paying ads above &amp; below first
                — they pay your retribution. Then continue your research in your favorite external browser.
              </p>
              <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1">
                <Hand className="h-3 w-3" /> Interaction count: {touches} (bots can't fake taps & scrolls)
              </p>
              <Button
                onClick={() => window.open(fallbackUrl, "_blank", "noopener,noreferrer")}
                disabled={!topAdOpened || !bottomAdOpened}
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                {topAdOpened && bottomAdOpened ? "Continue in external browser" : "Open both ads first"}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom ad */}
      <div className="px-3 pb-3">
        <AdBanner
          position="bottom"
          tierId={primaryTierId}
          required={blocked}
          opened={bottomAdOpened}
          onOpen={() => setBottomAdOpened(true)}
        />
      </div>
    </div>
  );
}
