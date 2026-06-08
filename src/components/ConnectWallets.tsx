import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Smartphone, Wallet, CheckCircle2, Link2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

type LinkedWallets = {
  minipay_address: string | null;
  google_wallet_email: string | null;
};

const CELO_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ConnectWallets() {
  const { user } = useAuth();
  const [wallets, setWallets] = useState<LinkedWallets>({ minipay_address: null, google_wallet_email: null });
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<null | "minipay" | "google">(null);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from("profiles")
        .select("minipay_address, google_wallet_email")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      setWallets({
        minipay_address: (data as any)?.minipay_address ?? null,
        google_wallet_email: (data as any)?.google_wallet_email ?? null,
      });
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const openDialog = (kind: "minipay" | "google") => {
    setValue(kind === "minipay" ? wallets.minipay_address ?? "" : wallets.google_wallet_email ?? "");
    setOpen(kind);
  };

  const save = async () => {
    if (!user || !open) return;
    const trimmed = value.trim();
    if (open === "minipay" && !CELO_ADDRESS_RE.test(trimmed)) {
      toast({ title: "Invalid MiniPay address", description: "Expected a Celo address starting with 0x (40 hex chars).", variant: "destructive" });
      return;
    }
    if (open === "google" && !EMAIL_RE.test(trimmed)) {
      toast({ title: "Invalid email", description: "Enter the Google account email associated with your wallet.", variant: "destructive" });
      return;
    }

    setSaving(true);
    const patch = open === "minipay" ? { minipay_address: trimmed } : { google_wallet_email: trimmed };
    const { error } = await supabase.from("profiles").update(patch as any).eq("user_id", user.id);
    setSaving(false);

    if (error) {
      toast({ title: "Could not link wallet", description: error.message, variant: "destructive" });
      return;
    }
    setWallets((w) => ({ ...w, ...patch }));
    setOpen(null);
    toast({ title: "Wallet linked", description: open === "minipay" ? "MiniPay address saved." : "Google Wallet email saved." });
  };

  const unlink = async (kind: "minipay" | "google") => {
    if (!user) return;
    const patch = kind === "minipay" ? { minipay_address: null } : { google_wallet_email: null };
    const { error } = await supabase.from("profiles").update(patch as any).eq("user_id", user.id);
    if (error) {
      toast({ title: "Could not unlink", description: error.message, variant: "destructive" });
      return;
    }
    setWallets((w) => ({ ...w, ...patch }));
    toast({ title: "Wallet unlinked" });
  };

  const minipayLinked = !!wallets.minipay_address;
  const googleLinked = !!wallets.google_wallet_email;

  return (
    <Card className="bg-card border-border/50 glow-amber">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Link2 className="h-5 w-5 text-money" />
          Connect Your Wallets
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Link your MiniPay address and Google Wallet email once so withdrawals settle to the right destination.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* MiniPay */}
          <div className="p-3 rounded-lg border border-border/50 bg-secondary/30 space-y-2">
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-money" />
              <p className="text-xs font-semibold text-foreground">MiniPay</p>
              {minipayLinked && <CheckCircle2 className="h-3.5 w-3.5 text-money ml-auto" />}
            </div>
            <p className="text-[10px] text-muted-foreground leading-tight">
              {minipayLinked
                ? <>Linked: <span className="text-foreground font-mono break-all">{wallets.minipay_address}</span></>
                : "Celo address (0x…) for cUSD payouts."}
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant={minipayLinked ? "outline" : "default"} className="flex-1 h-8 text-xs"
                onClick={() => openDialog("minipay")} disabled={loading}>
                {minipayLinked ? "Update" : "Link MiniPay"}
              </Button>
              {minipayLinked && (
                <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => unlink("minipay")}>
                  Unlink
                </Button>
              )}
            </div>
          </div>

          {/* Google Wallet */}
          <div className="p-3 rounded-lg border border-border/50 bg-secondary/30 space-y-2">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-money" />
              <p className="text-xs font-semibold text-foreground">Google Wallet</p>
              {googleLinked && <CheckCircle2 className="h-3.5 w-3.5 text-money ml-auto" />}
            </div>
            <p className="text-[10px] text-muted-foreground leading-tight">
              {googleLinked
                ? <>Linked: <span className="text-foreground break-all">{wallets.google_wallet_email}</span></>
                : "Google account email for USDC payouts."}
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant={googleLinked ? "outline" : "default"} className="flex-1 h-8 text-xs"
                onClick={() => openDialog("google")} disabled={loading}>
                {googleLinked ? "Update" : "Link Google Wallet"}
              </Button>
              {googleLinked && (
                <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => unlink("google")}>
                  Unlink
                </Button>
              )}
            </div>
          </div>
        </div>

        <Dialog open={open !== null} onOpenChange={(o) => !o && setOpen(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {open === "minipay" ? "Link MiniPay" : "Link Google Wallet"}
              </DialogTitle>
              <DialogDescription>
                {open === "minipay"
                  ? "Paste your MiniPay (Celo) wallet address. We'll route cUSD withdrawals here."
                  : "Enter the email tied to your Google Wallet for USDC payouts."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label className="text-xs">{open === "minipay" ? "Celo address" : "Google email"}</Label>
              <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={open === "minipay" ? "0x…" : "you@gmail.com"}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(null)} disabled={saving}>Cancel</Button>
              <Button onClick={save} disabled={saving} className="bg-money hover:bg-money/90 text-white">
                {saving ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
