import { createRoot } from "react-dom/client";
import { FingerprintProvider } from "@fingerprint/react";
import App from "./App.tsx";
import "./index.css";

// FingerprintJS Pro public API key. Safe to ship in the bundle — the
// secret key stays server-side in the `fingerprint-signals` edge function.
// Loading the agent app-wide ensures the VPN block in <VpnGuard /> has
// the visitorId/requestId ready before the first verification check.
const FP_PUBLIC_API_KEY = "XjSfqoWu740uS0NA1nqr";

createRoot(document.getElementById("root")!).render(
  <FingerprintProvider
    loadOptions={{
      apiKey: FP_PUBLIC_API_KEY,
      region: "eu",
    }}
  >
    <App />
  </FingerprintProvider>
);
