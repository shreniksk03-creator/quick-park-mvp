"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MapRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Map view now lives natively on the home route (/)
    router.replace("/?view=map");
  }, [router]);

  return (
    <div className="h-screen w-full bg-background flex flex-col items-center justify-center">
      <div className="text-primary text-sm font-bold uppercase tracking-widest animate-pulse">Loading Map...</div>
    </div>
  );
}
