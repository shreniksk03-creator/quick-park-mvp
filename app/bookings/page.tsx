"use client";

import { useEffect, useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Calendar, CheckCircle2, History, Car, User, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function BookingsPage() {
  const { userInfo, role } = useAppContext();
  const [dbBookings, setDbBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!userInfo?.id) return;
    
    const fetchBookings = async () => {
      setIsLoading(true);
      setFetchError(null);
      
      try {
        let res: any = { data: [], error: null };
        
        if (role === 'owner') {
          // Alternative to !inner which might hang: fetch spaces first then IN query
          const { data: spaces, error: spacesErr } = await supabase
            .from('parking_spaces')
            .select('id, title')
            .eq('owner_id', userInfo.id);
            
          if (spacesErr) throw spacesErr;
          
          if (spaces && spaces.length > 0) {
            const spaceIds = spaces.map(s => s.id);
            res = await supabase
              .from('bookings')
              .select('*, driver:users!bookings_driver_id_fkey(name, car_number, phone_number)')
              .in('space_id', spaceIds)
              .order('start_time', { ascending: false });
              
            // Stitch the space title back in format expected by UI
            if (res.data) {
              res.data = res.data.map((b: any) => ({
                ...b,
                parking_spaces: spaces.find(s => s.id === b.space_id)
              }));
            }
          }
        } else {
          res = await supabase
            .from('bookings')
            .select('*, parking_spaces(*, owner:users!owner_id(phone_number))')
            .eq('driver_id', userInfo.id)
            .order('start_time', { ascending: false });
        }
        
        if (res.error) throw res.error;
        if (res.data) {
          setDbBookings(res.data);
        }
      } catch (err: any) {
        console.error("Failed to fetch bookings:", err);
        setFetchError(err.message || String(err));
      } finally {
        setIsLoading(false);
      }
    };
    fetchBookings();
  }, [userInfo?.id, role]);

  const handleEndSession = async (bookingId: string) => {
    if (!window.confirm("Are you sure you want to end your parking session early? You will not be refunded for unused time.")) {
      return;
    }

    try {
      const { error } = await supabase.from('bookings').update({ status: 'completed' }).eq('id', bookingId);
      if (error) throw error;
      
      // Update local state instantly
      setDbBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'completed' } : b));
    } catch (err) {
      console.error(err);
      toast.error("Failed to end parking session. Please try again.");
    }
  };

  const activeBookings = dbBookings.filter(b => b.status === 'active' || b.status === 'overstay');
  const pastBookings = dbBookings.filter(b => b.status === 'completed' || b.status === 'cancelled');

  return (
    <main className="flex-1 pb-24 h-full bg-background flex flex-col">
      <div className="pt-14 pb-5 px-6 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-10 w-full">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground drop-shadow-sm">
          {role === 'owner' ? "Recent Booked" : "My Bookings"}
        </h1>
        <p className="text-muted-foreground text-sm mt-1.5 font-medium">
          {role === 'owner' ? "Vehicles parked at your spaces" : "View your upcoming and past reservations"}
        </p>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : fetchError ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-red-500 animate-in fade-in duration-500 bg-red-500/10 rounded-xl border border-red-500/20 max-w-md mx-auto p-6">
            <h3 className="font-bold mb-2">Error Loading Data</h3>
            <p className="text-sm font-mono opacity-80">{fetchError}</p>
          </div>
        ) : dbBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500">
            <Calendar className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">No active parking sessions</h3>
            <p className="text-muted-foreground text-sm max-w-[200px] mx-auto">
              {role === 'owner' ? "No one has booked your spots yet." : "When you book a spot, your digital tickets will appear here."}
            </p>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <CheckCircle2 className="text-green-500 w-5 h-5" /> Active Bookings
              </h2>
              {activeBookings.length === 0 ? (
                <div className="bg-muted/50 border border-border rounded-xl p-6 text-center">
                  <p className="text-sm text-muted-foreground italic">You have no active parking sessions.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeBookings.map((booking) => {
                    const spotTitle = booking.parking_spaces?.title || "Unknown Spot";
                    const driverName = booking.driver?.name || "Unknown Driver";
                    const carNumber = booking.driver?.car_number || "Unknown Reg";
                    const driverPhone = booking.driver?.phone_number || "";
                    const hostPhone = booking.parking_spaces?.owner?.phone_number || "";

                    const startTimeMs = new Date(booking.start_time).getTime();
                    const durationMs = booking.duration_hours * 60 * 60 * 1000;
                    const endTimeMs = startTimeMs + durationMs;
                    const isOverstay = Date.now() > endTimeMs;

                    return (
                      <Card key={booking.id} className="border-primary/30 bg-primary/5 shadow-md shadow-primary/5">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Booking #{booking.id.split('-')[0]}</p>
                              <h3 className="font-bold text-lg leading-tight">{role === 'owner' ? driverName : spotTitle}</h3>
                              {role === 'owner' && <p className="text-xs font-bold text-muted-foreground mt-1 flex items-center gap-1"><Car size={12}/> {carNumber}</p>}
                            </div>
                            <div className="px-2 py-1 bg-green-500/10 text-green-500 text-[10px] font-bold rounded border border-green-500/20 uppercase">
                              Active
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-border">
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Date</p>
                              <p className="text-sm font-medium">{new Date(booking.start_time).toLocaleDateString()}</p>
                            </div>
                            {role === 'driver' && (
                              <div>
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Time</p>
                                <p className="text-sm font-medium">{new Date(booking.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                              </div>
                            )}
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Duration</p>
                              <p className="text-sm font-medium flex items-center gap-1"><Clock className="w-3 h-3"/> {booking.duration_hours}h</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Paid</p>
                              <p className="text-sm font-bold text-primary">₹{Number(booking.total_paid).toFixed(2)}</p>
                            </div>
                          </div>

                          <div className="mt-4 pt-4 border-t border-border border-dashed flex gap-2">
                             {role === 'owner' && driverPhone && (
                                <a href={`tel:${driverPhone}`} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold transition-all text-sm ${isOverstay ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 shadow-sm border border-red-500/20' : 'bg-primary/10 text-primary hover:bg-primary/20 shadow-sm border border-primary/20'}`}>
                                  <Phone size={16}/> Call Driver {isOverstay && "(Overstayed)"}
                                </a>
                             )}
                             {role === 'driver' && hostPhone && (
                                <a href={`tel:${hostPhone}`} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-sm bg-primary/10 text-primary hover:bg-primary/20 shadow-sm border border-primary/20 transition-all">
                                  <Phone size={16}/> Call Host
                                </a>
                             )}
                             {role === 'driver' && (
                               <Button onClick={() => handleEndSession(booking.id)} variant="outline" className="flex-1 border-red-500/50 text-red-500 hover:bg-red-500/10 font-bold transition-all h-auto py-2.5">
                                 End & Leave
                               </Button>
                             )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-muted-foreground">
                <History className="w-5 h-5" /> Past Bookings
              </h2>
              {pastBookings.length === 0 ? (
                <div className="bg-muted/50 border border-border rounded-xl p-6 text-center">
                  <p className="text-sm text-muted-foreground italic">You have no past bookings.</p>
                </div>
              ) : (
                <div className="space-y-4 opacity-75 grayscale-[30%]">
                  {pastBookings.map((booking) => {
                    const spotTitle = booking.parking_spaces?.title || "Unknown Spot";
                    const driverName = booking.driver?.name || "Unknown Driver";
                    const carNumber = booking.driver?.car_number || "Unknown Reg";
                    return (
                      <Card key={booking.id} className="border-border bg-card shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Booking #{booking.id.split('-')[0]}</p>
                              <h3 className="font-bold text-lg leading-tight">{role === 'owner' ? driverName : spotTitle}</h3>
                              {role === 'owner' && <p className="text-xs font-bold text-muted-foreground mt-1 flex items-center gap-1"><Car size={12}/> {carNumber}</p>}
                            </div>
                            <div className="px-2 py-1 bg-muted text-muted-foreground text-[10px] font-bold rounded border border-border uppercase">
                              Completed
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-border">
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Date</p>
                              <p className="text-sm font-medium">{new Date(booking.start_time).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Paid</p>
                              <p className="text-sm font-bold">₹{Number(booking.total_paid).toFixed(2)}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
