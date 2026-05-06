"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { supabase } from "@/lib/supabaseClient";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, role, login } = useAppContext();
  const router = useRouter();
  const pathname = usePathname();
  const [isVerifying, setIsVerifying] = useState(true);

  const [isProfileIncomplete, setIsProfileIncomplete] = useState(false);

  useEffect(() => {
    // Clear residual Supabase PKCE hash fragments to prevent Next.js client-side loops
    if (typeof window !== "undefined" && window.location.hash) {
      if (window.location.hash.includes("error=") || window.location.hash.includes("access_token=")) {
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    }

    let mounted = true;

    const checkSession = async (session: any) => {
      if (!session) {
        if (mounted) setIsVerifying(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from("users")
          .select("phone_number, role, name, email, car_number, id")
          .eq("id", session.user.id)
          .single();

        if (error || !data || !data.phone_number || !data.role) {
          console.error("Auth Guard check: Missing or incomplete user profile. Redirecting to onboarding.", error);
          if (mounted) setIsProfileIncomplete(true);
          
          login("driver", { 
            id: session.user.id, 
            name: session.user.user_metadata?.full_name || "User", 
            email: session.user.email 
          });
          
          if (pathname !== "/onboarding") {
            router.push("/onboarding");
          }
          return;
        }

        if (mounted) setIsProfileIncomplete(false);

        // Successfully found complete profile
        login(data.role as any, { 
          id: data.id, 
          name: data.name, 
          email: data.email, 
          phone: data.phone_number, 
          car_number: data.car_number 
        });
        
        // Explicitly allow routing. If stuck on auth or onboarding screens, redirect out:
        if (pathname === "/login" || pathname === "/signup" || pathname === "/onboarding") {
           router.push(data.role === "owner" ? "/owner-dashboard" : "/");
        }

      } catch (err) {
        console.error("Auth Guard checking session failed:", err);
      } finally {
        if (mounted) setIsVerifying(false);
      }
    };

    const initAuth = async () => {
      // 2000ms hard-stop fail-safe timeout
      const timeoutId = setTimeout(() => {
        if (mounted) {
          console.warn("Auth check timed out! Forcing UI unfreeze.");
          setIsVerifying(false);
        }
      }, 2000);

      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        await checkSession(session);
      } catch (err) {
        console.error("Error getting session:", err);
        if (mounted) setIsVerifying(false);
      } finally {
        clearTimeout(timeoutId);
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED") return;
      checkSession(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [login, pathname, router]);

  useEffect(() => {
    if (isVerifying) return;

    if (isProfileIncomplete && pathname !== "/onboarding") {
      router.replace("/onboarding");
      return;
    }

    if (!isAuthenticated && pathname !== "/login" && pathname !== "/signup" && pathname !== "/onboarding") {
      router.replace("/login");
    } else if (isAuthenticated && !isProfileIncomplete) {
      if (role === "owner" && (pathname === "/" || pathname === "/map")) {
        router.replace("/owner-dashboard");
      } else if (role === "driver" && (pathname === "/owner-dashboard" || pathname === "/owner-transactions")) {
        router.replace("/");
      }
    }
  }, [isVerifying, isAuthenticated, role, pathname, router, isProfileIncomplete]);

  if (isVerifying) {
    if (pathname === "/login" || pathname === "/signup") {
       return <div className="h-screen w-full bg-background flex flex-col items-center justify-center text-primary font-bold"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>Verifying profile...</div>;
    }
    return <div className="h-screen w-full bg-background flex flex-col items-center justify-center text-primary font-bold">Verifying Session...</div>;
  }

  if (isProfileIncomplete && pathname !== "/onboarding") {
    return null; // Block rendering children while redirecting to onboarding
  }

  // If not authenticated and trying to access protected route
  if (!isAuthenticated && pathname !== "/login" && pathname !== "/signup" && pathname !== "/onboarding") {
    return null; // The useEffect will handle the redirect
  }

  return <>{children}</>;
}
