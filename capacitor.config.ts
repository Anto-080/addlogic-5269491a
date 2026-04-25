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
    Geolocation: {
      // Permissions are auto-added to AndroidManifest.xml & Info.plist by
      // `npx cap sync`. After pulling, run:
      //   npx cap sync
      // to regenerate the native permission entries
      // (ACCESS_FINE_LOCATION on Android, NSLocationWhenInUseUsageDescription on iOS).
    },
  },
};

export default config;
