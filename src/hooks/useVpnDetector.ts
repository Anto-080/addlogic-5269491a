import { useEffect, useState } from "react";
import { clearIpVerdictCache, fetchIpVerdict, type VerdictStatus } from "@/lib/vpnDetection";

/**
 * Polls the IP intelligence verdict on an interval so consumers can
 * react when a user enables/disables a VPN mid-session. Returns the
 * latest verdict status, or null while the first check is in flight.
 *
 * Mirrors useAdBlockDetector's contract.
 */
export function useVpnDetector(pollInterval = 0): VerdictStatus | null {
  const [status, setStatus] = useState<VerdictStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async (force = false) => {
      if (force) clearIpVerdictCache();
      const v = await fetchIpVerdict(force);
      if (!cancelled) setStatus(v.status);
    };
    run();
    let timer: number | undefined;
    if (pollInterval > 0) {
      timer = window.setInterval(() => run(true), pollInterval);
    }
    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [pollInterval]);

  return status;
}
