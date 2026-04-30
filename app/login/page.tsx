"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useAppContext } from "@/context/AppContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const { login } = useAppContext();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim() !== "123456") {
      setError("Invalid email or password");
      return;
    }
    setError("");

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        console.warn("User not found in DB, falling back to local simulation.", error);
        login("driver", { name: email.split("@")[0] || "Driver User", email });
        router.push("/onboarding");
        return;
      } else {
        if (!data.phone_number) {
          login(data.role as "driver" | "owner", { id: data.id, name: data.name, email: data.email });
          router.push("/onboarding");
          return;
        }
        login(data.role as "driver" | "owner", { id: data.id, name: data.name, email: data.email, phone: data.phone_number, car_number: data.car_number });
      }
    } catch (err) {
      console.error(err);
      login("driver", { name: email.split("@")[0] || "Driver User", email });
      router.push("/onboarding");
      return;
    }
    
    router.push("/");
  };

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({ 
        provider, 
        options: { redirectTo: `${window.location.origin}/auth/callback` } 
      });
      if (error) throw error;
    } catch (err: any) {
      console.error(err);
      toast.error("Social login failed: " + err.message);
    }
  };

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative">
      <div className="absolute inset-0 bg-[#0a0a0a] -z-10" />
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#0066FF 1px, transparent 1px), linear-gradient(90deg, #0066FF 1px, transparent 1px)', backgroundSize: '40px 40px', backgroundPosition: 'center center' }} />

      <div className="w-full max-w-sm bg-muted/60 p-8 rounded-2xl border border-border/50 shadow-2xl backdrop-blur-md relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-8 text-center">
          <ShieldCheck className="w-12 h-12 text-primary mx-auto mb-3 drop-shadow-[0_0_15px_rgba(0,102,255,0.6)]" />
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Welcome Back</h1>
          <p className="text-sm text-muted-foreground mt-2 font-medium">Log in to Quick Park</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && <div className="text-red-500 text-sm font-bold text-center bg-red-500/10 py-2 rounded-md border border-red-500/20 shadow-sm">{error}</div>}
          <div className="space-y-2">
            <Input 
              type="text" 
              placeholder="Email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
              className="bg-background h-12 font-medium"
            />
          </div>
          <div className="space-y-2">
            <Input 
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              className="bg-background h-12 font-medium"
            />
          </div>
          
          <div className="text-right text-xs">
            <a href="#" className="font-bold text-primary hover:underline transition-all">Forgot Password?</a>
          </div>

          <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary/90 text-md font-bold shadow-[0_4px_20px_rgba(0,102,255,0.4)] transition-all">
            Log In
          </Button>
        </form>

        <div className="mt-8 mb-6 relative flex items-center justify-center">
          <div className="w-full border-t border-border absolute left-0"></div>
          <span className="bg-muted px-3 text-xs text-muted-foreground relative z-10 font-bold tracking-wider uppercase">Or continue with</span>
        </div>

        <div className="space-y-3">
          <Button type="button" onClick={() => handleSocialLogin('apple')} variant="outline" className="w-full h-12 border-border/50 hover:bg-background/50 text-sm font-bold tracking-wide transition-all">
            Continue with Apple
          </Button>
          <Button type="button" onClick={() => handleSocialLogin('google')} variant="outline" className="w-full h-12 border-border/50 hover:bg-background/50 text-sm font-bold tracking-wide transition-all">
            Continue with Google
          </Button>
        </div>

        <p className="text-center text-sm mt-8 text-muted-foreground font-medium">
          Don't have an account? <Link href="/signup" className="text-primary font-bold hover:underline transition-all">Sign up.</Link>
        </p>
      </div>
    </main>
  );
}
