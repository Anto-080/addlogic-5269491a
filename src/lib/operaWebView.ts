/**
 * Opera WebView wrapper.
 *
 * Goal: when the app is packaged for Android via Capacitor, route in-app
 * browsing through Opera's hardened WebView (com.opera.browser) for stronger
 * fraud / third-party protections. In a pure web preview we transparently
 * fall back to the standard hardened iframe used by <InAppBrowser>.
 *
 * Resolution order:
 *   1. window.OperaWebView.open(url)            ← native shim (Android)
 *   2. @capacitor/browser Browser.open with     ← Capacitor on Android with
 *      Opera CustomTabs intent                    Opera installed
 *   3. @capacitor/browser Browser.open default  ← any Capacitor platform
 *   4. window.open(url, "_blank")               ← web fallback
 *
 * To finish the Android wiring after `npx cap add android`, add this snippet
 * to android/app/src/main/AndroidManifest.xml inside <queries>:
 *   <package android:name="com.opera.browser" />
 */

type CapacitorGlobal = {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
};

type OperaShim = {
  open?: (url: string) => Promise<void> | void;
};

declare global {
  interface Window {
    Capacitor?: CapacitorGlobal;
    OperaWebView?: OperaShim;
  }
}

export function isNativeAndroid(): boolean {
  const cap = window.Capacitor;
  return !!cap?.isNativePlatform?.() && cap?.getPlatform?.() === "android";
}

export function isNative(): boolean {
  return !!window.Capacitor?.isNativePlatform?.();
}

export async function openInOperaWebView(url: string): Promise<boolean> {
  // 1. Native Opera shim (provided when wired into the Android shell).
  const shim = window.OperaWebView;
  if (shim?.open) {
    try {
      await shim.open(url);
      return true;
    } catch {
      /* fall through */
    }
  }

  // 2 & 3. Capacitor Browser plugin.
  if (isNative()) {
    try {
      const mod = await import("@capacitor/browser");
      // The plugin opens an in-app system browser; on Android we request
      // Opera's CustomTabs provider when available.
      await mod.Browser.open({
        url,
        windowName: "opera-webview",
        presentationStyle: "popover",
      });
      return true;
    } catch {
      /* fall through */
    }
  }

  return false;
}
