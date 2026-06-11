import { useState } from "react";
import { RoundVault } from "@/components/icons/RoundVault";
import vaultRef from "@/assets/vault-reference.png";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Dev-only overlay tool to verify the inline RoundVault SVG against the
 * uploaded reference. Visit /dev/vault-diff to use it. Slide opacity to
 * crossfade the SVG over the reference; toggle invert / difference blend
 * to spot pixel-level mismatches in shape, size, and bolt placement.
 */
export default function VaultDiff() {
  const [opacity, setOpacity] = useState(50);
  const [size, setSize] = useState(360);
  const [mode, setMode] = useState<"normal" | "difference" | "invert">("difference");
  const [color, setColor] = useState("#B0903D");

  return (
    <div className="min-h-screen bg-background p-6 space-y-6 font-typewriter">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Vault Icon Diff</h1>
        <p className="text-sm text-muted-foreground">
          Overlay the inline SVG on top of the uploaded reference to verify alignment.
        </p>
      </div>

      <Card className="bg-card border-border/50">
        <CardHeader><CardTitle className="text-sm">Controls</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <label className="block text-xs text-muted-foreground">
            SVG opacity ({opacity}%)
            <Slider value={[opacity]} min={0} max={100} step={1} onValueChange={(v) => setOpacity(v[0])} className="mt-2" />
          </label>
          <label className="block text-xs text-muted-foreground">
            Size ({size}px)
            <Slider value={[size]} min={120} max={520} step={4} onValueChange={(v) => setSize(v[0])} className="mt-2" />
          </label>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>Blend mode:</span>
            {(["normal", "difference", "invert"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-2 py-1 rounded border ${mode === m ? "border-primary text-primary" : "border-border"}`}
              >
                {m}
              </button>
            ))}
            <label className="flex items-center gap-2 ml-2">
              SVG color
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
            </label>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <div
          className="relative inline-block"
          style={{ width: size, height: size, background: "#1a1a1a" }}
        >
          <img
            src={vaultRef}
            alt="Vault reference"
            className="absolute inset-0 w-full h-full object-contain"
            style={{ filter: mode === "invert" ? "invert(1)" : undefined }}
          />
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              opacity: opacity / 100,
              mixBlendMode: mode === "difference" ? "difference" : "normal",
              color,
            }}
          >
            <RoundVault size={size} />
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Tip: set opacity to ~50% with blend "difference" — matching pixels go black, mismatches glow.
      </p>
    </div>
  );
}
