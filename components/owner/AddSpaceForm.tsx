"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAppContext } from "@/context/AppContext";
import { ParkingSpot } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ShieldCheck, Locate } from "lucide-react";
import { toast } from "sonner";

export function AddSpaceForm({ onSuccess }: { onSuccess: () => void }) {
  const { addSpot, userInfo } = useAppContext();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [spaceType, setSpaceType] = useState("Open Driveway");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [latStr, setLatStr] = useState("");
  const [lngStr, setLngStr] = useState("");
  const [manualLocation, setManualLocation] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleGetLocation = () => {
    setIsLocating(true);
    setLocationError("");
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLatStr(latitude.toFixed(6));
          setLngStr(longitude.toFixed(6));
          setAddress(`GPS Segment Captured`);
          setIsLocating(false);
        },
        (error) => {
          console.error("Error getting location: ", error);
          setLocationError("Location access denied or unavailable. Please enter manually.");
          setManualLocation(true);
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setLocationError("Geolocation is not supported by your browser");
      setManualLocation(true);
      setIsLocating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Explicit Validation Check
    if (!userInfo?.id) { 
      console.error("No user ID found"); 
      toast.error("Authentication Error: Secure User ID is missing. Please log out and back in.");
      setIsSubmitting(false);
      return; 
    }

    try {
      let publicImageUrl = "https://images.unsplash.com/photo-1621290649539-44d4407b9a52?auto=format&fit=crop&q=80&w=400&h=300";

      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const filePath = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('parking_images')
          .upload(filePath, selectedFile);
          
        if (uploadError) {
          console.error("Storage upload error:", uploadError);
          // If storage fails, we can optionally throw or fallback. 
          // Since the prompt asks to wrap in try catch, we proceed to get public URL if successful.
          throw new Error("Failed to upload image. " + uploadError.message);
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('parking_images')
          .getPublicUrl(filePath);
          
        publicImageUrl = publicUrl;
      }

      const { data, error } = await supabase.from('parking_spaces').insert([{
        owner_id: userInfo.id,
        title: name,
        space_type: spaceType,
        hourly_rate: parseFloat(hourlyRate) || 0,
        latitude: parseFloat(latStr) || null,
        longitude: parseFloat(lngStr) || null,
        image_url: publicImageUrl,
        is_active: true
      }]).select();

      if (error) {
        console.error("Supabase Insert Error:", error);
        toast.error("Failed to insert live DB spot. " + error.message);
        setIsSubmitting(false);
        return;
      }

    if (data && data.length > 0) {
      const row = data[0];
      const newSpot: ParkingSpot = {
        id: row.id,
        name: row.title,
        address: "Live Extracted Geolocation Data",
        distance: "0.0 km away",
        rating: 5.0,
        basePricePerHour: Number(row.hourly_rate),
        image: row.image_url,
        ownerId: row.owner_id || "owner",
        coordinates: { lat: parseFloat(latStr) || 0, lng: parseFloat(lngStr) || 0 }
      };
      
      addSpot(newSpot); // Optimistic UI local push
    }
    
      setIsSubmitting(false);
      onSuccess();
    } catch (err: any) {
      console.error("Form submission error:", err);
      toast.error(err.message || "An unexpected error occurred during submission.");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-muted/30 p-5 rounded-xl border border-border mt-4 shadow-inner">
      <h3 className="font-bold flex items-center gap-2 mb-2"><ShieldCheck className="text-primary" size={18}/> Publish a Home Parking Space</h3>
      
      <div className="space-y-2">
        <Label>Space Type</Label>
        <select 
          value={spaceType} 
          onChange={e => setSpaceType(e.target.value)} 
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option>Open Driveway</option>
          <option>Covered Home Garage</option>
          <option>Apartment Visitor Spot</option>
          <option>Empty Plot</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label>Space Name</Label>
        <Input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Ramesh's Secure Driveway" className="bg-background" />
      </div>
      <div className="space-y-2">
        <Label>Address</Label>
        <div className="flex gap-2">
          <Input required value={address} onChange={e => setAddress(e.target.value)} placeholder="e.g. 123 Indiranagar" className="bg-background flex-1"/>
          <Button type="button" variant="outline" onClick={handleGetLocation} disabled={isLocating} className="shrink-0 bg-primary/10 hover:bg-primary/20 text-primary border-primary/20 px-3">
            <Locate size={18} className={isLocating ? "animate-spin mr-1.5" : "mr-1.5"} /> 
            {isLocating ? "Locating..." : "Use Current Location"}
          </Button>
        </div>
      </div>
      
      <div className="space-y-3 pt-2">
        <div className="flex justify-between items-center">
          <Label>GPS Coordinates</Label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">Edit Manually</span>
            <Switch checked={manualLocation} onCheckedChange={setManualLocation} className="scale-75 data-[state=checked]:bg-primary" />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Latitude</Label>
            <Input 
              type="number" 
              step="any" 
              required
              value={latStr} 
              onChange={e => setLatStr(e.target.value)} 
              disabled={!manualLocation} 
              placeholder="e.g. 12.9716" 
              className="bg-background disabled:opacity-70 disabled:bg-muted/50 font-mono text-sm" 
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Longitude</Label>
            <Input 
              type="number" 
              step="any" 
              required
              value={lngStr} 
              onChange={e => setLngStr(e.target.value)} 
              disabled={!manualLocation} 
              placeholder="e.g. 77.5946" 
              className="bg-background disabled:opacity-70 disabled:bg-muted/50 font-mono text-sm" 
            />
          </div>
        </div>
        {locationError && <p className="text-xs font-bold text-red-500 mt-1.5">{locationError}</p>}
      </div>

      <div className="space-y-2 pt-2">
        <Label>Hourly Rate (₹)</Label>
        <Input required type="number" step="0.5" value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} placeholder="30.00" className="bg-background" />
      </div>
      
      <div className="space-y-2">
        <Label>Upload Space Photo</Label>
        <Input type="file" accept="image/*" onChange={handleImageChange} className="bg-background cursor-pointer text-muted-foreground file:text-primary file:font-semibold file:border-0 file:bg-transparent" />
        {imagePreview && (
          <div className="mt-3 relative h-32 w-full rounded-lg overflow-hidden border border-border shadow-sm">
            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      <Button disabled={isSubmitting} type="submit" className="w-full bg-primary hover:bg-primary/90 mt-4 h-12 text-md font-bold shadow-lg shadow-primary/20 transition-all">
        {isSubmitting ? "Generating Listing..." : "List Home Space"}
      </Button>
    </form>
  );
}
