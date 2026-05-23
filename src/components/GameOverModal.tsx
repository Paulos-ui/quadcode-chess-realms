import { motion } from 'framer-motion';
import { Film, Swords, Trophy, Skull, Handshake } from 'lucide-react';
import type { GameOver, PlayerColor } from '../hooks/usePlayGame';

interface Props {
  outcome: GameOver;
  playerColor: PlayerColor;
  onPlayAgain: () => void;
  onSeeReplay: () => void;
}

export function GameOverModal({ outcome, playerColor, onPlayAgain, onSeeReplay }: Props) {
  const isWin = outcome.winner !== null && outcome.winner === playerColor;
  const isLoss = outcome.winner !== null && outcome.winner !== playerColor;
  const isDraw = outcome.winner === null;

  const config = isWin
    ? {
        icon: <Trophy className="w-9 h-9 text-gold-200" />,
        title: 'Victory.',
        subtitle: outcome.reason === 'resign' ? 'Your opponent has fallen on their sword.' : 'You stand alone upon the throne.',
        accent: 'from-gold-300 via-gold-200 to-yellow-100',
        glow: 'shadow-[0_0_120px_rgba(212,170,77,0.5)]',
      }
    : isLoss
    ? {
        icon: <Skull className="w-9 h-9 text-red-300" />,
        title: 'The kingdom has fallen.',
        subtitle: outcome.reason === 'resign' ? 'You laid down your crown.' : 'Defeat. There is honor in the loss.',
        accent: 'from-red-400 via-red-300 to-rose-200',
        glow: 'shadow-[0_0_120px_rgba(248,113,113,0.35)]',
      }
    : {
        icon: <Handshake className="w-9 h-9 text-gold-200" />,
        title: 'A peace is forged.',
        subtitle:
          outcome.reason === 'stalemate'
            ? 'Stalemate. Neither could force the other to bend the knee.'
            : outcome.reason === 'threefold'
            ? 'Threefold repetition. The dance never ends.'
            : outcome.reason === 'insufficient'
            ? 'Insufficient material. Two kings circle in silence.'
            : 'Both sides agreed to lay down their arms.',
        accent: 'from-neon-violet via-purple-300 to-indigo-200',
        glow: 'shadow-[0_0_120px_rgba(167,139,250,0.35)]',
      };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className={`parchment rounded-3xl p-8 md:p-10 max-w-lg w-full text-center relative overflow-hidden ${config.glow}`}
      >
        {/* Decorative top gradient bar */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${config.accent}`} />

        {/* Floating particle accent */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          {[...Array(12)].map((_, i) => (
            <motion.span
              key={i}
              className="absolute text-gold-200/40"
              initial={{
                x: `${Math.random() * 100}%`,
                y: `${Math.random() * 100}%`,
                opacity: 0,
              }}
              animate={{
                y: `${Math.random() * 50 - 25}%`,
                opacity: [0, 0.6, 0],
              }}
              transition={{
                duration: 4 + Math.random() * 4,
                repeat: Infinity,
                delay: i * 0.3,
              }}
            >
              ♟
            </motion.span>
          ))}
        </div>

        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.25, type: 'spring', stiffness: 200, damping: 18 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-royal-950/60 mb-5 relative z-10"
        >
          {config.icon}
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="font-display text-3xl md:text-4xl text-gold-100 mb-2 relative z-10"
        >
          {config.title}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-gold-100/70 text-base md:text-lg mb-7 max-w-sm mx-auto relative z-10"
        >
          {config.subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="space-y-2.5 relative z-10"
        >
          <button onClick={onSeeReplay} className="btn-gold w-full py-3 inline-flex items-center justify-center gap-2 text-base font-semibold">
            <Film className="w-4 h-4" />
            See it as a movie
          </button>
          <button onClick={onPlayAgain} className="btn-ghost w-full py-3 inline-flex items-center justify-center gap-2 text-sm">
            <Swords className="w-4 h-4" />
            Play another
          </button>
        </motion.div>

        <p className="text-[11px] text-gold-200/40 font-mono mt-5 relative z-10">
          {isDraw ? 'Draw' : isWin ? `Win by ${outcome.reason}` : `Loss by ${outcome.reason}`}
        </p>
      </motion.div>
    </motion.div>
  );
}
