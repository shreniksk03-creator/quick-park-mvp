"use client";

import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { Home, Bookmark, Map as MapIcon, User, Wallet } from "lucide-react";
import { useAppContext } from "@/context/AppContext";

export function BottomNav() {
  const pathname = usePathname();
  const { role } = useAppContext();

  const searchParams = useSearchParams();
  const router = useRouter();
  const viewParam = searchParams.get("view");

  const navItems = role === "owner" 
    ? [
        { label: "Home", href: "/owner-dashboard", icon: Home },
        { label: "Bookings", href: "/bookings", icon: Bookmark },
        { label: "Transactions", href: "/owner-transactions", icon: Wallet },
        { label: "Profile", href: "/profile", icon: User },
      ]
    : [
        { label: "Home", href: "/", icon: Home },
        { label: "Bookings", href: "/bookings", icon: Bookmark },
        { label: "Map", href: "/map", icon: MapIcon },
        { label: "Profile", href: "/profile", icon: User },
      ];

  return (
    <nav className="fixed bottom-0 w-full bg-background border-t border-border pb-safe z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          
          let isActive = false;
          if (item.label === "Map") {
            isActive = viewParam === "map" || pathname === "/map";
          } else if (item.label === "Home" && role === "driver") {
            isActive = pathname === "/" && viewParam !== "map";
          } else {
            isActive = pathname === item.href;
          }

          return (
            <button
              key={item.label}
              onClick={() => router.push(item.href)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
              }`}
            >
              <Icon size={24} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
