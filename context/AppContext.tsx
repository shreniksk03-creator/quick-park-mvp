"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ParkingSpot, MOCK_SPOTS } from "../lib/mockData";

export type UserRole = "driver" | "owner";

export interface Booking {
  id: string;
  spotId: string;
  vehicleType: "Car" | "Bike";
  durationHours: number;
  baseCost: number;
  fee: number;
  total: number;
  date: string;
}

export interface UserInfo {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  car_number?: string;
}

interface AppContextType {
  role: UserRole;
  toggleRole: () => void;
  setRole: (role: UserRole) => void;
  spots: ParkingSpot[];
  addSpot: (spot: ParkingSpot) => void;
  removeSpot: (spotId: string) => void;
  bookings: Booking[];
  addBooking: (booking: Booking) => void;
  previousDues: number;
  setPreviousDues: (amount: number) => void;
  addOverstayReport: (report: any) => void;
  isAuthenticated: boolean;
  userInfo: UserInfo | null;
  login: (asRole?: UserRole, user?: UserInfo) => void;
  logout: () => void;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [role, setRole] = useState<UserRole>("driver");
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [previousDues, setPreviousDues] = useState<number>(0);
  const [isLoading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Rehydrate role from localStorage on mount
    const savedRole = localStorage.getItem("quickpark_role") as UserRole;
    if (savedRole && (savedRole === "driver" || savedRole === "owner")) {
      setRole(savedRole);
    }
  }, []);

  useEffect(() => {
    const fetchSpaces = async () => {
      if (!supabase) {
        console.warn("Supabase client is not initialized.");
        setSpots([]);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.from('parking_spaces').select('*');
        if (error) {
          console.error("Map Fetch Error:", error);
          setSpots([]);
        } else if (data && data.length > 0) {
          const liveSpots: ParkingSpot[] = data.map((row: any) => ({
            id: row.id,
            name: row.title,
            address: "Live Extracted Geolocation Data",
            distance: "0.0 km away",
            rating: 5.0,
            basePricePerHour: Number(row.hourly_rate),
            image: row.image_url || "https://images.unsplash.com/photo-1621290649539-44d4407b9a52",
            ownerId: row.owner_id || "owner",
            coordinates: { lat: Number(row.latitude) || 0, lng: Number(row.longitude) || 0 }
          }));
          setSpots(liveSpots);
        } else {
          setSpots([]);
        }
      } catch (error) {
        console.error("Map Fetch Error:", error);
        setSpots([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSpaces();
  }, []);

  const toggleRole = () => setRole((prev) => {
    const newRole = prev === "driver" ? "owner" : "driver";
    localStorage.setItem("quickpark_role", newRole);
    return newRole;
  });
  
  const addOverstayReport = (report: any) => {
    console.log("Overstay Reported:", report);
  };
  
  const login = (asRole?: UserRole, user?: UserInfo) => {
    setIsAuthenticated(true);
    if (asRole) setRole(asRole);
    if (user) {
      setUserInfo(user);
    } else {
      setUserInfo({ name: "Demo User", email: "demo@quickpark.com" });
    }
  };
  
  const logout = () => {
    setIsAuthenticated(false);
    setRole("driver");
    setUserInfo(null);
  };

  const addSpot = (spot: ParkingSpot) => setSpots((prev) => [...prev, spot]);
  const removeSpot = (spotId: string) => setSpots((prev) => prev.filter(s => s.id !== spotId));
  const addBooking = (booking: Booking) => setBookings((prev) => [...prev, booking]);

  return (
    <AppContext.Provider value={{ role, toggleRole, setRole, spots, addSpot, removeSpot, bookings, addBooking, isAuthenticated, userInfo, login, logout, previousDues, setPreviousDues, addOverstayReport, isLoading }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
