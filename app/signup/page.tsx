"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useAppContext, UserRole } from "@/context/AppContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Car, Home } from "lucide-react";
import { toast } from "sonner";

export default function SignupPage() {
  const { login } = useAppContext();
  const router = useRouter();
  
  const [selectedRole, setSelectedRole] = useState<UserRole>("driver");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [carNumber, setCarNumber] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('users')
        .insert([
          { 
            name, 
            email, 
            role: selectedRole,
            phone_number: phone,
            car_number: selectedRole === "driver" ? carNumber : null 
          }
        ])
        .select();

      if (error) {
        console.error("Supabase Error:", error);
        toast.error("Account Creation Failed: " + error.message);
        setIsSubmitting(false);
        return;
      }

      const userRecord = data[0];
      login(selectedRole, { id: userRecord.id, name, email, phone: userRecord.phone_number, car_number: userRecord.car_number });
      
      if (selectedRole === "driver") {
        router.push("/");
      } else {
        router.push("/profile");
      }
    } catch (err) {
      console.error("Unexpected Error", err);
      setIsSubmitting(false);
    }
  };

  const handleSocialSignup = async (provider: 'google' | 'apple') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({ 
        provider, 
        options: { redirectTo: `${window.location.origin}/auth/callback` } 
      });
      if (error) throw error;
    } catch (err: any) {
      console.error(err);
      toast.error("Social signup failed: " + err.message);
    }
  };

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center py-10 px-6 relative">
      <div className="absolute inset-0 bg-[#0a0a0a] -z-10" />
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#0066FF 1px, transparent 1px), linear-gradient(90deg, #0066FF 1px, transparent 1px)', backgroundSize: '40px 40px', backgroundPosition: 'center center' }} />

      <div className="w-full max-w-sm bg-muted/60 p-8 rounded-2xl border border-border/50 shadow-2xl backdrop-blur-md relative z-10 my-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-6 text-center">
          <ShieldCheck className="w-10 h-10 text-primary mx-auto mb-2 drop-shadow-[0_0_15px_rgba(0,102,255,0.6)]" />
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground leading-tight">Join Quick Park.<br/>Find a spot or share yours.</h1>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div 
              onClick={() => setSelectedRole("driver")}
              className={`border-2 rounded-xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${selectedRole === "driver" ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(0,102,255,0.2)]" : "border-border/60 hover:border-border hover:bg-background/50"}`}
            >
              <Car className={`w-8 h-8 mb-2 ${selectedRole === "driver" ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`text-xs font-bold leading-tight ${selectedRole === "driver" ? "text-primary" : "text-muted-foreground"}`}>I need parking</span>
            </div>
            
            <div 
              onClick={() => setSelectedRole("owner")}
              className={`border-2 rounded-xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${selectedRole === "owner" ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(0,102,255,0.2)]" : "border-border/60 hover:border-border hover:bg-background/50"}`}
            >
              <Home className={`w-8 h-8 mb-2 ${selectedRole === "owner" ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`text-xs font-bold leading-tight ${selectedRole === "owner" ? "text-primary" : "text-muted-foreground"}`}>I have a space to rent</span>
            </div>
          </div>

          <Input required placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} className="bg-background h-11 font-medium" />
          <Input required type="tel" placeholder="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} className="bg-background h-11 font-medium" />
          <Input required type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="bg-background h-11 font-medium" />
          
          {selectedRole === "driver" && (
            <Input required placeholder="Vehicle Registration No. (e.g. KA-01-AB-1234)" value={carNumber} onChange={e => setCarNumber(e.target.value.toUpperCase())} className="bg-background h-11 font-medium" />
          )}

          <Input required type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="bg-background h-11 font-medium" />

          <Button disabled={isSubmitting} type="submit" className="w-full mt-2 h-12 bg-primary hover:bg-primary/90 text-md font-bold shadow-[0_4px_20px_rgba(0,102,255,0.4)] transition-all">
            {isSubmitting ? "Generating Account..." : "Create Account"}
          </Button>
        </form>

        <div className="mt-6 mb-5 relative flex items-center justify-center">
          <div className="w-full border-t border-border absolute left-0"></div>
          <span className="bg-muted px-3 text-[10px] text-muted-foreground relative z-10 font-bold tracking-wider uppercase">Or sign up with</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button type="button" onClick={() => handleSocialSignup('apple')} variant="outline" className="w-full h-11 border-border/50 hover:bg-background/50 text-xs font-bold transition-all">Apple</Button>
          <Button type="button" onClick={() => handleSocialSignup('google')} variant="outline" className="w-full h-11 border-border/50 hover:bg-background/50 text-xs font-bold transition-all">Google</Button>
        </div>
        
        <p className="text-center text-xs mt-6 text-muted-foreground font-medium">
          Already have an account? <Link href="/login" className="text-primary font-bold hover:underline transition-all">Log in.</Link>
        </p>

      </div>
    </main>
  );
}
