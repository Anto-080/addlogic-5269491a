import { ShieldOff, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdBlockDetector } from "@/hooks/useAdBlockDetector";
import { useEffect } from "react";

type Props = {
  open: boolean;
  onSatisfied: () => void;
};

const DISMISS_KEY = "rr.adblockSlide.satisfied";

/**
 * Full-screen mandatory slide shown after the user enables Cookie auto-accept
 * if an ad-blocker is detected. Cannot be dismissed until the blocker is OFF.
 * Polls every 3s so it auto-closes when the user whitelists the site.
 */
export function AdBlockConsentSlide({ open, onSatisfied }: Props) {
  const blocked = useAdBlockDetector(open ? 3000 : 0);

  useEffect(() => {
    if (!open) return;
    if (blocked === false) {
      try { localStorage.setItem(DISMISS_KEY, "1"); } catch { /* noop */ }
      onSatisfied();
    }
  }, [blocked, open, onSatisfied]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card border border-crimson/40 rounded-2xl p-6 space-y-4 shadow-2xl">
        <div className="flex justify-center">
          <div className="h-14 w-14 rounded-full bg-crimson/15 flex items-center justify-center">
            <ShieldOff className="h-7 w-7 text-crimson" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-lg font-bold text-foreground">Disable AdBlock to continue earning</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Roughly <span className="text-crimson font-semibold">60% of ads are blocked by ad-blocker
            services</span>. Every blocked impression is revenue that <em>never reaches your wallet</em>.
            Whitelist this site (or pause your ad-blocker) so the rewards engine can credit you.
          </p>
        </div>

        <div className="rounded-lg border border-border/60 bg-secondary/30 p-3 text-[11px] text-muted-foreground space-y-1">
          <p className="font-semibold text-foreground">How to whitelist:</p>
          <p>1. Click the ad-blocker icon in your browser toolbar.</p>
          <p>2. Choose <strong>"Don't run on this site"</strong> or <strong>"Pause"</strong>.</p>
          <p>3. This card will close automatically.</p>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs">
          {blocked === null && (
            <><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /><span className="text-muted-foreground">Checking…</span></>
          )}
          {blocked === true && (
            <><ShieldOff className="h-4 w-4 text-crimson" /><span className="text-crimson font-semibold">AdBlock detected — still active</span></>
          )}
          {blocked === false && (
            <><CheckCircle2 className="h-4 w-4 text-money" /><span className="text-money font-semibold">All clear — closing…</span></>
          )}
        </div>

        <Button
          disabled={blocked !== false}
          onClick={onSatisfied}
          className="w-full"
        >
          {blocked === false ? "Continue" : "Waiting for AdBlock to be disabled…"}
        </Button>
      </div>
    </div>
  );
}

export function adBlockSlideAlreadySatisfied(): boolean {
  try { return localStorage.getItem(DISMISS_KEY) === "1"; } catch { return false; }
}
