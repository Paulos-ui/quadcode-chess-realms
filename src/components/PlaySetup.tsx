import { motion } from 'framer-motion';
import { Crown, Sword, Shuffle, BookOpen, Sparkles, Users } from 'lucide-react';
import { ParticleBackground } from './ParticleBackground';
import { SKILL_LABELS, type Skill } from '../lib/chess-ai';
import type { PlayerColor } from '../hooks/usePlayGame';

interface Props {
  skill: Skill;
  color: PlayerColor | 'random';
  onSkillChange: (s: Skill) => void;
  onColorChange: (c: PlayerColor | 'random') => void;
  onStart: () => void;
  onOpenLegends: () => void;
  onOpenMultiplayer: () => void;
}

const SKILL_ORDER: Skill[] = [0, 1, 2, 3, 4, 5];

export function PlaySetup({ skill, color, onSkillChange, onColorChange, onStart, onOpenLegends, onOpenMultiplayer }: Props) {
  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden aurora-bg">
      <ParticleBackground />

      <nav className="relative z-10 max-w-7xl mx-auto w-full px-6 lg:px-10 py-6 flex items-center justify-between">
        <div className="inline-flex items-center gap-2.5">
          <span className="text-2xl">♟️</span>
          <span className="font-display font-bold tracking-widest text-gold-200 text-sm">JCR</span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm text-gold-100/70 font-medium">
          <button onClick={onOpenLegends} className="hover:text-gold-200 transition inline-flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            Study Legends
          </button>
          <a
            href="https://github.com/Paulos-ui/quadcode-chess-realms"
            target="_blank"
            rel="noreferrer"
            className="hover:text-gold-200 transition"
          >
            GitHub
          </a>
        </div>
      </nav>

      <div className="relative z-10 max-w-5xl mx-auto w-full px-6 lg:px-10 py-10 lg:py-14 flex-1 flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-10 lg:mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold-300/10 border border-gold-300/20 text-xs font-mono uppercase tracking-[0.3em] text-gold-200 mb-5">
            <Sparkles className="w-3 h-3" />
            Quadcode Hackathon
          </div>
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl text-gold-100 leading-[0.95] mb-5">
            Jayking's <span className="gold-shimmer">Chess Realms</span>
          </h1>
          <p className="text-base md:text-lg text-gold-100/70 max-w-xl mx-auto">
            Play a real chess engine. Win, lose, or draw — every game becomes a cinematic movie afterward.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="parchment rounded-2xl p-5 md:p-8 max-w-3xl w-full mx-auto"
        >
          {/* SKILL SELECTOR */}
          <div className="mb-7">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-base md:text-lg text-gold-100 inline-flex items-center gap-2">
                <Sword className="w-4 h-4 text-gold-300" />
                Choose your opponent
              </h3>
              <span className="text-[10px] font-mono uppercase tracking-widest text-gold-200/60">
                {SKILL_LABELS[skill].rating} ELO
              </span>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {SKILL_ORDER.map((s) => {
                const active = s === skill;
                const label = SKILL_LABELS[s];
                return (
                  <motion.button
                    key={s}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => onSkillChange(s)}
                    className={`relative rounded-lg p-3 text-center transition border ${
                      active
                        ? 'bg-gold-300/15 border-gold-300/60 text-gold-100'
                        : 'bg-royal-950/40 border-gold-300/10 text-gold-100/60 hover:border-gold-300/30 hover:text-gold-100/90'
                    }`}
                  >
                    <div className="font-display text-sm leading-tight">{label.name}</div>
                    <div className="text-[10px] font-mono text-gold-200/60 mt-0.5">{label.rating}</div>
                    {active && (
                      <motion.div
                        layoutId="skillUnderline"
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-0.5 w-8 bg-gold-300 rounded-full"
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
            <p className="text-[11px] text-gold-200/50 mt-2.5 font-mono">{SKILL_LABELS[skill].description}</p>
          </div>

          {/* COLOR SELECTOR */}
          <div className="mb-7">
            <h3 className="font-display text-base md:text-lg text-gold-100 inline-flex items-center gap-2 mb-3">
              <Crown className="w-4 h-4 text-gold-300" />
              Play as
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {(['w', 'random', 'b'] as const).map((c) => {
                const active = c === color;
                const labels = {
                  w: { name: 'White', icon: '♔', sub: 'You move first' },
                  random: { name: 'Random', icon: '🎲', sub: "Let fate decide" },
                  b: { name: 'Black', icon: '♚', sub: 'AI moves first' },
                };
                const l = labels[c];
                return (
                  <motion.button
                    key={c}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => onColorChange(c)}
                    className={`rounded-xl p-4 text-center transition border ${
                      active
                        ? 'bg-gold-300/15 border-gold-300/60 text-gold-100'
                        : 'bg-royal-950/40 border-gold-300/10 text-gold-100/60 hover:border-gold-300/30 hover:text-gold-100/90'
                    }`}
                  >
                    <div className="text-2xl mb-1">{l.icon}</div>
                    <div className="font-display text-sm">{l.name}</div>
                    <div className="text-[10px] font-mono text-gold-200/60 mt-0.5">{l.sub}</div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* START */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            whileHover={{ y: -1 }}
            onClick={onStart}
            className="btn-gold w-full py-3.5 text-base font-semibold inline-flex items-center justify-center gap-2"
          >
            <Sword className="w-4 h-4" />
            Begin the duel
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            whileHover={{ y: -1 }}
            onClick={onOpenMultiplayer}
            className="btn-ghost w-full py-3 mt-2.5 inline-flex items-center justify-center gap-2 text-sm"
          >
            <Users className="w-4 h-4" />
            Play a friend
          </motion.button>

          <button
            onClick={onOpenLegends}
            className="block w-full text-center text-xs font-mono uppercase tracking-[0.25em] text-gold-200/60 hover:text-gold-200 transition mt-4"
          >
            or study famous games →
          </button>
        </motion.div>

        <p className="text-center text-[11px] text-gold-200/40 mt-6 font-mono">
          Real engine • P2P multiplayer • Cinematic replay after every game
        </p>
      </div>
    </section>
  );
}

// Random color picker used by App.tsx
export function resolveColor(choice: PlayerColor | 'random'): PlayerColor {
  if (choice === 'random') return Math.random() < 0.5 ? 'w' : 'b';
  return choice;
}

// helper to surface skill from URL — handy for share links
export { Shuffle };
