import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Star, ExternalLink, X, Loader2 } from "lucide-react";
import { useSponsorRating, useSubmitSponsorRating } from "@/hooks/useSponsorRating";
import { NativeAdSlot, type NativeAd } from "@/components/NativeAdSlot";

type Props = {
  open: boolean;
  url: string;
  host: string;
  tierId: number;
  /** Sponsor associated with the native ad shown in the interstitial. */
  ad: NativeAd | null;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Full-screen exit interstitial: shown BEFORE we open an outbound URL in a
 * new browser tab. Sequence:
 *   1. Native ad slot (must be tapped → "ad opened").
 *   2. 5-second countdown.
 *   3. One-time star rating per sponsor (skipped if already rated).
 *   4. "Continue to {host}" CTA.
 */
export function ExitInterstitial({ open, url, host, tierId, ad, onConfirm, onCancel }: Props) {
  const sponsorId = ad?.sponsorId ?? null;
  const { data: ratingState } = useSponsorRating(sponsorId);
  const submit = useSubmitSponsorRating();
  const [adOpened, setAdOpened] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);

  useEffect(() => {
    if (!open) return;
    setAdOpened(false);
    setCountdown(5);
    setStars(0);
    setHover(0);
  }, [open, url]);

  useEffect(() => {
    if (!open) return;
    const i = window.setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => window.clearInterval(i);
  }, [open]);

  if (!open) return null;

  const ratingNeeded = !!sponsorId && !ratingState?.rated;
  const ratingSubmitted = ratingNeeded ? stars > 0 : true;
  const canContinue = adOpened && countdown === 0 && ratingSubmitted;

  const submitRating = (n: number) => {
    setStars(n);
    if (sponsorId) submit.mutate({ sponsorId, stars: n });
  };

  return (
    <div className="fixed inset-0 z-[70] bg-background/95 backdrop-blur flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card border border-primary/40 rounded-2xl p-5 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            Exit interstitial
          </p>
          <button
            type="button"
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground">
          Opening <span className="text-foreground font-medium">{host}</span> in a new browser tab.
          Tap the sponsor card to credit your retribution, then continue.
        </p>

        <NativeAdSlot tierId={tierId} ad={ad} onOpen={() => setAdOpened(true)} opened={adOpened} />

        {ratingNeeded && adOpened && countdown === 0 && (
          <div className="rounded-lg border border-gold/40 bg-gold/5 p-3 space-y-2">
            <p className="text-xs text-foreground font-medium">
              Rate this sponsor (one time only)
            </p>
            <div className="flex justify-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => submitRating(n)}
                  className={`h-6 w-6 cursor-pointer transition-colors ${
                    n <= (hover || stars) ? "text-gold fill-gold" : "text-muted-foreground"
                  }`}
                />
              ))}
            </div>
            {submit.isPending && (
              <p className="text-[10px] text-muted-foreground inline-flex items-center gap-1 justify-center w-full">
                <Loader2 className="h-3 w-3 animate-spin" /> saving…
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Button
            disabled={!canContinue}
            onClick={onConfirm}
            className="w-full gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            {!adOpened
              ? "Tap the sponsor card first"
              : countdown > 0
                ? `Continue in ${countdown}s…`
                : !ratingSubmitted
                  ? "Tap stars to rate then continue"
                  : `Continue to ${host}`}
          </Button>
          <button
            type="button"
            onClick={onCancel}
            className="text-[11px] text-muted-foreground hover:text-foreground self-center"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
