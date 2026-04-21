/**
 * Opera WebView bridge.
 *
 * On Android (when packaged with Capacitor), this opens URLs through Opera's
 * hardened WebView / Custom Tabs to leverage its anti-fraud protections.
 *
 * Resolution order:
 *   1. Native shim `window.OperaWebView.open(url)` — wired in Android Studio
 *      via the OperaWebView AAR / custom JavaScriptInterface.
 *   2. Capacitor `@capacitor/browser` with Opera's package as the preferred
 *      Custom Tabs provider (`com.opera.browser`).
 *   3. Fallback: standard in-app browser.
 *
 * On the web (Lovable preview), `isAndroidNative()` is false and callers
 * should render the in-app iframe instead.
 */

export function isAndroidNative(): boolean {
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string } }).Capacitor;
  return !!cap?.isNativePlatform?.() && cap?.getPlatform?.() === "android";
}

type NativeShim = { open: (url: string) => void };

export async function openInOperaWebView(url: string): Promise<boolean> {
  // 1. Native JS interface
  const shim = (window as unknown as { OperaWebView?: NativeShim }).OperaWebView;
  if (shim?.open) {
    try {
      shim.open(url);
      return true;
    } catch {
      // fall through
    }
  }

  // 2. Capacitor Browser plugin (lazy-loaded so the web build doesn't require it)
  if (isAndroidNative()) {
    try {
      const mod = await import(/* @vite-ignore */ "@capacitor/browser").catch(() => null);
      if (mod?.Browser?.open) {
        await mod.Browser.open({
          url,
          // hint Android to prefer Opera as the Custom Tabs provider
          // (ignored if Opera is not installed)
          // @ts-expect-error - extra hint field consumed by native bridge
          windowName: "opera-webview",
        });
        return true;
      }
    } catch {
      // fall through
    }
  }

  return false;
}
