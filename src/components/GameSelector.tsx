import { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Sparkles, AlertTriangle } from 'lucide-react';
import { FAMOUS_GAMES } from '../data/famousGames';
import type { FamousGame } from '../types';
import { parsePgn } from '../lib/chess-utils';

interface Props {
  active: FamousGame;
  onPick: (g: FamousGame) => void;
}

export function GameSelector({ active, onPick }: Props) {
  const [pgn, setPgn] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const tryCustom = () => {
    try {
      parsePgn(pgn);
      const custom: FamousGame = {
        id: `custom-${Date.now()}`,
        title: 'Custom Game',
        subtitle: 'Pasted PGN',
        year: new Date().getFullYear(),
        white: 'White',
        black: 'Black',
        result: '1-0',
        blurb: 'Your own game, ready to be made legendary.',
        pgn,
        loreSeed: 'An anonymous duel, summoned from notation and given new myth.',
        defaultTheme: 'classic',
      };
      setErr(null);
      onPick(custom);
    } catch (e) {
      setErr('That PGN could not be parsed. Make sure it\'s complete and uses standard notation.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-widest text-gold-200/70 mb-2">Famous Legends</div>
        <div className="grid grid-cols-2 lg:grid-cols-2 gap-3">
          {FAMOUS_GAMES.map((g) => {
            const isActive = g.id === active.id;
            return (
              <motion.button
                key={g.id}
                onClick={() => onPick(g)}
                whileTap={{ scale: 0.97 }}
                className={[
                  'text-left rounded-xl p-4 border transition',
                  isActive
                    ? 'border-gold-300 bg-gold-300/10 shadow-gold'
                    : 'border-gold-300/15 bg-white/[0.02] hover:border-gold-300/40',
                ].join(' ')}
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-gold-200/70">
                  <span>{g.year}</span>
                  <span>{g.result}</span>
                </div>
                <div className="font-display text-sm text-gold-50 mt-1 leading-tight">
                  {g.title} {g.flag && <span>{g.flag}</span>}
                </div>
                <div className="text-[11px] text-gold-100/55 mt-0.5">{g.subtitle}</div>
                {isActive && (
                  <div className="mt-2 inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-gold-300">
                    <Crown className="w-3 h-3" /> Now Playing
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      <div id="create">
        <div className="text-xs uppercase tracking-widest text-gold-200/70 mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" /> Create Your Own
        </div>
        <textarea
          value={pgn}
          onChange={(e) => { setPgn(e.target.value); if (err) setErr(null); }}
          placeholder={'Paste any PGN here…\ne.g. 1.e4 e5 2.Nf3 Nc6 3.Bb5 …'}
          className="w-full h-32 rounded-xl bg-white/[0.03] border border-gold-300/20 px-3 py-2.5 text-sm font-mono text-gold-100/85 placeholder:text-gold-100/30 focus:outline-none focus:border-gold-300/60 transition resize-none"
        />
        {err && (
          <div className="mt-2 text-xs text-red-300 inline-flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> {err}
          </div>
        )}
        <button
          onClick={tryCustom}
          disabled={!pgn.trim()}
          className="mt-3 w-full btn-gold rounded-xl py-2.5 text-sm font-semibold"
        >
          Summon This Game
        </button>
      </div>
    </div>
  );
}
