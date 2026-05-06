"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Scanner } from "@yudiel/react-qr-scanner";
import { CheckCircle2, XCircle, Scan, Car } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export function QRScannerModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [scanResult, setScanResult] = useState<"success" | "error" | null>(null);
  const [bookingData, setBookingData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleScan = async (detectedCodes: any[]) => {
    if (isProcessing || scanResult || !detectedCodes || detectedCodes.length === 0) return;
    
    const result = detectedCodes[0]?.rawValue?.trim();
    if (!result) return;

    setIsProcessing(true);

    try {
      // Validate booking directly from Supabase
      const { data, error } = await supabase
        .from("bookings")
        .select("*, driver:users!bookings_driver_id_fkey(name, car_number)")
        .eq("id", result)
        .single();

      if (error || !data) {
        setScanResult("error");
        setIsProcessing(false);
        return;
      }

      if (data.status === "paid") {
        const { error: updateError } = await supabase
          .from("bookings")
          .update({ status: 'active', started_at: new Date().toISOString() })
          .eq("id", result);
          
        if (updateError) throw updateError;
        
        setBookingData(data);
        setScanResult("success");
      } else if (data.status === "active" || data.status === "overstay") {
        setBookingData(data);
        setScanResult("success");
      } else {
        setScanResult("error");
      }
    } catch (err) {
      console.error("Scan validation error:", err);
      setScanResult("error");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setBookingData(null);
    setIsProcessing(false);
  };

  const handleClose = () => {
    resetScanner();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) handleClose(); else onOpenChange(val); }}>
      <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-md overflow-hidden p-0 border-border">
        {/* Visually hidden titles for screen readers */}
        <div className="sr-only">
          <DialogTitle>Scan Vehicle QR</DialogTitle>
          <DialogDescription>Use your camera to scan a booking QR code</DialogDescription>
        </div>

        {!scanResult ? (
          <div className="relative h-[80vh] sm:h-[60vh] w-full bg-black flex flex-col">
            <div className="absolute top-0 left-0 right-0 p-4 z-10 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
              <h2 className="text-white font-bold flex items-center gap-2"><Scan size={20} /> Scan Vehicle</h2>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full" onClick={handleClose}>
                ✕
              </Button>
            </div>
            
            <div className="flex-1 w-full h-full relative overflow-hidden flex items-center justify-center">
              {isProcessing && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm flex-col">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary mb-4"></div>
                  <p className="text-white font-bold text-lg animate-pulse">Validating Securely...</p>
                </div>
              )}
              
              <Scanner 
                onScan={handleScan}
                onError={(error) => console.error("QR Scan Error:", error)}
                formats={["qr_code"]}
                scanDelay={100}
                styles={{ container: { width: "100%", height: "100%" } }}
                components={{ finder: true }}
              />
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-6 z-10 bg-gradient-to-t from-black via-black/80 to-transparent text-center">
              <p className="text-white/80 text-sm font-medium">Align the QR code within the frame.</p>
            </div>
          </div>
        ) : (
          <div className={`flex flex-col items-center justify-center p-8 h-[80vh] sm:h-[60vh] ${scanResult === 'success' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
            {scanResult === 'success' ? (
              <div className="text-center animate-in zoom-in-95 duration-500 flex flex-col items-center">
                <div className="w-32 h-32 bg-green-500/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(34,197,94,0.3)]">
                  <CheckCircle2 size={80} className="text-green-500" />
                </div>
                <h2 className="text-3xl font-black text-foreground mb-2 tracking-tight">Valid Booking!</h2>
                <h3 className="text-xl font-bold text-green-500 mb-6 uppercase tracking-wider">Let Them In</h3>
                
                <div className="bg-card border border-border p-5 rounded-2xl w-full mb-8 shadow-sm text-left relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-green-500" />
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-1">Driver Name</p>
                  <p className="font-bold text-lg mb-3">{bookingData?.driver?.name || 'Unknown Driver'}</p>
                  
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-1 flex items-center gap-1"><Car size={12}/> License Plate</p>
                  <p className="font-black text-xl text-primary tracking-widest">{bookingData?.driver?.car_number || 'UNKNOWN'}</p>
                </div>
              </div>
            ) : (
              <div className="text-center animate-in zoom-in-95 duration-500 flex flex-col items-center">
                <div className="w-32 h-32 bg-red-500/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(239,68,68,0.3)]">
                  <XCircle size={80} className="text-red-500" />
                </div>
                <h2 className="text-3xl font-black text-foreground mb-2 tracking-tight">Invalid/Expired</h2>
                <h3 className="text-lg font-bold text-red-500 mb-6 uppercase tracking-wider">Do Not Let Them In</h3>
                <p className="text-muted-foreground mb-8">This QR code does not correspond to an active or valid booking in our system.</p>
              </div>
            )}

            <div className="flex gap-4 w-full mt-auto">
              <Button size="lg" className="flex-1 font-bold h-14" variant="outline" onClick={handleClose}>Close</Button>
              <Button size="lg" className="flex-1 font-bold h-14 bg-primary hover:bg-primary/90 text-white" onClick={resetScanner}>Scan Next</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
