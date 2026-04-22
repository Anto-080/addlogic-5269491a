import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.lovable.researchrewards",
  appName: "ResearchRewards",
  webDir: "dist",
  server: {
    url: "https://8cbf386d-f6d7-4fde-a866-dcb07f4814a2.lovableproject.com?forceHideBadge=true",
    cleartext: true,
  },
  plugins: {
    Browser: {
      // Prefer Opera's CustomTabs provider on Android for stronger
      // anti-fraud / tracking protections during in-app web browsing.
      androidCustomTabsPackage: "com.opera.browser",
    },
  },
};

export default config;
