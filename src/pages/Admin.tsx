import { useState, useMemo, useEffect } from "react";
import { Navigate, Link } from "react-router-dom";
import { useTiers } from "@/hooks/useAppData";
import { useIsAdmin, useUpdateTier, type TierPatch } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ArrowUp, ArrowDown, Save } from "lucide-react";
import { toast } from "sonner";

type Draft = Record<number, TierPatch>;

export default function Admin() {
  const { data: isAdmin, isLoading: roleLoading } = useIsAdmin();
  const { data: tiers, isLoading } = useTiers();
  const updateTier = useUpdateTier();
  const [draft, setDraft] = useState<Draft>({});

  // Seed draft from server data
  useEffect(() => {
    if (!tiers) return;
    setDraft((prev) => {
      const next: Draft = { ...prev };
      tiers.forEach((t) => {
        if (!next[t.id]) {
          next[t.id] = {
            name: t.name,
            multiplier: t.multiplier,
            color: t.color,
            display_order: 0,
            locked: t.locked,
          };
        }
      });
      return next;
    });
  }, [tiers]);

  const sorted = useMemo(() => {
    if (!tiers) return [];
    return [...tiers].sort((a, b) => {
      const ao = draft[a.id]?.display_order ?? 0;
      const bo = draft[b.id]?.display_order ?? 0;
      return ao - bo;
    });
  }, [tiers, draft]);

  if (roleLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Checking permissions…</p></div>;
  }
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const patch = (id: number, p: TierPatch) =>
    setDraft((d) => ({ ...d, [id]: { ...(d[id] ?? {}), ...p } }));

  const move = (id: number, dir: -1 | 1) => {
    const idx = sorted.findIndex((t) => t.id === id);
    const swapWith = sorted[idx + dir];
    if (!swapWith) return;
    const a = draft[id]?.display_order ?? idx;
    const b = draft[swapWith.id]?.display_order ?? idx + dir;
    patch(id, { display_order: b });
    patch(swapWith.id, { display_order: a });
  };

  const saveAll = async () => {
    try {
      // Normalize order to 0..n-1 based on current sorted view
      const ops = sorted.map((t, i) => {
        const p = { ...(draft[t.id] ?? {}), display_order: i };
        return updateTier.mutateAsync({ id: t.id, patch: p });
      });
      await Promise.all(ops);
      toast.success("Tiers updated");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to update tiers");
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gradient-gold">Admin · Tier Editor</h1>
              <p className="text-sm text-muted-foreground">Edit names, multipliers, colors, and ordering. Changes go live for all users.</p>
            </div>
          </div>
          <Button onClick={saveAll} disabled={updateTier.isPending}>
            <Save className="h-4 w-4 mr-2" /> Save all
          </Button>
        </header>

        {isLoading && <p className="text-muted-foreground">Loading tiers…</p>}

        <div className="space-y-3">
          {sorted.map((t, i) => {
            const d = draft[t.id] ?? {};
            return (
              <Card key={t.id} className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{t.icon}</span>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground">Name</label>
                      <Input
                        value={d.name ?? t.name}
                        onChange={(e) => patch(t.id, { name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Multiplier (x)</label>
                      <Input
                        type="number"
                        step="0.1"
                        value={d.multiplier ?? t.multiplier}
                        onChange={(e) => patch(t.id, { multiplier: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Color (HSL or hex)</label>
                      <Input
                        value={d.color ?? t.color}
                        onChange={(e) => patch(t.id, { color: e.target.value })}
                      />
                    </div>
                    <div className="flex items-end gap-3">
                      <div className="flex-1">
                        <label className="text-xs text-muted-foreground block mb-1">Locked</label>
                        <Switch
                          checked={d.locked ?? t.locked}
                          onCheckedChange={(v) => patch(t.id, { locked: v })}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button size="icon" variant="outline" onClick={() => move(t.id, -1)} disabled={i === 0}>
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="outline" onClick={() => move(t.id, 1)} disabled={i === sorted.length - 1}>
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Rank #{i + 1} · {t.subcategories.length} subcategories</p>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
