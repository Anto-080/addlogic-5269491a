import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Coins, Smartphone, Wallet, Phone, ShieldCheck, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { PhoneOtpDialog } from "@/components/PhoneOtpDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type ProviderId = "minipay" | "gwallet";

type Provider = {
  id: ProviderId;
  name: string;
  icon: typeof Coins;
  desc: string;
  fee: string;
  coin: string;
  destLabel: string;
  destPlaceholder: string;
  validate: (v: string) => boolean;
  validationMsg: string;
};

const CELO_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PROVIDERS: Provider[] = [
  {
    id: "minipay", name: "MiniPay", icon: Smartphone,
    desc: "Opera's mobile stablecoin wallet — instant cUSD/USDT settlement on Celo.",
    fee: "0.5%", coin: "cUSD",
    destLabel: "Celo address", destPlaceholder: "0x…",
    validate: (v) => CELO_ADDRESS_RE.test(v),
    validationMsg: "Expected a Celo address starting with 0x (40 hex chars).",
  },
  {
    id: "gwallet", name: "Google Wallet", icon: Wallet,
    desc: "Convert to USDC and load directly into Google Wallet for everyday spending.",
    fee: "1.2%", coin: "USDC",
    destLabel: "Google account email", destPlaceholder: "you@gmail.com",
    validate: (v) => EMAIL_RE.test(v),
    validationMsg: "Enter the Google account email associated with your wallet.",
  },
];

export function StablecoinWithdraw({ available }: { available: number }) {
  const { user } = useAuth();
  const [provider, setProvider] = useState<ProviderId>("minipay");
  const [amount, setAmount] = useState<string>("");
  const [linkedPhone, setLinkedPhone] = useState<string | null>(null);
  const [otpOpen, setOtpOpen] = useState(false);
  const [checkingPhone, setCheckingPhone] = useState(true);
  const [destinations, setDestinations] = useState<Record<ProviderId, string | null>>({ minipay: null, gwallet: null });
  const [linkOpen, setLinkOpen] = useState<ProviderId | null>(null);
  const [linkValue, setLinkValue] = useState("");
  const [saving, setSaving] = useState(false);

  const selected = PROVIDERS.find((p) => p.id === provider)!;
  const numericAmount = parseFloat(amount) || 0;
  const feePct = parseFloat(selected.fee) / 100;
  const fee = numericAmount * feePct;
  const net = Math.max(0, numericAmount - fee);
  const selectedDest = destinations[provider];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) { setCheckingPhone(false); return; }
      const { data } = await supabase
        .from("profiles")
        .select("phone, minipay_address, google_wallet_email")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      setLinkedPhone((data?.phone as string | null) ?? user.phone ?? null);
      setDestinations({
        minipay: ((data as any)?.minipay_address as string | null) ?? null,
        gwallet: ((data as any)?.google_wallet_email as string | null) ?? null,
      });
      setCheckingPhone(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const openLink = (id: ProviderId) => {
    setLinkValue(destinations[id] ?? "");
    setLinkOpen(id);
  };

  const saveLink = async () => {
    if (!user || !linkOpen) return;
    const p = PROVIDERS.find((x) => x.id === linkOpen)!;
    const trimmed = linkValue.trim();
    if (!p.validate(trimmed)) {
      toast({ title: `Invalid ${p.name}`, description: p.validationMsg, variant: "destructive" });
      return;
    }
    setSaving(true);
    const patch = linkOpen === "minipay"
      ? { minipay_address: trimmed }
      : { google_wallet_email: trimmed };
    const { error } = await supabase.from("profiles").update(patch as any).eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Could not link", description: error.message, variant: "destructive" });
      return;
    }
    setDestinations((d) => ({ ...d, [linkOpen]: trimmed }));
    setLinkOpen(null);
    toast({ title: `${p.name} linked` });
  };

  const doWithdraw = () => {
    if (numericAmount <= 0 || numericAmount > available) {
      toast({ title: "Invalid amount", description: `Enter an amount between $0.01 and $${available.toFixed(2)}.`, variant: "destructive" });
      return;
    }
    if (!selectedDest) {
      openLink(provider);
      return;
    }
    toast({
      title: "Withdrawal queued",
      description: `${net.toFixed(2)} ${selected.coin} → ${selected.name} (${selectedDest}). Settlement typically completes within 2 minutes.`,
    });
    setAmount("");
  };

  const onWithdrawClick = () => {
    if (!linkedPhone) { setOtpOpen(true); return; }
    doWithdraw();
  };

  return (
    <Card className="bg-card border-border/50 glow-amber">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Coins className="h-5 w-5 text-money" />
          Stablecoin Withdrawal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Convert your earnings to stablecoins (cUSD, USDC, USDT) and send to a mobile wallet or self-custody address. Fast, low-fee, no bank required.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PROVIDERS.map((p) => {
            const isSelected = provider === p.id;
            const dest = destinations[p.id];
            return (
              <button
                key={p.id}
                onClick={() => setProvider(p.id)}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  isSelected
                    ? "border-[#9A7246] bg-[#9A7246]/10"
                    : "border-border/50 bg-secondary/30 hover:bg-secondary/50"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <p.icon className="h-5 w-5 text-money" />
                  <p className="text-xs font-semibold text-foreground">{p.name}</p>
                  {dest && <CheckCircle2 className="h-3.5 w-3.5 text-money ml-auto" />}
                </div>
                <p className="text-[10px] text-muted-foreground leading-tight">{p.desc}</p>
                <p className="text-[10px] text-foreground/70 mt-2">Fee {p.fee} · {p.coin}</p>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); openLink(p.id); }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); openLink(p.id); } }}
                  className="mt-3 w-full rounded-full px-3 py-2 cursor-pointer flex items-center justify-between gap-2 transition-colors shadow-inner"
                  style={
                    dest
                      ? { background: "linear-gradient(90deg, hsl(140 70% 28%), hsl(140 75% 38%))", border: "1px solid hsl(140 80% 45%)" }
                      : { background: "linear-gradient(90deg, hsl(0 75% 38%), hsl(0 80% 48%))", border: "1px solid hsl(0 85% 55%)" }
                  }
                >
                  <span
                    className="text-[11px] font-bold uppercase tracking-wide truncate"
                    style={{ color: dest ? "#F5C518" : "#000" }}
                  >
                    {dest ? <>Linked: <span className="font-mono normal-case tracking-normal">{dest}</span></> : "Not linked yet"}
                  </span>
                  <span
                    className="text-[11px] font-bold uppercase tracking-wide shrink-0"
                    style={{ color: dest ? "#F5C518" : "#000" }}
                  >
                    {dest ? "Edit" : "Link"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="rounded-lg border border-border/40 bg-secondary/30 p-2 text-[11px] text-muted-foreground leading-snug">
          <strong className="text-foreground">Why no anonymous wallets?</strong> Self-custody EVM/Solana payouts would let bot
          farms spin up infinite anonymous accounts and drain the advertiser pool — shrinking real researchers' rewards.
          Identity-tied rails (MiniPay, Google Wallet) keep the system fair.
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Amount ($)</span>
            <button
              onClick={() => setAmount(available.toFixed(2))}
              className="text-money hover:underline"
            >
              Max ${available.toFixed(2)}
            </button>
          </div>
          <Input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-secondary/50"
          />
        </div>

        <div className="rounded-lg bg-secondary/40 p-3 text-xs space-y-1">
          <div className="flex justify-between"><span className="text-muted-foreground">Gross</span><span className="text-money">${numericAmount.toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Fee ({selected.fee})</span><span className="text-crimson">−${fee.toFixed(2)}</span></div>
          <div className="flex justify-between font-semibold pt-1 border-t border-border/40"><span className="text-foreground">You receive</span><span className="text-money">${net.toFixed(2)} {selected.coin}</span></div>
        </div>

        {!checkingPhone && (
          <div className={`flex items-center gap-2 text-[11px] ${linkedPhone ? "text-money" : "text-muted-foreground"}`}>
            {linkedPhone ? <ShieldCheck className="h-3.5 w-3.5" /> : <Phone className="h-3.5 w-3.5" />}
            {linkedPhone
              ? <>Phone linked: <span className="text-foreground font-medium">{linkedPhone}</span></>
              : <>Phone verification required before first withdrawal.</>}
          </div>
        )}

        <Button onClick={onWithdrawClick} disabled={checkingPhone} className="w-full gap-2 bg-money hover:bg-money/90 text-white">
          {linkedPhone
            ? <selected.icon className="h-4 w-4" />
            : <Phone className="h-4 w-4" />}
          {!linkedPhone
            ? "Link phone to withdraw"
            : !selectedDest
              ? `Link ${selected.name} to withdraw`
              : `Send to ${selected.name}`}
        </Button>

        <PhoneOtpDialog
          open={otpOpen}
          onOpenChange={setOtpOpen}
          onVerified={(p) => setLinkedPhone(p)}
        />

        <Dialog open={linkOpen !== null} onOpenChange={(o) => !o && setLinkOpen(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {linkOpen ? `Link ${PROVIDERS.find((p) => p.id === linkOpen)!.name}` : ""}
              </DialogTitle>
              <DialogDescription>
                {linkOpen === "minipay"
                  ? "Paste your MiniPay (Celo) wallet address. We'll route cUSD withdrawals here."
                  : "Enter the email tied to your Google Wallet for USDC payouts."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label className="text-xs">
                {linkOpen ? PROVIDERS.find((p) => p.id === linkOpen)!.destLabel : ""}
              </Label>
              <Input
                value={linkValue}
                onChange={(e) => setLinkValue(e.target.value)}
                placeholder={linkOpen ? PROVIDERS.find((p) => p.id === linkOpen)!.destPlaceholder : ""}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setLinkOpen(null)} disabled={saving}>Cancel</Button>
              <Button onClick={saveLink} disabled={saving} className="bg-money hover:bg-money/90 text-white">
                {saving ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
