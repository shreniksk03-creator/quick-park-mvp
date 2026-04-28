"use client";

import { useState } from "react";
import { ParkingSpot } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { useAppContext } from "@/context/AppContext";
import { ShieldCheck, Car } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export function SpotDetailModal({
  spot,
  open,
  onOpenChange,
  onBookingComplete
}: {
  spot: ParkingSpot | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBookingComplete: (bookingId: string) => void;
}) {
  const { addBooking, userInfo } = useAppContext();
  const [vehicleType, setVehicleType] = useState<"Car" | "Bike">("Car");
  const [duration, setDuration] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imgError, setImgError] = useState(false);

  if (!spot) return null;

  const hours = typeof duration === 'number' && !isNaN(duration) ? duration : 1;
  const safeHourlyRate = typeof spot.basePricePerHour === 'number' && !isNaN(spot.basePricePerHour) ? spot.basePricePerHour : 0;
  
  const baseCost = safeHourlyRate * hours;
  const fee = baseCost * 0.15;
  const total = baseCost + fee;

  const handlePay = async () => {
    if (!userInfo?.id) {
      toast.error("Missing active Driver ID! Please log out and back in natively.");
      return;
    }
    
    setIsProcessing(true);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parkingSpaceId: spot.id,
          amount: total,
          driverId: userInfo.id,
          ownerId: spot.ownerId,
          spotName: spot.name,
          hours: hours
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err: any) {
      console.error("Booking Error:", err.message || err);
      toast.error(err.message || "Payment failed. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
          />
          
          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-[70] bg-background rounded-t-3xl border-t border-border shadow-[0_-10px_40px_rgba(0,0,0,0.3)] max-h-[90vh] flex flex-col"
          >
            <div className="w-12 h-1.5 bg-gray-600 rounded-full mx-auto mt-3 mb-2 shrink-0" />
            
            <div className="overflow-y-auto px-6 pb-8 pt-2">
              <div>
                <h2 className="text-2xl font-bold">{spot.name}</h2>
                <div className="flex items-center gap-1.5 text-green-500 font-bold text-sm mt-1">
                  <ShieldCheck size={16} className="fill-green-500/20" /> Verified Homeowner
                </div>
                <p className="mt-1 text-muted-foreground">{spot.address}</p>
              </div>

              <div className="space-y-6 mt-4">
                {!spot.image || imgError ? (
                  <div className="w-full h-48 bg-gray-800 flex items-center justify-center rounded-md border border-border">
                    <Car size={48} className="text-gray-600" />
                  </div>
                ) : (
                  <img 
                    src={spot.image} 
                    className="w-full h-48 object-cover rounded-md border border-border shadow-sm" 
                    alt={spot.name} 
                    onError={() => setImgError(true)}
                  />
                )}

                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Vehicle Type</h4>
                  <div className="flex gap-4">
                    <Button 
                      variant={vehicleType === "Car" ? "default" : "outline"} 
                      className={`flex-1 h-12 text-md transition-all ${vehicleType === "Car" ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20" : ""}`}
                      onClick={() => setVehicleType("Car")}
                    >
                      Car
                    </Button>
                    <Button 
                      variant={vehicleType === "Bike" ? "default" : "outline"} 
                      className={`flex-1 h-12 text-md transition-all ${vehicleType === "Bike" ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20" : ""}`}
                      onClick={() => setVehicleType("Bike")}
                    >
                      Bike
                    </Button>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Duration</h4>
                    <span className="font-bold text-xl">{hours} {hours === 1 ? 'Hour' : 'Hours'}</span>
                  </div>
                  
                  <input 
                    type="range"
                    max="12" 
                    min="1" 
                    step="1" 
                    value={hours} 
                    onChange={(e) => setDuration(parseInt(e.target.value, 10) || 1)} 
                    className="w-full accent-primary py-4 cursor-pointer"
                  />
                </div>

                <div className="bg-muted p-5 rounded-xl space-y-3 mt-4 border border-border transition-all">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Pricing Engine</h4>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-muted-foreground">Base Cost ({hours}h × ₹{safeHourlyRate.toFixed(2)})</span>
                    <span className="font-medium text-foreground">₹{baseCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-muted-foreground">Quick Park Fee (15%)</span>
                    <span className="font-medium text-foreground">₹{fee.toFixed(2)}</span>
                  </div>
                  
                  <div className="border-t border-border pt-4 mt-4 flex justify-between items-center bg-background/50 -mx-3 -mb-3 p-3 rounded-b-xl">
                    <span className="font-bold text-foreground tracking-wide">Final Total</span>
                    <span className="font-bold text-2xl text-primary drop-shadow-[0_0_8px_rgba(0,102,255,0.4)]">₹{total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="mt-8 pt-2">
                  <Button disabled={isProcessing} size="lg" className="w-full text-lg h-16 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-xl font-bold tracking-wide transition-all" onClick={handlePay}>
                    {isProcessing ? "Confirming..." : `Confirm Booking (₹${total.toFixed(2)})`}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
