import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Cookie, CheckCircle2, Loader2 } from "lucide-react";
import { sweepCookies, persistAudit, type CookieAudit } from "@/lib/cookieAudit";
import { useAuth } from "@/hooks/useAuth";

type Props = {
  open: boolean;
  onSatisfied: () => void;
};

/**
 * Shown right after AdBlock check passes. Reads `document.cookie`,
 * categorizes each entry, persists them into `cookie_audit` server-side, and
 * shows the user a clean summary (no raw cookie names — those were noise).
 */
export function CookieAuditSlide({ open, onSatisfied }: Props) {
  const { user } = useAuth();
  const [audit, setAudit] = useState<CookieAudit | null>(null);
  const [persisting, setPersisting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const a = sweepCookies();
    setAudit(a);
    if (user && a.entries.length) {
      setPersisting(true);
      persistAudit(user.id, a).finally(() => setPersisting(false));
    }
  }, [open, user]);

  if (!open) return null;

  const total = audit ? audit.counts.first + audit.counts.third + audit.counts.zero : 0;

  return (
    <div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-md w-full bg-card border border-[hsl(var(--cookie-chip))]/40 rounded-2xl p-6 space-y-4 shadow-2xl my-8">
        <div className="flex justify-center">
          <div className="h-14 w-14 rounded-full bg-[hsl(var(--cookie-chip))]/15 flex items-center justify-center">
            <Cookie className="h-7 w-7" style={{ color: "hsl(var(--cookie-chip))" }} />
          </div>
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-lg font-bold text-foreground">Cookie sync complete</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            We swept <span className="text-foreground font-semibold">{total}</span> cookie{total === 1 ? "" : "s"} on this
            device — <span className="text-foreground">{audit?.counts.first ?? 0}</span> first-party,{" "}
            <span className="text-crimson">{audit?.counts.third ?? 0}</span> third-party, and we wrote{" "}
            <span className="text-money">{audit?.counts.zero ?? 0}</span> zero-party of our own.
            Tap <strong>Continue</strong> when you're ready.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          {(["first", "third", "zero"] as const).map((kind) => (
            <div key={kind} className="rounded-lg border border-border/50 bg-secondary/30 p-3">
              <p className="text-2xl font-bold text-foreground">{audit?.counts[kind] ?? 0}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {kind === "first" ? "first-party" : kind === "third" ? "third-party" : "zero-party"}
              </p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-2 text-xs">
          {persisting ? (
            <><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /><span className="text-muted-foreground">Saving audit…</span></>
          ) : (
            <><CheckCircle2 className="h-4 w-4 text-money" /><span className="text-money font-semibold">Audit saved</span></>
          )}
        </div>

        <Button onClick={onSatisfied} disabled={persisting} className="w-full">
          Continue
        </Button>
      </div>
    </div>
  );
}
