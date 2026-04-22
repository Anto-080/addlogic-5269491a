import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Coins, Smartphone, Wallet } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Provider = {
  id: string;
  name: string;
  icon: typeof Coins;
  desc: string;
  fee: string;
  coin: string;
};

const PROVIDERS: Provider[] = [
  { id: "minipay",  name: "MiniPay",        icon: Smartphone, desc: "Opera's mobile stablecoin wallet — instant cUSD/USDT settlement on Celo.",  fee: "0.5%", coin: "cUSD" },
  { id: "gwallet",  name: "Google Wallet",  icon: Wallet,     desc: "Convert to USDC and load directly into Google Wallet for everyday spending.", fee: "1.2%", coin: "USDC" },
];

export function StablecoinWithdraw({ available }: { available: number }) {
  const [provider, setProvider] = useState<string>("minipay");
  const [amount, setAmount] = useState<string>("");

  const selected = PROVIDERS.find((p) => p.id === provider)!;
  const numericAmount = parseFloat(amount) || 0;
  const feePct = parseFloat(selected.fee) / 100;
  const fee = numericAmount * feePct;
  const net = Math.max(0, numericAmount - fee);

  const submit = () => {
    if (numericAmount <= 0 || numericAmount > available) {
      toast({ title: "Invalid amount", description: `Enter an amount between $0.01 and $${available.toFixed(2)}.`, variant: "destructive" });
      return;
    }
    toast({
      title: "Withdrawal queued",
      description: `${net.toFixed(2)} ${selected.coin} → ${selected.name}. Settlement typically completes within 2 minutes.`,
    });
    setAmount("");
  };

  return (
    <Card className="bg-card border-border/50 glow-amber">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Coins className="h-5 w-5 text-primary" />
          Stablecoin Withdrawal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Convert your earnings to stablecoins (cUSD, USDC, USDT) and send to a mobile wallet or self-custody address. Fast, low-fee, no bank required.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              onClick={() => setProvider(p.id)}
              className={`p-3 rounded-lg border text-left transition-colors ${
                provider === p.id
                  ? "border-primary bg-primary/10"
                  : "border-border/50 bg-secondary/30 hover:bg-secondary/50"
              }`}
            >
              <p.icon className="h-5 w-5 text-primary mb-2" />
              <p className="text-xs font-semibold text-foreground">{p.name}</p>
              <p className="text-[10px] text-muted-foreground leading-tight mt-1">{p.desc}</p>
              <p className="text-[10px] text-foreground/70 mt-2">Fee {p.fee} · {p.coin}</p>
            </button>
          ))}
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
              className="text-primary hover:underline"
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

        <Button onClick={submit} className="w-full gap-2 bg-money hover:bg-money/90 text-white">
          <selected.icon className="h-4 w-4" />
          Send to {selected.name}
        </Button>
      </CardContent>
    </Card>
  );
}
