/**
 * Opera WebView bridge.
 *
 * On Android (when packaged with Capacitor), this opens URLs through Opera's
 * hardened WebView / Custom Tabs to leverage its anti-fraud protections.
 *
 * Resolution order:
 *   1. Native shim `window.OperaWebView.open(url)` — wired in Android Studio
 *      via the OperaWebView AAR / custom JavaScriptInterface.
 *   2. Capacitor `@capacitor/browser` (lazy-loaded) with Opera as the
 *      preferred Custom Tabs provider (`com.opera.browser`).
 *   3. Fallback: caller renders the in-app iframe.
 *
 * On the web (Lovable preview), `isAndroidNative()` is false and callers
 * should render the in-app iframe instead.
 */

export function isAndroidNative(): boolean {
  const cap = (window as unknown as {
    Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string };
  }).Capacitor;
  return !!cap?.isNativePlatform?.() && cap?.getPlatform?.() === "android";
}

type NativeShim = { open: (url: string) => void };

export async function openInOperaWebView(url: string): Promise<boolean> {
  // 1. Native JS interface (wired from Android shell)
  const shim = (window as unknown as { OperaWebView?: NativeShim }).OperaWebView;
  if (shim?.open) {
    try {
      shim.open(url);
      return true;
    } catch {
      // fall through
    }
  }

  // 2. Capacitor Browser plugin — only attempt on native Android.
  // Lazy dynamic import via variable specifier so Vite doesn't try to resolve
  // the module at build time (the dep is added at native-export time).
  if (isAndroidNative()) {
    try {
      const moduleName = "@capacitor/browser";
      const mod = await import(/* @vite-ignore */ moduleName).catch(() => null);
      const Browser = (mod as { Browser?: { open: (opts: { url: string }) => Promise<void> } } | null)?.Browser;
      if (Browser?.open) {
        await Browser.open({ url });
        return true;
      }
    } catch {
      // fall through
    }
  }

  return false;
}
