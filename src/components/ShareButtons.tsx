import { useState } from 'react';
import { motion } from 'framer-motion';
import { Share2, Copy, Check } from 'lucide-react';
import type { FamousGame } from '../types';

interface Props {
  game: FamousGame;
}

export function ShareButtons({ game }: Props) {
  const [copied, setCopied] = useState(false);

  const url = typeof window !== 'undefined' ? window.location.href : 'https://jaykings-chess-realms.vercel.app';

  const tweet = `Just turned ${game.title} (${game.year}) into a cinematic AI experience on Jayking's Chess Realms ♟️🔥

Built for @Superteam — lore, soundtrack, custom board, full replay video. From notation to legend.

#Superteam
${url}`;

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${tweet}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  };

  return (
    <div className="parchment rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Share2 className="w-4 h-4 text-gold-300" />
        <h3 className="font-display text-base text-gold-100">Spread the Legend</h3>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <motion.a
          whileTap={{ scale: 0.96 }}
          whileHover={{ y: -1 }}
          href={twitterUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-gold text-sm py-2 inline-flex items-center justify-center gap-2"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden>
            <path d="M18.244 2H21l-6.52 7.45L22 22h-6.793l-4.79-6.26L4.84 22H2.08l6.97-7.96L2 2h6.96l4.35 5.74L18.244 2Zm-1.19 18h1.546L7.03 4H5.4l11.654 16Z" />
          </svg>
          Post on X
        </motion.a>
        <motion.button
          whileTap={{ scale: 0.96 }}
          whileHover={{ y: -1 }}
          onClick={copy}
          className="btn-ghost text-sm py-2 inline-flex items-center justify-center gap-2"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy hype text
            </>
          )}
        </motion.button>
      </div>
      <p className="text-[11px] text-gold-200/50 mt-3 font-mono">
        Pre-filled with <span className="text-gold-300">#Superteam</span> + this game's title.
      </p>
    </div>
  );
}
