import { useEffect, useState, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { getSession, onAuthChange, getProfile, logOut as authLogOut } from '../lib/auth';
import { supabaseEnabled } from '../lib/supabase';
import type { Profile } from '../lib/supabase';

export interface AuthState {
  enabled: boolean;
  ready: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  logOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(!supabaseEnabled); // if not configured, we're ready immediately

  // Bootstrap session + listen for changes
  useEffect(() => {
    if (!supabaseEnabled) return;
    let cancelled = false;
    (async () => {
      const s = await getSession();
      if (cancelled) return;
      setSession(s);
      setReady(true);
    })();
    const unsubscribe = onAuthChange((s) => {
      setSession(s);
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  // Fetch profile when user changes
  useEffect(() => {
    if (!supabaseEnabled) return;
    if (!session?.user) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const p = await getProfile(session.user);
      if (cancelled) return;
      setProfile(p);
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.user]);

  const logOut = useCallback(async () => {
    await authLogOut();
    setSession(null);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!session?.user) return;
    const p = await getProfile(session.user);
    setProfile(p);
  }, [session?.user]);

  return {
    enabled: supabaseEnabled,
    ready,
    session,
    user: session?.user ?? null,
    profile,
    logOut,
    refreshProfile,
  };
}
