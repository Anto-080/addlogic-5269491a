import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { lovable } from "@/integrations/lovable";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [forgotPassword, setForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (forgotPassword) {
      const { error } = await resetPassword(email);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Check your email", description: "Password reset link sent." });
      setLoading(false);
      return;
    }

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else navigate("/dashboard");
    } else {
      const { error } = await signUp(email, password, displayName);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Check your email", description: "Confirm your account to get started." });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "linear-gradient(145deg, hsl(150 100% 3%), hsl(150 40% 6%), hsl(150 100% 3%))" }}>
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gradient-gold">ResearchRewards</h1>
          <p className="text-muted-foreground text-sm">Earn while you explore what matters</p>
        </div>

        <Card className="border-border/50 bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-foreground">
              {forgotPassword ? "Reset Password" : isLogin ? "Welcome Back" : "Create Account"}
            </CardTitle>
            <CardDescription>
              {forgotPassword ? "Enter your email to receive a reset link" : isLogin ? "Sign in to continue researching" : "Start earning from your curiosity"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && !forgotPassword && (
                <Input placeholder="Display Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="bg-secondary/50" />
              )}
              <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-secondary/50" />
              {!forgotPassword && (
                <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-secondary/50" />
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "..." : forgotPassword ? "Send Reset Link" : isLogin ? "Sign In" : "Create Account"}
              </Button>
            </form>

            {!forgotPassword && (
              <>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/50" /></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or</span></div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-secondary/30 hover:bg-secondary/60"
                  disabled={loading}
                  onClick={async () => {
                    setLoading(true);
                    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
                    if (result.error) {
                      toast({ title: "Error", description: result.error.message, variant: "destructive" });
                      setLoading(false);
                    } else if (!result.redirected) {
                      navigate("/dashboard");
                    }
                  }}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  Continue with Google
                </Button>
              </>
            )}

            <div className="mt-4 space-y-2 text-center">
              {!forgotPassword && (
                <button onClick={() => setForgotPassword(true)} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                  Forgot password?
                </button>
              )}
              <div>
                <button
                  onClick={() => { setIsLogin(!isLogin); setForgotPassword(false); }}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                </button>
              </div>
              {forgotPassword && (
                <button onClick={() => setForgotPassword(false)} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Back to sign in
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
