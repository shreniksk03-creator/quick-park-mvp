"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/navigation/BottomNav";

export function ClientLayout() {
  const pathname = usePathname();
  const isAuthRoute = pathname === "/login" || pathname === "/signup";

  return !isAuthRoute ? <BottomNav /> : null;
}
