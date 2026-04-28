"use client";

import { createClient } from '@supabase/supabase-js';

// This connects to the exact keys you pasted into Vercel earlier!
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Home() {
  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // This tells Supabase to send them right back to your app after logging in
        redirectTo: `${window.location.origin}`
      }
    });

    if (error) console.error("Login failed:", error.message);
  };

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