// components/Auth.tsx
//
// Authentication UI backed by Supabase Auth.
// All credential handling is done server-side by Supabase — no passwords
// are ever read, stored, or compared in client-side code.

import React, { useState } from 'react';
import { Anchor, RefreshCw, Eye, EyeOff } from 'lucide-react';
import type { User } from '../types';
import { supabase } from '../lib/supabaseClient';

interface AuthProps {
  // Called with the resolved User after a successful sign-in or sign-up.
  // useSession.onAuthStateChange also fires, so the view transition happens
  // from there — this callback lets App.tsx stay consistent.
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  const handleSignIn = async () => {
    if (!email || !password) { setError('Email and password are required.'); return; }
    setIsLoading(true);
    setError('');

    const { data, error: sbError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (sbError || !data.session) {
      setError(sbError?.message ?? 'Sign in failed. Please try again.');
      setIsLoading(false);
      return;
    }

    // Map Supabase session to our User type.
    const u: User = {
      id: data.user.id,
      email: data.user.email ?? '',
      name: (data.user.user_metadata?.display_name as string | undefined)
        ?? data.user.email?.split('@')[0]
        ?? 'User',
      createdAt: data.user.created_at,
    };
    setIsLoading(false);
    onLogin(u);
  };

  const handleSignUp = async () => {
    if (!email || !password) { setError('Email and password are required.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setIsLoading(true);
    setError('');

    const name = displayName.trim() || email.split('@')[0];

    const { data, error: sbError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { display_name: name },
      },
    });

    if (sbError) {
      setError(sbError.message);
      setIsLoading(false);
      return;
    }

    // Supabase may require email confirmation depending on project settings.
    // If a session is returned immediately, log the user in now.
    if (data.session) {
      const u: User = {
        id: data.user!.id,
        email: data.user!.email ?? '',
        name,
        createdAt: data.user!.created_at,
      };
      setIsLoading(false);
      onLogin(u);
    } else {
      // Email confirmation required — tell the user.
      setError('');
      setIsLoading(false);
      // Reuse error slot for info message (styled below).
      setError('CHECK_EMAIL');
    }
  };

  const isCheckEmail = error === 'CHECK_EMAIL';

  return (
    <div className="flex flex-col h-full bg-[#f5f2eb] p-8 overflow-y-auto">
      <header className="mt-16 mb-12 text-center space-y-4">
        <div className="w-16 h-16 bg-stone-900 rounded-2xl flex items-center justify-center text-white mx-auto shadow-xl">
          <Anchor size={32} />
        </div>
        <h2 className="text-4xl font-serif">Eternal</h2>
        <p className="text-stone-400 text-xs italic">Family Archive Platform</p>
      </header>

      {/* Error / info banner */}
      {error && !isCheckEmail && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 text-[10px] font-bold uppercase text-center rounded-xl border border-red-100">
          {error}
        </div>
      )}
      {isCheckEmail && (
        <div className="mb-4 p-4 bg-amber-50 text-amber-800 text-[10px] font-bold uppercase text-center rounded-xl border border-amber-100">
          Check your email to confirm your account, then sign in.
        </div>
      )}

      {/* Mode toggle */}
      <div className="flex mb-6 bg-stone-100 rounded-2xl p-1">
        <button
          onClick={() => { setMode('signin'); setError(''); }}
          className={`flex-1 py-2 rounded-xl text-[11px] font-bold uppercase transition-all ${mode === 'signin' ? 'bg-white shadow text-stone-900' : 'text-stone-400'}`}
        >
          Sign In
        </button>
        <button
          onClick={() => { setMode('signup'); setError(''); }}
          className={`flex-1 py-2 rounded-xl text-[11px] font-bold uppercase transition-all ${mode === 'signup' ? 'bg-white shadow text-stone-900' : 'text-stone-400'}`}
        >
          Register
        </button>
      </div>

      <div className="space-y-4">
        {mode === 'signup' && (
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Display name (optional)"
            className="w-full bg-white border rounded-2xl py-4 px-6 font-serif outline-none shadow-sm text-stone-900 placeholder-stone-400"
          />
        )}

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          autoComplete="email"
          className="w-full bg-white border rounded-2xl py-4 px-6 font-serif outline-none shadow-sm text-stone-900 placeholder-stone-400"
        />

        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (mode === 'signin' ? handleSignIn() : handleSignUp())}
            placeholder="Password"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            className="w-full bg-white border rounded-2xl py-4 px-6 font-serif outline-none shadow-sm text-stone-900 placeholder-stone-400"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-300"
          >
            {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
        </div>

        <button
          onClick={mode === 'signin' ? handleSignIn : handleSignUp}
          disabled={isLoading}
          className="w-full bg-stone-900 text-white py-5 rounded-2xl font-bold uppercase text-[11px] shadow-lg flex items-center justify-center space-x-2 disabled:opacity-60"
        >
          {isLoading
            ? <RefreshCw className="animate-spin" size={16} />
            : <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>}
        </button>
      </div>
    </div>
  );
};

export default Auth;
