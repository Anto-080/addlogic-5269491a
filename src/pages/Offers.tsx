import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TIERS } from "@/lib/mockData";
import { useOffers } from "@/hooks/useAppData";
import { TierIcon } from "@/components/TierIcon";
import { UsdcIcon } from "@/components/icons/UsdcIcon";
import { Tag, Sparkles, Lock } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

export default function Offers() {
  const [view, setView] = useState<"browse" | "place">("browse");
  const { data: offers = [] } = useOffers();

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Tag className="h-6 w-6 text-primary" /> Offers
          </h1>
          <p className="text-sm text-muted-foreground">
            CPA marketplace — sponsors list discounts for free, pay only on completed purchase.
          </p>
        </div>

        <Tabs value={view} onValueChange={(v) => setView(v as "browse" | "place")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="browse">Browse Offers</TabsTrigger>
            <TabsTrigger value="place">Place Offer</TabsTrigger>
          </TabsList>

          {/* ===== BROWSE ===== */}
          <TabsContent value="browse" className="space-y-3 mt-4">
            <Card className="bg-card border-border/50 p-3">
              <div className="flex items-start gap-2">
                <Lock className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">Level 50 Unlock:</strong> Cashback on purchased offers.
                </p>
              </div>
            </Card>

            <div className="space-y-3">
              {offers.length === 0 && (
                <p className="text-xs text-muted-foreground italic px-1">Loading offers…</p>
              )}
              {offers.map((o) => {
                const tier = TIERS.find((t) => t.id === o.tier_id)!;
                return (
                  <Card key={o.id} className="bg-card border-border/50" style={{ borderLeft: `3px solid ${tier.color}` }}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span style={{ color: tier.color }}><TierIcon tierId={tier.id} size={26} /></span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{o.merchant}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{tier.name}</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-crimson shrink-0 px-2 py-1 rounded-full bg-crimson/10">
                          −{o.discount}%
                        </span>
                      </div>

                      <p className="text-xs text-foreground/80">{o.title}</p>

                      <div className="flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-muted-foreground line-through inline-flex items-center gap-1">
                            <UsdcIcon size={11} /> {o.original_price.toFixed(2)}
                          </span>
                          <span className="text-gradient-gold font-bold inline-flex items-center gap-1">
                            <UsdcIcon size={12} /> {o.sale_price.toFixed(2)}
                          </span>
                        </div>
                        <span className="text-[10px] text-primary inline-flex items-center gap-1">
                          CPA payout <UsdcIcon size={10} /> {o.cpa_payout.toFixed(2)}
                        </span>
                      </div>

                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full"
                        onClick={() => toast({ title: "Offer claimed", description: `${o.merchant} — checkout link sent.` })}
                      >
                        Claim Offer
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* ===== PLACE ===== */}
          <TabsContent value="place" className="space-y-4 mt-4">
            <Card className="bg-card border-border/50 p-3">
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">CPA = Cost Per Acquisition.</strong> Sponsors list offers free; pay only when a user completes a purchase. Better deals for users, zero-risk reach for sponsors.
                </p>
              </div>
            </Card>

            <PlaceOfferForm />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

function PlaceOfferForm() {
  const [tierId, setTierId] = useState<number>(6);
  const [merchant, setMerchant] = useState("");
  const [discount, setDiscount] = useState("20");
  const [bounty, setBounty] = useState("2.50");
  const [cta, setCta] = useState("Shop now");

  const tier = TIERS.find((t) => t.id === tierId)!;

  return (
    <Card className="bg-card border-border/50">
      <CardContent className="p-4 space-y-4">
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Interest Tier</label>
          <select
            value={tierId}
            onChange={(e) => setTierId(Number(e.target.value))}
            className="w-full bg-secondary/50 rounded-md px-3 py-2 text-sm border border-border"
          >
            {TIERS.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Merchant Name</label>
          <Input value={merchant} onChange={(e) => setMerchant(e.target.value)} placeholder="Acme Co." className="bg-secondary/50" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Discount %</label>
            <Input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} className="bg-secondary/50" />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground inline-flex items-center gap-1">CPA bounty (<UsdcIcon size={10} />)</label>
            <Input type="number" step="0.01" value={bounty} onChange={(e) => setBounty(e.target.value)} className="bg-secondary/50" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">CTA Label</label>
          <Input value={cta} onChange={(e) => setCta(e.target.value)} className="bg-secondary/50" />
        </div>

        {/* Preview */}
        <div className="rounded-lg border p-3" style={{ borderColor: tier.color, background: `${tier.color}14` }}>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Preview</p>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span style={{ color: tier.color }}><TierIcon tierId={tier.id} size={20} /></span>
              <p className="text-sm font-semibold text-foreground truncate">{merchant || "Your brand"}</p>
            </div>
            <span className="text-xs font-bold text-crimson">−{discount}%</span>
          </div>
          <Button size="sm" className="w-full mt-2" disabled>{cta}</Button>
        </div>

        <Button
          className="w-full"
          onClick={() => toast({ title: "Offer submitted (mock)", description: "Free listing — you only pay on conversion." })}
        >
          Submit Offer (Free listing — pay on conversion)
        </Button>
      </CardContent>
    </Card>
  );
}
