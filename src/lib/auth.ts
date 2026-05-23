/**
 * Auth + game-history wrappers around Supabase.
 *
 * All functions are safe to call when Supabase is unconfigured — they no-op
 * with appropriate return values so the app stays functional in anonymous mode.
 */
import { supabase, type NewSavedGame, type Profile, type SavedGame } from './supabase';
import type { Session, User } from '@supabase/supabase-js';

// ─────────────────────────────────────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────────────────────────────────────

export interface AuthResult {
  ok: boolean;
  error?: string;
}

export async function signUp(email: string, password: string, displayName: string): Promise<AuthResult> {
  if (!supabase) return { ok: false, error: 'Sign-up not configured on this deployment.' };
  const trimmedName = displayName.trim() || email.split('@')[0]!;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: trimmedName }, // available to the DB trigger that creates profile
    },
  });
  if (error) return { ok: false, error: error.message };
  // If email confirmation is required, user.id exists but session is null
  if (!data.session) {
    return { ok: true, error: 'Check your email for a confirmation link.' };
  }
  // Create profile row if it doesn't exist yet (handles cases where the trigger isn't set up)
  try {
    if (data.user) {
      await supabase.from('profiles').upsert(
        { id: data.user.id, display_name: trimmedName },
        { onConflict: 'id' },
      );
    }
  } catch {
    /* non-fatal */
  }
  return { ok: true };
}

export async function logIn(email: string, password: string): Promise<AuthResult> {
  if (!supabase) return { ok: false, error: 'Log-in not configured on this deployment.' };
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function logOut(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function getSession(): Promise<Session | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function onAuthChange(cb: (session: Session | null) => void): () => void {
  if (!supabase) return () => {};
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_evt, session) => cb(session));
  return () => subscription.unsubscribe();
}

// ─────────────────────────────────────────────────────────────────────────────
// Profile
// ─────────────────────────────────────────────────────────────────────────────

export async function getProfile(user: User): Promise<Profile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();
  if (error) return null;
  if (!data) {
    // Auto-create a profile if one doesn't exist (defensive — DB trigger should handle this)
    const fallbackName =
      (user.user_metadata?.display_name as string | undefined) ?? user.email?.split('@')[0] ?? 'Player';
    const { data: created } = await supabase
      .from('profiles')
      .insert({ id: user.id, display_name: fallbackName })
      .select()
      .maybeSingle();
    return created ?? null;
  }
  return data as Profile;
}

export async function updateDisplayName(userId: string, displayName: string): Promise<AuthResult> {
  if (!supabase) return { ok: false, error: 'Not configured.' };
  const { error } = await supabase
    .from('profiles')
    .update({ display_name: displayName.trim(), updated_at: new Date().toISOString() })
    .eq('id', userId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// Games
// ─────────────────────────────────────────────────────────────────────────────

export async function saveGame(userId: string, game: NewSavedGame): Promise<SavedGame | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('games')
    .insert({ ...game, user_id: userId })
    .select()
    .maybeSingle();
  if (error) {
    console.warn('saveGame failed', error);
    return null;
  }
  return data as SavedGame;
}

export async function listGames(userId: string, limit = 50): Promise<SavedGame[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('user_id', userId)
    .order('played_at', { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as SavedGame[];
}

export async function deleteGame(gameId: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from('games').delete().eq('id', gameId);
  return !error;
}
