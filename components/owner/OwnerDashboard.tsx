"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAppContext } from "@/context/AppContext";
import { AddSpaceForm } from "./AddSpaceForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { PlusCircle, Wallet, Car, AlertTriangle, Camera, Trash2, ScanLine } from "lucide-react";
import { toast } from "sonner";
import { QRScannerModal } from "./QRScannerModal";

function ActiveBookingCard({ b, onReport }: { b: any, onReport: () => void }) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!b.started_at) return;
    const durationMs = b.duration_hours * 3600000;
    const endTime = new Date(b.started_at).getTime() + durationMs;
    
    const updateTimer = () => {
      const diff = endTime - Date.now();
      setRemaining(diff <= 0 ? 0 : Math.floor(diff / 1000));
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [b.started_at, b.duration_hours]);

  const isWarning = remaining !== null && remaining > 0 && remaining <= 300;
  const isOverstay = remaining === 0;

  return (
    <div className={`bg-card border p-4 rounded-xl flex gap-4 items-center shadow-sm transition-all ${isWarning ? 'animate-pulse border-red-500 shadow-red-500/20' : isOverstay ? 'border-red-500 bg-red-500/5' : 'border-border hover:border-red-500/30'}`}>
      <div className={`w-14 h-14 rounded-lg flex items-center justify-center border shrink-0 ${isWarning || isOverstay ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-muted border-border text-muted-foreground'}`}>
        <Car size={24} />
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-sm tracking-wide">{b.carNumber || "Unknown Registration"}</h4>
        <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">Spot: {b.spaceType || b.spaceTitle}</p>
        <div className="text-xs font-bold mt-1 text-primary flex items-center gap-2">
          <span>Duration: {b.duration_hours}h</span>
          {remaining !== null && (
            <span className={`font-mono ${isWarning || isOverstay ? 'text-red-500' : 'text-muted-foreground'}`}>
              ({Math.floor(remaining / 3600).toString().padStart(2, '0')}:{Math.floor((remaining % 3600) / 60).toString().padStart(2, '0')}:{(remaining % 60).toString().padStart(2, '0')} left)
            </span>
          )}
        </div>
      </div>
      <Button onClick={onReport} variant="outline" size="sm" className="border-red-500/50 text-red-500 hover:bg-red-500/10 hover:text-red-600 font-bold px-3">
        Report
      </Button>
    </div>
  );
}

export function OwnerDashboard() {
  const { spots, bookings, addOverstayReport, removeSpot, userInfo } = useAppContext();
  const [showAddForm, setShowAddForm] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [overstayImage, setOverstayImage] = useState<string | null>(null);
  const [activeBookings, setActiveBookings] = useState<any[]>([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  useEffect(() => {
    if (!userInfo?.id) return;
    const fetchActiveBookings = async () => {
      const { data: mySpaces } = await supabase.from('parking_spaces').select('id, title, space_type').eq('owner_id', userInfo.id);
      if (!mySpaces || mySpaces.length === 0) return;
      
      const spaceIds = mySpaces.map((s: any) => s.id);
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`*, users!bookings_driver_id_fkey(car_number)`)
        .in('space_id', spaceIds)
        .eq('status', 'active');

      if (!error && data) {
        const enriched = data.map((b: any) => {
          const s = mySpaces.find((x: any) => x.id === b.space_id);
          return { ...b, spaceTitle: s?.title, spaceType: s?.space_type, carNumber: b.users?.car_number };
        });
        setActiveBookings(enriched);
      }
    };
    fetchActiveBookings();
  }, [userInfo?.id]);

  const handleFileCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setOverstayImage(URL.createObjectURL(file));
  };

  const handleRemoveListing = async (spaceId: string) => {
    const isConfirmed = window.confirm("Are you sure you want to remove this listing? Drivers will no longer be able to book it.");
    if (!isConfirmed) return;

    const { error } = await supabase
      .from('parking_spaces')
      .update({ is_active: false })
      .eq('id', spaceId);

    if (error) {
      console.error("Failed to remove listing:", error);
      toast.error("Failed to remove listing. " + error.message);
      return;
    }

    removeSpot(spaceId);
    toast.success("Listing removed successfully.");
  };

  // Math: 15% Platform fee deducted from total earnings
  const grossEarnings = bookings.reduce((sum, b) => sum + b.total, 0);
  const platformFee = grossEarnings * 0.15;
  const netEarnings = grossEarnings - platformFee;

  const mySpots = spots.filter(s => s.ownerId === userInfo?.id);

  return (
    <div className="space-y-6">
      <div className="mb-2">
        <h2 className="text-2xl font-extrabold flex items-center gap-2">Homeowner Dashboard</h2>
        <p className="text-muted-foreground text-sm font-medium mt-1">Earn money from your empty home parking space.</p>
      </div>

      <Button 
        className="w-full h-20 text-xl font-black tracking-wide shadow-[0_10px_30px_rgba(0,102,255,0.4)] hover:shadow-[0_15px_40px_rgba(0,102,255,0.6)] hover:-translate-y-1 transition-all rounded-2xl border-b-4 border-primary-foreground/20 active:translate-y-0 active:border-b-0"
        onClick={() => setIsScannerOpen(true)}
      >
        <ScanLine className="mr-3" size={28} />
        SCAN VEHICLE QR
      </Button>

      <div className="grid grid-cols-1 gap-4 mt-2">
        <Card className="bg-primary/10 border-primary/20 shadow-lg shadow-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
              <Wallet size={16} /> Total Net Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-foreground mb-2 drop-shadow-sm">₹{netEarnings.toFixed(2)}</div>
            <div className="flex flex-col gap-1 mt-3 pt-3 border-t border-primary/20">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground font-medium">Gross Bookings</span>
                <span className="font-bold">₹{grossEarnings.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-destructive font-medium">Platform Fee (15%)</span>
                <span className="font-bold text-destructive">-₹{platformFee.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {activeBookings.length > 0 && (
        <div className="mt-8 space-y-4 animate-in fade-in duration-500">
          <h2 className="text-xl font-bold tracking-tight">Current Parked Vehicles</h2>
          {activeBookings.map((b: any) => (
            <ActiveBookingCard key={b.id} b={b} onReport={() => setReportModalOpen(true)} />
          ))}
        </div>
      )}

      <div className="flex justify-between items-end mt-8">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Active Listings</h2>
          <p className="text-sm text-muted-foreground">{mySpots.length} spaces available</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} size="sm" variant="outline" className="gap-2 border-primary text-primary hover:bg-primary/10 transition-colors">
          <PlusCircle size={16} /> Add Space
        </Button>
      </div>

      {showAddForm && <AddSpaceForm onSuccess={() => setShowAddForm(false)} />}

      <div className="space-y-4 pt-2">
        {mySpots.map(spot => (
          <div key={spot.id} className="bg-card border border-border p-4 rounded-xl flex gap-4 items-center shadow-sm hover:border-primary/50 transition-colors relative group">
            <img src={spot.image} className="w-20 h-20 rounded-lg object-cover border border-border" alt={spot.name} />
            <div className="flex-1 pr-12">
              <h4 className="font-bold flex items-center gap-1.5 leading-tight"><Car size={14} className="text-primary"/> {spot.name}</h4>
              <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{spot.address}</p>
              <p className="text-sm font-extrabold mt-1.5 text-foreground">₹{spot.basePricePerHour.toFixed(2)}/hr</p>
            </div>
            <div className="flex flex-col items-end gap-2 absolute right-4 top-4 bottom-4 justify-between">
              <div className="px-3 py-1 bg-green-500/10 text-green-500 text-xs font-bold rounded-full border border-green-500/20">
                Active
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8 border-red-500/50 text-red-500 hover:bg-red-500/10 hover:text-red-500 transition-colors rounded-full shadow-sm"
                onClick={() => handleRemoveListing(spot.id)}
                title="Remove Listing"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Report Modal */}
      <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>
        <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500 font-extrabold text-xl"><AlertTriangle size={24} /> Report Overstay</DialogTitle>
            <DialogDescription className="font-medium text-muted-foreground pt-1">Please securely upload photo evidence of the vehicle remaining in your spot to automatically claim your penalty fee.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!overstayImage ? (
              <div className="border-2 border-dashed border-border hover:border-primary/50 transition-colors rounded-xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden bg-muted/30 h-48 cursor-pointer group">
                <Camera size={40} className="text-muted-foreground mb-3 group-hover:scale-110 group-hover:text-primary transition-all duration-300" strokeWidth={1.5} />
                <p className="text-sm font-bold text-foreground">Tap to open Camera</p>
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment" 
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  onChange={handleFileCapture}
                />
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden border border-border shadow-[0_0_20px_rgba(0,102,255,0.2)] animate-in zoom-in-95 duration-300">
                <img src={overstayImage} alt="Overstay Evidence" className="w-full h-56 object-cover" />
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-3 backdrop-blur-sm border-t border-white/10">
                  <p className="text-green-400 text-xs font-mono font-bold tracking-wider flex items-center justify-between">
                    <span>GPS SECURE LINK</span>
                    <span>{new Date().toLocaleString([], {day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'})}</span>
                  </p>
                </div>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="absolute top-3 right-3 rounded-full h-8 w-8 p-0 shadow-lg"
                  onClick={() => setOverstayImage(null)}
                >✕</Button>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold h-12 text-md transition-all shadow-[0_4px_20px_rgba(239,68,68,0.4)] disabled:opacity-50 disabled:shadow-none" 
              disabled={!overstayImage}
              onClick={() => {
                addOverstayReport({ date: new Date().toISOString(), status: "submitted" });
                setReportModalOpen(false);
                setOverstayImage(null);
              }}
            >
              Submit Evidence Log
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <QRScannerModal open={isScannerOpen} onOpenChange={setIsScannerOpen} />
    </div>
  );
}
