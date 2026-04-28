"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check if the user is already logged in when the page loads
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Listen for changes (like clicking the login or logout button)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}` }
    });
    if (error) console.error("Login failed:", error.message);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) return <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</main>;

  // 🟢 IF THE USER IS LOGGED IN: Show the actual App/Dashboard
  if (session) {
    return (
      <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '20px' }}>
        <h1>🚗 Quick Park Dashboard</h1>
        <p>Success! You are logged in as:</p>
        <p style={{ fontWeight: 'bold', color: '#4285F4' }}>{session.user.email}</p>
        <p>The map and booking features will be built here!</p>
        <button
          onClick={handleLogout}
          style={{ padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          Sign Out
        </button>
      </main>
    );
  }

  // 🔴 IF THE USER IS NOT LOGGED IN: Show the Login Button
  return (
    <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '20px' }}>
      <h1>Welcome to Quick Park 🚗</h1>
      <button
        onClick={handleLogin}
        style={{ padding: '12px 24px', fontSize: '18px', backgroundColor: '#4285F4', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
      >
        Sign in with Google
      </button>
    </main>
  );
}