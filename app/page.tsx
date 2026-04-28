"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// We add a safety check so the app doesn't crash if keys are missing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export default function Home() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (session) {
    return (
      <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '20px' }}>
        <h1>🚗 Quick Park Dashboard</h1>
        <p>Logged in as: <b>{session.user.email}</b></p>
        <button onClick={() => supabase.auth.signOut()} style={{ padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', borderRadius: '5px' }}>Sign Out</button>
      </main>
    );
  }

  return (
    <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '20px' }}>
      <h1>Welcome to Quick Park 🚗</h1>
      <button onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}` } })} style={{ padding: '12px 24px', backgroundColor: '#4285F4', color: 'white', borderRadius: '5px' }}>
        Sign in with Google
      </button>
    </main>
  );
}