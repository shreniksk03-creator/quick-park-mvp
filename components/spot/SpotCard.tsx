"use client";

import { useState } from "react";
import { ParkingSpot } from "@/lib/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Star, Car } from "lucide-react";

export function SpotCard({ spot, onClick }: { spot: ParkingSpot; onClick: () => void }) {
  const [imgError, setImgError] = useState(false);
  return (
    <Card 
      className="overflow-hidden cursor-pointer bg-card border-border hover:border-primary transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,102,255,0.15)] group"
      onClick={onClick}
    >
      <div className="h-48 w-full overflow-hidden relative">
        {!spot.image || imgError ? (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
            <Car size={48} className="text-gray-600" />
          </div>
        ) : (
          <img 
            src={spot.image} 
            alt={spot.name} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
            onError={() => setImgError(true)}
          />
        )}
        <div className="absolute top-3 right-3 bg-background/80 backdrop-blur-md px-2.5 py-1.5 rounded-md flex items-center gap-1.5 text-sm font-bold shadow-lg">
          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          {spot.rating}
        </div>
      </div>
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-bold text-xl leading-tight text-foreground line-clamp-1 flex-1 pr-4">{spot.name}</h3>
          <div className="text-right shrink-0 bg-primary/10 px-3 py-1 rounded-md border border-primary/20">
            <span className="font-bold text-xl text-primary">₹{spot.basePricePerHour}</span>
            <span className="text-xs text-primary font-medium">/hr</span>
          </div>
        </div>
        <div className="flex items-center text-muted-foreground text-sm font-medium">
          <MapPin className="w-4 h-4 mr-1.5 shrink-0 text-primary" />
          <span className="truncate">{spot.address} • {spot.distance}</span>
        </div>
      </CardContent>
    </Card>
  );
}
