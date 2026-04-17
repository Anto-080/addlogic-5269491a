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
