/// <reference types="vite/client" />
/**
 * Supabase client.
 *
 * Reads VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY at build time.
 * If neither is set, exposes a null client and the app degrades gracefully:
 * - No sign-up/log-in UI is shown
 * - Game history is unavailable
 * - All gameplay still works (anonymous mode)
 *
 * See SETUP.md for how to create a Supabase project and add the env vars.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase: SupabaseClient | null =
  SUPABASE_URL && SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

/** Whether the app was built with Supabase credentials. */
export const supabaseEnabled = supabase !== null;

// ─────────────────────────────────────────────────────────────────────────────
// Schema types — mirror the SQL migration in supabase/migrations/00_init.sql
// ─────────────────────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  display_name: string;
  created_at: string;
  updated_at: string;
}

export interface SavedGame {
  id: string;
  user_id: string;
  opponent_type: 'ai' | 'friend';
  opponent_label: string;        // 'Queen', 'Friend', etc.
  opponent_skill: number | null; // 0..5 for AI, null for friend
  player_color: 'w' | 'b';
  winner: 'w' | 'b' | 'draw';
  result_reason: 'checkmate' | 'stalemate' | 'draw' | 'resign' | 'insufficient' | 'threefold';
  pgn: string;
  move_count: number;
  played_at: string;
}

export type NewSavedGame = Omit<SavedGame, 'id' | 'user_id' | 'played_at'>;
