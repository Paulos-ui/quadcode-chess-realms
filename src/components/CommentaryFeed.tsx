import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageSquare, Loader2 } from 'lucide-react';
import { Chess } from 'chess.js';
import type { ParsedGame } from '../lib/chess-utils';
import type { FamousGame, CommentaryEntry } from '../types';
import { generateCommentary } from '../lib/ai-client';

interface Props {
  game: FamousGame;
  parsed: ParsedGame | null;
  ply: number;
}

export function CommentaryFeed({ game, parsed, ply }: Props) {
  const [entries, setEntries] = useState<CommentaryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const cacheRef = useRef(new Map<string, string>());
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset when game changes
  useEffect(() => {
    cacheRef.current.clear();
    setEntries([]);
  }, [game.id]);

  useEffect(() => {
    if (!parsed) return;
    if (ply === 0) return;
    const idx = ply - 1;
    const san = parsed.sans[idx];
    const key = `${game.id}-${idx}-${san}`;
    if (cacheRef.current.has(key)) {
      // Ensure it's in the list
      setEntries((prev) => {
        if (prev.some((e) => e.ply === idx)) return prev;
        return [...prev, { ply: idx, san, text: cacheRef.current.get(key)! }];
      });
      return;
    }

    let cancelled = false;
    setLoading(true);
    const fen = parsed.fens[ply];
    const move = parsed.moves[idx];
    const isMate = san.includes('#');
    const isCheck = san.includes('+');
    const isCapture = !!move.captured;
    (async () => {
      const text = await generateCommentary({
        san, ply: idx, fen, game, isCheck, isMate, isCapture,
      });
      if (cancelled) return;
      cacheRef.current.set(key, text);
      setEntries((prev) => {
        if (prev.some((e) => e.ply === idx)) return prev;
        return [...prev, { ply: idx, san, text }];
      });
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [parsed, ply, game]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  return (
    <div className="parchment rounded-xl p-4 h-64 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs uppercase tracking-widest text-gold-200/70 inline-flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5" /> AI Commentary
        </div>
        {loading && <Loader2 className="w-3.5 h-3.5 text-gold-300 animate-spin" />}
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto pr-1 space-y-2">
        <AnimatePresence initial={false}>
          {entries.length === 0 && (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs text-gold-100/40 italic"
            >
              Start playing to hear the narrator…
            </motion.p>
          )}
          {entries.map((e, i) => (
            <motion.div
              key={e.ply}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="text-[13px] leading-relaxed text-gold-100/90"
            >
              <span className="font-mono text-[10px] text-gold-300/70 mr-1.5">
                {Math.floor(e.ply / 2) + 1}{e.ply % 2 === 0 ? '.' : '…'}
              </span>
              <span className="text-gold-200 font-mono mr-1.5">{e.san}</span>
              <span>— {e.text.replace(new RegExp(`^${escapeRegex(e.san)}\\s*[—-]?\\s*`), '')}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function escapeRegex(s: string) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
