"use client";

import { CheckCircle2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import QRCode from "react-qr-code";

interface ReceiptModalProps {
  show: boolean;
  onClose: () => void;
  bookingId: string | null;
  bookingData: any;
}

export function ReceiptModal({ show, onClose, bookingId, bookingData }: ReceiptModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-background border border-border w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        <div className="bg-green-500/10 p-5 text-center border-b border-green-500/20 relative">
          <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-green-500/30">
            <CheckCircle2 size={24} />
          </div>
          <h2 className="text-xl font-bold text-green-500">Booking Confirmed!</h2>
          <p className="text-xs text-muted-foreground mt-1">Show this digital receipt to the owner</p>
        </div>
        
        <div className="p-6 flex flex-col items-center">
          <div className="w-48 h-48 bg-white p-3 rounded-xl shadow-inner mb-6 border border-gray-200">
            {bookingId ? (
              <QRCode value={bookingId} size={100} style={{ height: "auto", maxWidth: "100%", width: "100%" }} viewBox={`0 0 256 256`} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">Loading QR...</div>
            )}
          </div>

          {bookingData?.parking_spaces?.latitude && bookingData?.parking_spaces?.longitude && (
            <a 
              href={`https://www.google.com/maps/dir/?api=1&destination=${bookingData.parking_spaces.latitude},${bookingData.parking_spaces.longitude}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-full mb-6 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 shadow-sm border border-blue-500/20 transition-all"
            >
              <MapPin size={18}/> Get Directions
            </a>
          )}

          {bookingData ? (
            <div className="w-full space-y-3">
              <div className="flex justify-between items-center pb-3 border-b border-border/50">
                <span className="text-muted-foreground text-sm font-medium">Booking ID</span>
                <span className="font-mono text-sm font-bold uppercase">{bookingData.id.split('-')[0]}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-border/50">
                <span className="text-muted-foreground text-sm font-medium">Amount Paid</span>
                <span className="font-bold text-primary">₹{Number(bookingData.total_paid).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-border/50">
                <span className="text-muted-foreground text-sm font-medium">Date & Time</span>
                <span className="font-bold text-sm text-right">
                  {new Date(bookingData.start_time).toLocaleDateString()}<br/>
                  {new Date(bookingData.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-muted-foreground text-sm font-medium">Duration</span>
                <span className="font-bold text-sm">{bookingData.duration_hours} Hour{bookingData.duration_hours > 1 ? 's' : ''}</span>
              </div>
            </div>
          ) : (
            <div className="w-full space-y-4 animate-pulse">
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border bg-muted/30">
          <Button onClick={onClose} className="w-full h-12 font-bold text-md rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
            Close & View Bookings
          </Button>
        </div>
      </div>
    </div>
  );
}
