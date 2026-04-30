import { useEffect, useRef, useState } from "react";

/**
 * Detects active ad-blocking via two complementary signals:
 *  1. Bait DOM element with classes commonly hidden by EasyList rules.
 *  2. Bait fetch to a URL hosted by ad networks (typically blocked at the
 *     network layer by uBlock/AdGuard/etc.).
 *
 * Returns `null` while running the first check, then `true`/`false`. When
 * `pollInterval` is provided, re-runs on that interval so the caller can
 * react when the user disables their blocker without page reload.
 */
export function useAdBlockDetector(pollInterval = 0): boolean | null {
  const [blocked, setBlocked] = useState<boolean | null>(null);
  const baitRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      // 1. DOM bait
      let bait = baitRef.current;
      if (!bait) {
        bait = document.createElement("div");
        bait.className = "adsbox ad-banner ads ad-placement adsbygoogle";
        bait.style.cssText = "position:absolute;left:-9999px;top:-9999px;width:300px;height:50px;";
        bait.innerHTML = "&nbsp;";
        document.body.appendChild(bait);
        baitRef.current = bait;
      }
      // Allow layout to settle.
      await new Promise((r) => setTimeout(r, 80));
      const domBlocked =
        !bait.offsetParent ||
        bait.offsetHeight === 0 ||
        bait.clientHeight === 0 ||
        getComputedStyle(bait).display === "none";

      // 2. Network bait — common ad host script
      let netBlocked = false;
      try {
        await fetch("https://pagead2.googlesyndication.com/pagead/show_ads.js", {
          method: "HEAD",
          mode: "no-cors",
          cache: "no-store",
        });
      } catch {
        netBlocked = true;
      }

      if (!cancelled) setBlocked(domBlocked || netBlocked);
    };

    check();
    let timer: number | undefined;
    if (pollInterval > 0) {
      timer = window.setInterval(check, pollInterval);
    }
    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      if (baitRef.current) {
        baitRef.current.remove();
        baitRef.current = null;
      }
    };
  }, [pollInterval]);

  return blocked;
}
