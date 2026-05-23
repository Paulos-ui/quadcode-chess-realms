import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Loader2, Save, CheckCircle2, AlertCircle, Trophy, Skull, Handshake } from 'lucide-react';
import { listGames, updateDisplayName } from '../lib/auth';
import type { Profile, SavedGame } from '../lib/supabase';
import type { User as AuthUser } from '@supabase/supabase-js';

interface Props {
  user: AuthUser;
  profile: Profile | null;
  onBack: () => void;
  onProfileUpdated: () => void;
}

export function ProfileScreen({ user, profile, onBack, onProfileUpdated }: Props) {
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [busy, setBusy] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{ wins: number; losses: number; draws: number; total: number } | null>(null);

  useEffect(() => {
    setDisplayName(profile?.display_name ?? '');
  }, [profile?.display_name]);

  // Load lifetime stats
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const games = await listGames(user.id, 1000);
      if (cancelled) return;
      const s = { wins: 0, losses: 0, draws: 0, total: games.length };
      for (const g of games) {
        if (g.winner === 'draw') s.draws++;
        else if (g.winner === g.player_color) s.wins++;
        else s.losses++;
      }
      setStats(s);
    })();
    return () => {
      cancelled = true;
    };
  }, [user.id]);

  const save = async () => {
    setError(null);
    const trimmed = displayName.trim();
    if (!trimmed) {
      setError('Display name cannot be empty.');
      return;
    }
    setBusy(true);
    const result = await updateDisplayName(user.id, trimmed);
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? 'Save failed.');
      return;
    }
    setSavedFlash(true);
    onProfileUpdated();
    setTimeout(() => setSavedFlash(false), 2000);
  };

  return (
    <section className="relative min-h-screen aurora-bg overflow-x-hidden">
      <div className="relative z-10 max-w-3xl mx-auto px-4 md:px-8 py-6 flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-gold-200/70 hover:text-gold-100 transition text-sm font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <div className="text-xs font-mono uppercase tracking-[0.25em] text-gold-200/60">Profile</div>
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 md:px-8 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="mb-8"
        >
          <h1 className="font-display text-4xl md:text-5xl text-gold-100 mb-2">Your throne</h1>
          <p className="text-gold-100/60">Your name on the opponent banner and the story of your battles.</p>
        </motion.div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-4 gap-3 mb-6">
            <StatTile label="Played" value={stats.total} tone="neutral" />
            <StatTile label="Won" value={stats.wins} icon={<Trophy className="w-4 h-4" />} tone="win" />
            <StatTile label="Lost" value={stats.losses} icon={<Skull className="w-4 h-4" />} tone="loss" />
            <StatTile label="Drawn" value={stats.draws} icon={<Handshake className="w-4 h-4" />} tone="draw" />
          </div>
        )}

        {/* Editor */}
        <div className="parchment rounded-2xl p-6">
          <label className="block">
            <span className="block text-[10px] font-mono uppercase tracking-widest text-gold-200/60 mb-1.5">
              Display name
            </span>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={32}
              className="w-full px-4 py-3 rounded-lg bg-royal-950/80 border border-gold-300/20 text-gold-100 placeholder:text-gold-200/30 focus:outline-none focus:border-gold-300/60 text-lg font-display"
              placeholder="Your name"
            />
            <span className="block text-[10px] font-mono text-gold-200/40 mt-1">
              Shows on the opponent banner during games. {32 - displayName.length} chars left.
            </span>
          </label>

          <div className="mt-5 grid grid-cols-2 gap-2 text-xs text-gold-200/60">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-gold-200/40 mb-1">Email</div>
              <div className="font-mono truncate">{user.email}</div>
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-gold-200/40 mb-1">Joined</div>
              <div className="font-mono">
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
                  : '—'}
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2 text-sm text-red-300/90 bg-red-500/10 border border-red-400/30 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={save}
            disabled={busy || displayName.trim() === (profile?.display_name ?? '').trim()}
            className="btn-gold w-full mt-5 py-3 inline-flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : savedFlash ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {savedFlash ? 'Saved!' : 'Save changes'}
          </button>
        </div>
      </div>
    </section>
  );
}

function StatTile({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon?: React.ReactNode;
  tone: 'neutral' | 'win' | 'loss' | 'draw';
}) {
  const tones = {
    neutral: 'text-gold-200',
    win: 'text-gold-200',
    loss: 'text-red-300',
    draw: 'text-neon-violet',
  } as const;
  return (
    <div className="parchment rounded-xl p-4 text-center">
      <div className={`flex items-center justify-center gap-1.5 mb-1 ${tones[tone]}`}>
        {icon}
        <span className="font-display text-2xl">{value}</span>
      </div>
      <div className="text-[10px] font-mono uppercase tracking-widest text-gold-200/60">{label}</div>
    </div>
  );
}
