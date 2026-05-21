import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollText, Loader2, RefreshCcw, Wand2 } from 'lucide-react';
import type { FamousGame } from '../types';
import { generateLore } from '../lib/ai-client';

interface Props {
  game: FamousGame;
}

const LORE_CACHE_PREFIX = 'jkcr_lore_';

export function LorePanel({ game }: Props) {
  const [lore, setLore] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const cached = localStorage.getItem(`${LORE_CACHE_PREFIX}${game.id}`);
      setLore(cached);
    } catch { setLore(null); }
  }, [game.id]);

  const run = useCallback(async () => {
    setLoading(true);
    const text = await generateLore(game);
    setLore(text);
    try { localStorage.setItem(`${LORE_CACHE_PREFIX}${game.id}`, text); } catch { /* noop */ }
    setLoading(false);
  }, [game]);

  return (
    <div className="parchment rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="inline-flex items-center gap-2">
          <ScrollText className="w-4 h-4 text-gold-300" />
          <h3 className="font-display text-lg text-gold-100">Epic Lore</h3>
        </div>
        <button
          onClick={run}
          disabled={loading}
          className="btn-gold rounded-lg px-3 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : lore ? <RefreshCcw className="w-3.5 h-3.5" /> : <Wand2 className="w-3.5 h-3.5" />}
          {loading ? 'Conjuring…' : lore ? 'Regenerate' : 'Generate Cinematic Lore'}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="text-xs uppercase tracking-widest text-gold-200/60 py-6"
          >
            <span className="inline-flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Calling the narrator model…
            </span>
          </motion.div>
        )}
        {!loading && lore && (
          <motion.div
            key="lore"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="prose-styled text-[14.5px] leading-relaxed text-gold-100/85 whitespace-pre-line max-h-[420px] overflow-y-auto pr-2"
          >
            {lore}
          </motion.div>
        )}
        {!loading && !lore && (
          <motion.p
            key="empty"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-sm text-gold-100/55 italic leading-relaxed"
          >
            Click <em>Generate Cinematic Lore</em> to weave this game into a 300-word movie-script-style legend. Every game is its own myth waiting to be written.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
