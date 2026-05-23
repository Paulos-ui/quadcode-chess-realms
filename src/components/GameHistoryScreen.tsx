import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Trophy, Skull, Handshake, Bot, User, Film, Trash2, Loader2 } from 'lucide-react';
import { listGames, deleteGame } from '../lib/auth';
import type { SavedGame } from '../lib/supabase';
import type { User as AuthUser } from '@supabase/supabase-js';
import type { GameOver, PlayerColor } from '../hooks/usePlayGame';

interface Props {
  user: AuthUser;
  onBack: () => void;
  onReplay: (pgn: string, outcome: GameOver, color: PlayerColor, opponentLabel: string) => void;
}

export function GameHistoryScreen({ user, onBack, onReplay }: Props) {
  const [games, setGames] = useState<SavedGame[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null); // game id being deleted

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await listGames(user.id, 100);
      if (!cancelled) setGames(list);
    })();
    return () => {
      cancelled = true;
    };
  }, [user.id]);

  return (
    <section className="relative min-h-screen aurora-bg overflow-x-hidden">
      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-8 py-6 flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-gold-200/70 hover:text-gold-100 transition text-sm font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <div className="text-xs font-mono uppercase tracking-[0.25em] text-gold-200/60">Your Games</div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-8 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="mb-8"
        >
          <h1 className="font-display text-4xl md:text-5xl text-gold-100 mb-2">Your archive</h1>
          <p className="text-gold-100/60">Every game you've played, ready to be re-watched as a movie.</p>
        </motion.div>

        {games === null ? (
          <div className="parchment rounded-2xl p-12 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-gold-200 mx-auto" />
            <p className="text-sm text-gold-200/60 mt-3 font-mono">Loading your games…</p>
          </div>
        ) : games.length === 0 ? (
          <div className="parchment rounded-2xl p-12 text-center">
            <div className="text-5xl mb-4">♟️</div>
            <h3 className="font-display text-xl text-gold-100 mb-2">No games yet</h3>
            <p className="text-sm text-gold-100/60 mb-5">
              Play your first game and it'll appear here automatically.
            </p>
            <button onClick={onBack} className="btn-gold py-2.5 px-6">
              Start playing
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {games.map((g, i) => (
              <GameRow
                key={g.id}
                game={g}
                index={i}
                busy={busy === g.id}
                onReplay={() => {
                  // Reconstruct minimum GameOver shape from saved fields
                  const outcome: GameOver = {
                    reason: g.result_reason,
                    winner: g.winner === 'draw' ? null : g.winner,
                  };
                  onReplay(g.pgn, outcome, g.player_color, g.opponent_label);
                }}
                onDelete={async () => {
                  if (!confirm('Delete this game from your archive? This cannot be undone.')) return;
                  setBusy(g.id);
                  const ok = await deleteGame(g.id);
                  if (ok) setGames((prev) => prev?.filter((x) => x.id !== g.id) ?? null);
                  setBusy(null);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function GameRow({
  game,
  index,
  busy,
  onReplay,
  onDelete,
}: {
  game: SavedGame;
  index: number;
  busy: boolean;
  onReplay: () => void;
  onDelete: () => void;
}) {
  const youWon = game.winner !== 'draw' && game.winner === game.player_color;
  const isDraw = game.winner === 'draw';
  const Icon = isDraw ? Handshake : youWon ? Trophy : Skull;
  const tone = isDraw ? 'text-neon-violet' : youWon ? 'text-gold-200' : 'text-red-300';
  const label = isDraw ? 'Drawn' : youWon ? 'Won' : 'Lost';
  const date = new Date(game.played_at);
  const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.6) }}
      className="parchment rounded-xl px-4 py-3 flex items-center gap-4 hover:border-gold-300/40 transition"
    >
      {/* Result icon */}
      <div className={`w-10 h-10 rounded-full bg-royal-950/60 flex items-center justify-center ${tone} shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>

      {/* Game details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-sm">
          <span className={`font-display ${tone}`}>{label}</span>
          <span className="text-gold-200/40">vs</span>
          <span className="inline-flex items-center gap-1 text-gold-100">
            {game.opponent_type === 'ai' ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3" />}
            {game.opponent_label}
          </span>
          {game.opponent_type === 'ai' && game.opponent_skill !== null && (
            <span className="text-[10px] font-mono text-gold-200/50">·  level {game.opponent_skill}</span>
          )}
        </div>
        <div className="text-[11px] font-mono text-gold-200/50 mt-0.5">
          {dateStr} · {game.move_count} moves · played as {game.player_color === 'w' ? 'white' : 'black'} ·{' '}
          {game.result_reason}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-1.5 shrink-0">
        <button
          onClick={onReplay}
          className="btn-gold text-xs py-1.5 px-3 inline-flex items-center gap-1.5"
          title="Watch this game as a movie"
        >
          <Film className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Replay</span>
        </button>
        <button
          onClick={onDelete}
          disabled={busy}
          className="btn-ghost text-xs py-1.5 px-2.5 text-red-300/70 hover:text-red-200 disabled:opacity-40"
          title="Delete this game"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </motion.div>
  );
}
