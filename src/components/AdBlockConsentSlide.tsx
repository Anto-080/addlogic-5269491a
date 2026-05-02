import { ShieldOff, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdBlockDetector } from "@/hooks/useAdBlockDetector";

type Props = {
  open: boolean;
  onSatisfied: () => void;
};

/**
 * Hard-gate slide shown whenever the cookie toggle is on AND an ad-blocker
 * is active. Cannot be dismissed until the blocker is OFF or the site is
 * whitelisted. The "Continue" button stays disabled (dark) until the
 * detector flips to clean. Re-checks every 3s.
 */
export function AdBlockConsentSlide({ open, onSatisfied }: Props) {
  const blocked = useAdBlockDetector(open ? 3000 : 0);

  if (!open) return null;

  const canContinue = blocked === false;

  return (
    <div className="fixed inset-0 z-[70] bg-background/95 backdrop-blur flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-md w-full bg-card border border-crimson/40 rounded-2xl p-6 space-y-4 shadow-2xl my-8">
        <div className="flex justify-center">
          <div className="h-14 w-14 rounded-full bg-crimson/15 flex items-center justify-center">
            <ShieldOff className="h-7 w-7 text-crimson" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-lg font-bold text-foreground">Whitelist AddLogic to keep researching</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Ad-blockers stop more than <span className="text-crimson font-semibold">60% of impressions</span>,
            which depletes the redistributed research-grant pool. Whitelist AddLogic
            (or close your ad-blocker) so the rewards engine can credit your time
            and other researchers' work.
          </p>
        </div>

        <div className="rounded-lg border border-border/60 bg-secondary/30 p-3 text-[11px] text-muted-foreground space-y-1">
          <p className="font-semibold text-foreground">How to whitelist:</p>
          <p>1. Click the ad-blocker icon in your browser toolbar.</p>
          <p>2. Choose <strong>"Don't run on this site"</strong> or <strong>"Pause"</strong>.</p>
          <p>3. This card closes automatically — no reload needed.</p>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs">
          {blocked === null && (
            <><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /><span className="text-muted-foreground">Checking…</span></>
          )}
          {blocked === true && (
            <><ShieldOff className="h-4 w-4 text-crimson" /><span className="text-crimson font-semibold">AdBlock detected — still active</span></>
          )}
          {blocked === false && (
            <><CheckCircle2 className="h-4 w-4 text-money" /><span className="text-money font-semibold">All clear</span></>
          )}
        </div>

        <Button
          disabled={!canContinue}
          onClick={onSatisfied}
          className="w-full"
        >
          {canContinue ? "Continue" : "Waiting for AdBlock to be disabled…"}
        </Button>
      </div>
    </div>
  );
}
