import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from "react";
import {
  clearVisitorEventCache,
  getVisitorEvent,
  isFingerprintConfigured,
} from "@/lib/fingerprint";

type FingerprintState = {
  visitorId: string | null;
  requestId: string | null;
  loading: boolean;
  error: string | null;
  configured: boolean;
  refresh: () => Promise<void>;
};

const FingerprintContext = createContext<FingerprintState>({
  visitorId: null,
  requestId: null,
  loading: true,
  error: null,
  configured: false,
  refresh: async () => {},
});

export function FingerprintProvider({ children }: { children: ReactNode }) {
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const ev = await getVisitorEvent();
      if (!mounted.current) return;
      setVisitorId(ev.visitorId);
      setRequestId(ev.requestId);
      if (!ev.visitorId) setError("Fingerprint unavailable");
    } catch (e) {
      if (!mounted.current) return;
      setError(e instanceof Error ? e.message : "Fingerprint failed");
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    clearVisitorEventCache();
    await run();
  }, [run]);

  useEffect(() => {
    mounted.current = true;
    run();
    return () => {
      mounted.current = false;
    };
  }, [run]);

  return (
    <FingerprintContext.Provider
      value={{ visitorId, requestId, loading, error, configured: isFingerprintConfigured(), refresh }}
    >
      {children}
    </FingerprintContext.Provider>
  );
}

export function useFingerprint() {
  return useContext(FingerprintContext);
}
