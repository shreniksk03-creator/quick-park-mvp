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
    return (
      <div style={{ textAlign: 'center' }}>
        <h1>🗺️ Quick Park Map</h1>
        <p>This is where the interactive parking map will go!</p>
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
  return (
    <div style={{ textAlign: 'center' }}>
      <h1>🏠 Home Dashboard</h1>
      <p>Welcome back! Let's find you a parking spot.</p>
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