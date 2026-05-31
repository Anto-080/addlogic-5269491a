import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// FingerprintJS Pro is intentionally NOT loaded here. The agent is only
// initialized lazily when the user clicks "Use approximate location (IP)"
// in GeoConsentSlide (see src/lib/fingerprint.ts). Precise-GPS users
// never trigger a Fingerprint event.

createRoot(document.getElementById("root")!).render(<App />);
