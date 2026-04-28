"use client";

import { Booking } from "@/context/AppContext";
import { ParkingSpot } from "@/lib/mockData";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, QrCode, MapPin } from "lucide-react";

export function SuccessTicket({
  booking,
  spot,
  open,
  onOpenChange
}: {
  booking: Booking | null;
  spot: ParkingSpot | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!booking || !spot) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md text-center max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="text-green-500 w-16 h-16" />
          </div>
          <DialogTitle className="text-2xl font-bold text-center">Booking Confirmed!</DialogTitle>
          <DialogDescription className="text-center pb-2">
            Your spot at {spot.name} is reserved.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-card border border-border rounded-xl p-6 relative overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
          
          <div className="text-left space-y-4 mb-6">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Booking ID</p>
              <p className="font-mono font-bold text-foreground bg-muted inline-block px-2 py-1 rounded">{booking.id}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Date & Time</p>
                <p className="font-medium text-foreground">{new Date(booking.date).toLocaleDateString()} {new Date(booking.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Duration</p>
                <p className="font-medium text-foreground">{booking.durationHours} Hours</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Vehicle</p>
              <p className="font-medium text-foreground">{booking.vehicleType}</p>
            </div>

            <div className="border-t border-border pt-4 mt-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Paid</p>
              <p className="font-bold text-3xl text-primary">₹{booking.total.toFixed(2)}</p>
            </div>
          </div>

          <div className="pt-6 border-t border-border border-dashed flex flex-col items-center justify-center">
            <div className="bg-white p-2 rounded-md">
              <QrCode className="w-32 h-32 text-black" strokeWidth={1.5} />
            </div>
            <p className="text-xs text-muted-foreground mt-4 mb-5">Scan at the gate to enter</p>
            
            <Button 
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 shadow-[0_4px_20px_rgba(0,102,255,0.4)] transition-all"
              onClick={() => {
                const lat = spot?.coordinates?.lat || 0;
                const lng = spot?.coordinates?.lng || 0;
                window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
              }}
            >
              <MapPin className="mr-2 h-5 w-5" /> Navigate to Spot
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
