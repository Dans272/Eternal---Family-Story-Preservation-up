import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { AppView, User } from '../types';
import type { Session } from '@supabase/supabase-js';

function sessionToUser(session: Session): User {
  const { user } = session;
  return {
    id: user.id,
    email: user.email ?? '',
    name:
      (user.user_metadata?.display_name as string | undefined) ??
      user.email?.split('@')[0] ??
      'User',
    createdAt: user.created_at,
  };
}

export const useSession = () => {
  const [view, setView] = useState<AppView>(AppView.SPLASH);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(sessionToUser(session));
        setView(AppView.HOME);
      } else {
        // Brief splash before showing login
        const t = setTimeout(() => setView(AppView.LOGIN), 1200);
        return () => clearTimeout(t);
      }
      setLoading(false);
    });

    // React to sign-in / sign-out events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          setUser(sessionToUser(session));
          setView(prev =>
            prev === AppView.LOGIN || prev === AppView.SPLASH
              ? AppView.HOME
              : prev
          );
        } else {
          setUser(null);
          setView(AppView.LOGIN);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback((u: User) => {
    setUser(u);
    setView(AppView.HOME);
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setView(AppView.LOGIN);
  }, []);

  return { view, setView, user, setUser, login, logout, loading };
};
