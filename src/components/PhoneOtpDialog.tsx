import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Loader2, Phone, ShieldCheck, LogOut } from "lucide-react";

type Step = "enter" | "verify" | "success";

const PHONE_RE = /^\+[1-9]\d{6,14}$/;

export function PhoneOtpDialog({
  open,
  onOpenChange,
  onVerified,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerified: (phone: string) => void;
}) {
  const { user, signOut } = useAuth();
  const [step, setStep] = useState<Step>("enter");
  const [phone, setPhone] = useState("+");
  const [code, setCode] = useState("");
  const [verifiedPhone, setVerifiedPhone] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setStep("enter");
    setPhone("+");
    setCode("");
    setVerifiedPhone(null);
    setBusy(false);
  };

  const close = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const sendCode = async () => {
    if (!PHONE_RE.test(phone)) {
      toast({ title: "Invalid phone", description: "Use international format, e.g. +15558675310", variant: "destructive" });
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("phone-otp", {
      body: { action: "start", phone },
    });
    setBusy(false);
    if (error || (data as { error?: string })?.error) {
      toast({
        title: "Couldn't send code",
        description: error?.message ?? (data as { error?: string })?.error ?? "Try again",
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Code sent", description: `We SMS'd a 6-digit code to ${phone}.` });
    setStep("verify");
  };

  const verifyCode = async () => {
    if (code.length !== 6) return;
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("phone-otp", {
      body: { action: "verify", phone, code },
    });
    setBusy(false);
    if (error || (data as { error?: string })?.error) {
      toast({
        title: "Verification failed",
        description: error?.message ?? (data as { error?: string })?.error ?? "Wrong code",
        variant: "destructive",
      });
      setCode("");
      return;
    }
    setVerifiedPhone(phone);
    setStep("success");
    onVerified(phone);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-sm">
        {step === "enter" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-money" />
                Link your phone
              </DialogTitle>
              <DialogDescription>
                Required once before your first withdrawal. We'll send a 6-digit SMS code via Twilio.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                type="tel"
                inputMode="tel"
                placeholder="+15558675310"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoFocus
              />
              <Button onClick={sendCode} disabled={busy} className="w-full gap-2">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />}
                Send code
              </Button>
            </div>
          </>
        )}

        {step === "verify" && (
          <>
            <DialogHeader>
              <DialogTitle>Enter the 6-digit code</DialogTitle>
              <DialogDescription>Sent to {phone}</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 flex flex-col items-center">
              <InputOTP maxLength={6} value={code} onChange={setCode}>
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
              <Button onClick={verifyCode} disabled={busy || code.length !== 6} className="w-full gap-2">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Verify
              </Button>
              <button
                onClick={() => setStep("enter")}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Use a different number
              </button>
            </div>
          </>
        )}

        {step === "success" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-money" />
                Phone linked
              </DialogTitle>
              <DialogDescription>Your account is verified.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <div className="rounded-lg border border-border/50 bg-secondary/30 p-3 space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="text-foreground font-medium">{verifiedPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">User ID</span>
                  <code className="text-[10px] text-foreground/80">{user?.id?.slice(0, 18)}…</code>
                </div>
              </div>
              <Button onClick={() => close(false)} className="w-full">Continue to withdrawal</Button>
              <Button
                variant="outline"
                onClick={async () => { await signOut(); close(false); }}
                className="w-full gap-2 text-muted-foreground hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
