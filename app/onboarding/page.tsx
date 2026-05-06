"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Phone, CheckCircle2, User as UserIcon, Car, Home, MapPin } from "lucide-react";
import { toast } from "sonner";

export default function OnboardingPage() {
  const { userInfo, login } = useAppContext();
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<"driver" | "owner" | null>(null);

  const [name, setName] = useState(userInfo?.name || "");
  const [phone, setPhone] = useState("");
  const [carNumber, setCarNumber] = useState("");
  const [propertyAddress, setPropertyAddress] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRoleSelect = (selectedRole: "driver" | "owner") => {
    setRole(selectedRole);
    setStep(2);
  };

  const extractGeolocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPropertyAddress(`${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`);
      },
      (geoErr) => {
        console.error(geoErr);
        toast.error("Failed to extract location. Please type it manually.");
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setError("Please enter a valid phone number.");
      return;
    }
    setError("");
    setIsLoading(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user || !user.id || !user.email) {
        toast.error("Your session has expired or is invalid. Please log in again.");
        setIsLoading(false);
        return;
      }

      const { error: sbErr } = await supabase.from('users').upsert({
        id: user.id, 
        email: user.email, 
        name: name || user.user_metadata?.full_name || "User",
        phone_number: phone,
        role: role,
        car_number: role === 'driver' ? carNumber : null 
      }, { onConflict: 'email' });

      if (sbErr) {
        throw sbErr;
      }

      // Update local context
      const userState = { 
        id: user.id, 
        name: name || user.user_metadata?.full_name || "User", 
        email: user.email, 
        phone, 
        car_number: carNumber 
      };
      
      login(role as "driver" | "owner", userState);
      
      // Cache Busting: Hard window redirect to force server state wipe
      if (role === 'driver') {
        window.location.href = '/';
      } else {
        window.location.href = '/profile';
      }
      
    } catch (err: any) {
      console.error("RAW DB ERROR:", JSON.stringify(err, null, 2));
      const errorMessage = err?.message || err?.details || JSON.stringify(err) || "Failed to save profile. Check browser console.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex flex-col p-6 relative">
      <div className="absolute inset-0 bg-primary/5 -z-10" />
      
      <div className="flex-1 flex flex-col max-w-md w-full mx-auto justify-center mt-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
        
        {step === 1 ? (
          <div className="text-center space-y-6">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2">
              <UserIcon className="text-primary w-8 h-8" />
            </div>
            
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">How do you want to use Quick Park?</h1>
            <p className="text-muted-foreground font-medium mb-8">Select your primary role to customize your setup experience.</p>
            
            <div className="space-y-4">
              <div 
                onClick={() => handleRoleSelect("driver")}
                className="group cursor-pointer border border-border/80 bg-card hover:bg-primary/5 hover:border-primary/50 transition-all rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center space-y-3"
              >
                <Car className="w-10 h-10 text-primary group-hover:scale-110 transition-transform duration-300" />
                <div>
                  <h3 className="font-bold text-xl text-foreground">I need parking</h3>
                  <p className="text-sm text-muted-foreground mt-1">Book spots and setup your vehicle</p>
                </div>
              </div>

              <div 
                onClick={() => handleRoleSelect("owner")}
                className="group cursor-pointer border border-border/80 bg-card hover:bg-primary/5 hover:border-primary/50 transition-all rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center space-y-3"
              >
                <Home className="w-10 h-10 text-primary group-hover:scale-110 transition-transform duration-300" />
                <div>
                  <h3 className="font-bold text-xl text-foreground">I have a space to rent</h3>
                  <p className="text-sm text-muted-foreground mt-1">List your spot and earn money</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500">
             <Button variant="ghost" className="mb-4 text-muted-foreground font-bold hover:text-foreground" onClick={() => setStep(1)}>
               &larr; Back to Role Selection
             </Button>
             
             <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-6">
               <Phone className="text-primary w-6 h-6" />
             </div>
             
             <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-3">Complete Profile</h1>
             <p className="text-muted-foreground font-medium mb-8">
               {role === 'driver' ? "Enter your core driver credentials to enable booking capabilities." : "Enter your homeowner details and mapping context to activate hosting."}
             </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && <div className="text-red-500 text-sm font-bold bg-red-500/10 p-3 rounded-lg border border-red-500/20">{error}</div>}
              
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Full Name</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input 
                    type="text" 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Your Name" 
                    required 
                    className="pl-10 h-12 bg-background text-md font-medium shadow-sm transition-all focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Phone Number</Label>
                <div className="flex gap-2">
                  <div className="h-12 bg-muted border border-border rounded-md px-3 flex items-center justify-center font-bold text-muted-foreground">
                    +91
                  </div>
                  <Input 
                    type="tel" 
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="10-digit mobile number" 
                    required 
                    maxLength={10}
                    className="flex-1 h-12 bg-background text-md font-mono tracking-wider shadow-sm transition-all focus:border-primary"
                  />
                </div>
              </div>

              {role === 'driver' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-left-4 duration-500">
                  <Label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Vehicle Registration</Label>
                  <Input 
                    type="text" 
                    value={carNumber}
                    onChange={e => setCarNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. MH 01 AB 1234" 
                    required 
                    className="h-12 bg-background text-md uppercase font-mono shadow-sm transition-all focus:border-primary"
                  />
                  <p className="text-[10px] text-muted-foreground font-medium">Mandatory verification required by standard homeowners.</p>
                </div>
              )}

              {role === 'owner' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-left-4 duration-500">
                  <Label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Property Address / Geolocation</Label>
                  <div className="flex flex-col gap-2">
                    <Input 
                      type="text" 
                      value={propertyAddress}
                      onChange={e => setPropertyAddress(e.target.value)}
                      placeholder="Type address or use Location pointer" 
                      required 
                      className="h-12 bg-background text-md shadow-sm transition-all focus:border-primary"
                    />
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={extractGeolocation}
                      className="h-10 text-sm font-bold bg-primary/5 border-primary/20 hover:bg-primary/10 text-primary w-full flex items-center gap-2"
                    >
                      <MapPin size={16} /> Use Current Location
                    </Button>
                  </div>
                </div>
              )}

              <Button 
                disabled={isLoading}
                type="submit" 
                className="w-full h-14 bg-primary hover:bg-primary/90 text-lg font-bold shadow-md shadow-primary/20 transition-all mt-6"
              >
                {isLoading ? "Saving..." : <span className="flex items-center gap-2">Complete Provisioning <CheckCircle2 size={20} /></span>}
              </Button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
