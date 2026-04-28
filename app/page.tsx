"use client";

import { useEffect, useState, Suspense } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useSearchParams } from 'next/navigation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// 🚦 This is our Traffic Cop component! It reads the URL and shows the right screen.
function DashboardContent({ session }: { session: any }) {
  const searchParams = useSearchParams();
  const view = searchParams.get('view') || 'home';

  if (view === 'map') {
    const parkingSpots = [
      { id: 1, name: "Downtown Plaza Lot", distance: "0.2 miles away", price: "$5.00 / hr", spotsLeft: 3 },
      { id: 2, name: "Central Station Garage", distance: "0.5 miles away", price: "$8.00 / hr", spotsLeft: 12 },
      { id: 3, name: "Street Parking - 5th Ave", distance: "0.8 miles away", price: "$2.50 / hr", spotsLeft: 1 },
    ];

    return (
      <div style={{ width: '100%', maxWidth: '400px', padding: '0 20px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>📍 Find a Spot</h2>

        {parkingSpots.map((spot) => (
          <div key={spot.id} style={{ border: '1px solid #ddd', borderRadius: '10px', padding: '15px', marginBottom: '15px', backgroundColor: '#fff', color: '#333' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>{spot.name}</h3>
              <span style={{ fontWeight: 'bold', color: '#28a745' }}>{spot.price}</span>
            </div>
            <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>🚗 {spot.distance}</p>
            <p style={{ margin: '5px 0', fontSize: '14px', color: spot.spotsLeft < 5 ? '#dc3545' : '#666' }}>
              Only {spot.spotsLeft} spots left!
            </p>

            <button style={{ width: '100%', padding: '10px', marginTop: '10px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>
              Book & Pay
            </button>
          </div>
        ))}
      </div>
    );
  }

  if (view === 'bookings') {
    return (
      <div style={{ textAlign: 'center' }}>
        <h1>🎫 My Bookings</h1>
        <p>Your active and past parking reservations will show here.</p>
      </div>
    );
  }

  if (view === 'profile') {
    return (
      <div style={{ textAlign: 'center' }}>
        <h1>👤 Profile Settings</h1>
        <p>Logged in as: <b>{session.user.email}</b></p>
        <button
          onClick={() => supabase.auth.signOut()}
          style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', borderRadius: '5px', cursor: 'pointer' }}
        >
          Sign Out
        </button>
      </div>
    );
  }

  // Default Home View
  // Default Home View
  return (
    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', padding: '0 20px' }}>
      <h1>🚗 Quick Park Dashboard</h1>
      <p style={{ fontSize: '18px', margin: 0 }}>
        Welcome back, <br />
        <b style={{ color: '#4285F4' }}>{session.user.email}</b>!
      </p>

      <div style={{ backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '15px', marginTop: '20px', width: '100%', maxWidth: '350px', border: '1px solid #333' }}>
        <h3 style={{ margin: '0 0 10px 0', color: 'white' }}>Ready to park?</h3>
        <p style={{ margin: 0, color: '#aaa', fontSize: '14px' }}>Tap the Map icon below to find and book your spot instantly.</p>
      </div>
    </div>
  );
}

export default function Home() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  // 🟢 IF LOGGED IN: Show the Dashboard with the Traffic Cop
  if (session) {
    return (
      <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '20px', paddingBottom: '80px' }}>
        {/* Suspense is required by Next.js when reading URLs */}
        <Suspense fallback={<p>Loading view...</p>}>
          <DashboardContent session={session} />
        </Suspense>
      </main>
    );
  }

  // 🔴 IF NOT LOGGED IN: Show Login Button
  return (
    <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '20px' }}>
      <h1>Welcome to Quick Park 🚗</h1>
      <button
        onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}` } })}
        style={{ padding: '12px 24px', backgroundColor: '#4285F4', color: 'white', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}
      >
        Sign in with Google
      </button>
    </main>
  );
}