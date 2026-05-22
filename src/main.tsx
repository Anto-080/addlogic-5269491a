import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { FingerprintProvider } from "@fingerprint/react";
import App from "./App.tsx";
import { supabase } from "@/integrations/supabase/client";
import "./index.css";

// FingerprintJS Pro public API key. Safe to ship in the bundle — the
// secret key stays server-side in the `fingerprint-signals` edge function.
// Loading the agent app-wide ensures the VPN block in <ConnectionGate /> has
// the visitorId/requestId ready before the first verification check.
const FP_PUBLIC_API_KEY = "XjSfqoWu740uS0NA1nqr";

type FingerprintConfig = {
  publicKey?: string;
  region?: string | null;
};

function FingerprintBootstrap() {
  const [config, setConfig] = useState<FingerprintConfig | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data } = await supabase.functions.invoke("fingerprint-signals", { method: "GET" });
        if (!cancelled) {
          setConfig((data as FingerprintConfig | null) ?? {});
        }
      } catch {
        if (!cancelled) setConfig({});
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const providerProps = useMemo(() => {
    const region = config?.region;
    const safeRegion = region === "eu" || region === "us" || region === "ap" ? region : undefined;
    return {
      apiKey: config?.publicKey ?? FP_PUBLIC_API_KEY,
      ...(safeRegion ? { region: safeRegion as "eu" | "us" | "ap" } : {}),
    };
  }, [config]);

  return (
    <FingerprintProvider {...providerProps}>
      <App />
    </FingerprintProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <FingerprintBootstrap />
);
