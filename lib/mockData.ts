export type ParkingSpot = {
  id: string;
  name: string;
  address: string;
  distance: string;
  rating: number;
  basePricePerHour: number;
  image: string;
  ownerId: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
};

export const MOCK_SPOTS: ParkingSpot[] = [
  {
    id: "spot-1",
    name: "Ramesh's Secure Driveway",
    address: "123 Indiranagar 1st Stage",
    distance: "0.2 km away",
    rating: 4.8,
    basePricePerHour: 20.0,
    image: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=500&q=80",
    ownerId: "owner-1",
  },
  {
    id: "spot-2",
    name: "Covered Spot near Metro",
    address: "80 Feet Road, HAL 2nd Stage",
    distance: "0.8 km away",
    rating: 4.9,
    basePricePerHour: 30.0,
    image: "https://images.unsplash.com/photo-1579624508968-3e4b09bea2c9?w=500&q=80",
    ownerId: "owner-2",
  },
  {
    id: "spot-3",
    name: "Empty Home Garage",
    address: "Koramangala 4th Block",
    distance: "1.5 km away",
    rating: 5.0,
    basePricePerHour: 25.0,
    image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=500&q=80",
    ownerId: "ownerme",
  },
];
