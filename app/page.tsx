"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { ParkingSpot } from "@/lib/mockData";
import { SpotCard } from "@/components/spot/SpotCard";
import { SpotDetailModal } from "@/components/spot/SpotDetailModal";
import { Map, List, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";
import { toast } from "sonner";

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = {
  lat: 12.9716,
  lng: 77.5946,
};

const darkModeStyles = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
  { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
  { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] },
];

export default function Home() {
  const { spots, role, bookings, setPreviousDues } = useAppContext();
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  const router = useRouter();
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const [center, setCenter] = useState(defaultCenter);
  const [activeMarker, setActiveMarker] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("view") === "map") {
        setViewMode("map");
      }
    }
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          console.warn("Geolocation denied or failed, using default center.");
        }
      );
    }
  }, []);

  const onLoad = useCallback(function callback(map: google.maps.Map) {
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(function callback(map: google.maps.Map) {
    mapRef.current = null;
  }, []);

  const handleMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCenter(newPos);
          mapRef.current?.panTo(newPos);
          mapRef.current?.setZoom(15);
        }
      );
    }
  };

  const handleSpotClick = (spot: ParkingSpot) => {
    setSelectedSpot(spot);
    setIsDetailOpen(true);
  };

  const handleBookingComplete = (bookingId: string) => {
    toast.success("Booking Confirmed! Drive safely.");
    router.push("/bookings");
  };

  return (
    <main className="flex-1 relative pb-24 h-full bg-background flex flex-col">
      <div className="pt-14 pb-5 px-6 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-20 w-full flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground drop-shadow-sm">
            Nearby Driveways
          </h1>
          <p className="text-muted-foreground text-sm mt-1.5 font-medium">
            Find exact coordinates to available host paths
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full relative z-0">
        {viewMode === "list" ? (
          <div className="p-6 space-y-6 relative z-10">
            {spots.map((spot) => (
              <SpotCard key={spot.id} spot={spot} onClick={() => handleSpotClick(spot)} />
            ))}
          </div>
        ) : (
          <div className="w-full absolute inset-0 bg-[#0a0a0a] flex items-center justify-center flex-col overflow-hidden">
            {!isLoaded ? (
              <div className="text-primary text-sm font-bold uppercase tracking-widest animate-pulse">
                Loading Map...
              </div>
            ) : (
              <>
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={center}
                  zoom={14}
                  onLoad={onLoad}
                  onUnmount={onUnmount}
                  options={{
                    styles: darkModeStyles,
                    disableDefaultUI: true,
                    zoomControl: true,
                  }}
                  onClick={() => setActiveMarker(null)}
                >
                  {spots.map((spot) => (
                    spot.coordinates && (
                      <Marker
                        key={spot.id}
                        position={{ lat: spot.coordinates.lat, lng: spot.coordinates.lng }}
                        onClick={() => setActiveMarker(spot.id)}
                        icon={{
                          path: google.maps.SymbolPath.CIRCLE,
                          scale: 10,
                          fillColor: "#0066FF",
                          fillOpacity: 1,
                          strokeColor: "#ffffff",
                          strokeWeight: 2,
                        }}
                      >
                        {activeMarker === spot.id && (
                          <InfoWindow
                            onCloseClick={() => setActiveMarker(null)}
                            options={{ pixelOffset: new google.maps.Size(0, -10) }}
                          >
                            <div className="bg-background p-2 rounded-md shadow-md border border-border text-foreground flex flex-col items-center gap-2 min-w-[140px]">
                              {spot.image ? (
                                <img src={spot.image} className="w-full h-20 object-cover rounded-sm mb-1" alt="Spot" />
                              ) : (
                                <div className="w-full h-20 bg-gray-800 flex items-center justify-center rounded-sm mb-1">
                                  <span className="text-xs text-gray-400">No Image</span>
                                </div>
                              )}
                              <p className="text-sm font-bold m-0 p-0 text-black">₹{spot.basePricePerHour}/hr</p>
                              <Button
                                size="sm"
                                className="w-full h-8 text-xs bg-primary hover:bg-primary/90 text-white"
                                onClick={() => handleSpotClick(spot)}
                              >
                                Book Now
                              </Button>
                            </div>
                          </InfoWindow>
                        )}
                      </Marker>
                    )
                  ))}
                </GoogleMap>
                <Button
                  size="icon"
                  className="absolute bottom-32 right-6 h-12 w-12 rounded-full shadow-lg bg-background text-foreground hover:bg-muted border border-border z-10"
                  onClick={handleMyLocation}
                >
                  <Navigation size={20} className="text-primary" />
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Floating View Toggle */}
      <Button
        size="icon"
        className="fixed bottom-24 right-6 h-16 w-16 rounded-full shadow-[0_8px_30px_rgba(0,102,255,0.6)] bg-primary hover:bg-primary/90 z-50 transition-transform active:scale-95"
        onClick={() => setViewMode(viewMode === "list" ? "map" : "list")}
      >
        {viewMode === "list" ? <Map size={28} /> : <List size={28} />}
      </Button>

      {/* Modals */}
      <SpotDetailModal
        spot={selectedSpot}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onBookingComplete={handleBookingComplete}
      />
    </main>
  );
}

