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
 * categorizes each entry, persists them into `cookie_audit`, and shows the
 * user the visible result of enabling the toggle. This is the proof the
 * cookie switch actually does something.
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
            We swept this device's cookies, categorized them, and logged the audit so you
            can see exactly what consent unlocked.
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

        <div className="rounded-lg border border-border/40 bg-secondary/20 p-3 max-h-40 overflow-y-auto text-[11px] space-y-1">
          {(audit?.entries ?? []).slice(0, 30).map((e) => (
            <div key={`${e.host}-${e.name}`} className="flex justify-between gap-2 truncate">
              <code className="text-foreground/90 truncate">{e.name}</code>
              <span
                className={`shrink-0 ${
                  e.kind === "zero" ? "text-money" : e.kind === "third" ? "text-crimson" : "text-muted-foreground"
                }`}
              >
                {e.kind}
              </span>
            </div>
          ))}
          {!audit?.entries.length && (
            <p className="text-muted-foreground italic text-center">No cookies visible from this origin.</p>
          )}
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
