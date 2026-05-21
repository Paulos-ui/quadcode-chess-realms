import { useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fenToBoard, isCheckFen } from '../lib/chess-utils';
import type { BoardTheme } from '../types';
import { PieceGlyph } from '../lib/theme-engine';

interface Props {
  fen: string;
  theme: BoardTheme;
  highlightFrom?: string;
  highlightTo?: string;
  draggable: boolean;
  onMove?: (from: string, to: string) => boolean;
  flipped?: boolean;
}

const FILES = 'abcdefgh';

function squareName(fileIdx: number, rankIdx: number, flipped: boolean) {
  const f = flipped ? 7 - fileIdx : fileIdx;
  const r = flipped ? rankIdx : 7 - rankIdx;
  return FILES[f] + (r + 1);
}

export function ChessBoard({ fen, theme, highlightFrom, highlightTo, draggable, onMove, flipped = false }: Props) {
  const board = useMemo(() => fenToBoard(fen), [fen]);
  const inCheck = useMemo(() => isCheckFen(fen), [fen]);

  // Find king square for the side in check
  const kingInCheckSq = useMemo(() => {
    if (!inCheck) return null;
    const sideToMove = fen.split(' ')[1]; // 'w' or 'b'
    const target = sideToMove === 'w' ? 'K' : 'k';
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c] === target) {
          return FILES[c] + (8 - r);
        }
      }
    }
    return null;
  }, [board, inCheck, fen]);

  const [dragFrom, setDragFrom] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (sq: string, e: React.DragEvent) => {
    if (!draggable) return;
    setDragFrom(sq);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', sq);
    // Tiny transparent ghost
    const img = new Image();
    img.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>';
    e.dataTransfer.setDragImage(img, 0, 0);
  };

  const handleDragOver = (sq: string, e: React.DragEvent) => {
    if (!draggable) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOver !== sq) setDragOver(sq);
  };

  const handleDrop = (sq: string, e: React.DragEvent) => {
    if (!draggable) return;
    e.preventDefault();
    const from = e.dataTransfer.getData('text/plain') || dragFrom;
    setDragFrom(null);
    setDragOver(null);
    if (!from || from === sq) return;
    onMove?.(from, sq);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-square select-none rounded-2xl overflow-hidden"
      style={{
        boxShadow: theme.glow,
        border: `2px solid ${theme.border}`,
      }}
    >
      {/* Outer frame glow */}
      <div className="absolute inset-0 pointer-events-none rounded-2xl" style={{ boxShadow: `inset 0 0 60px ${theme.border}` }} />

      <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
        {Array.from({ length: 64 }).map((_, idx) => {
          const fileIdx = idx % 8;
          const rankIdx = Math.floor(idx / 8);
          const sq = squareName(fileIdx, rankIdx, flipped);
          const displayR = flipped ? 7 - rankIdx : rankIdx;
          const displayC = flipped ? 7 - fileIdx : fileIdx;
          const piece = board[displayR][displayC];
          const isLight = (displayR + displayC) % 2 === 0;
          const isFrom = sq === highlightFrom;
          const isTo = sq === highlightTo;
          const isCheckSq = sq === kingInCheckSq;
          const isDragOver = sq === dragOver;

          return (
            <div
              key={sq}
              data-sq={sq}
              onDragOver={(e) => handleDragOver(sq, e)}
              onDrop={(e) => handleDrop(sq, e)}
              onDragLeave={() => setDragOver((s) => (s === sq ? null : s))}
              className={[
                'relative flex items-center justify-center',
                isFrom ? 'sq-from' : '',
                isTo ? 'sq-to' : '',
                isCheckSq ? 'sq-check' : '',
                isDragOver ? 'sq-highlight' : '',
              ].join(' ')}
              style={{
                background: isLight ? theme.light : theme.dark,
              }}
            >
              {/* file / rank labels */}
              {fileIdx === 0 && (
                <span
                  className="absolute top-0.5 left-1 text-[10px] font-mono opacity-50"
                  style={{ color: isLight ? '#000' : '#fff' }}
                >
                  {flipped ? rankIdx + 1 : 8 - rankIdx}
                </span>
              )}
              {rankIdx === 7 && (
                <span
                  className="absolute bottom-0.5 right-1 text-[10px] font-mono opacity-50"
                  style={{ color: isLight ? '#000' : '#fff' }}
                >
                  {flipped ? FILES[7 - fileIdx] : FILES[fileIdx]}
                </span>
              )}

              <AnimatePresence mode="popLayout">
                {piece && (
                  <motion.div
                    key={`${sq}-${piece}`}
                    layoutId={`${piece}-${sq}`}
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.6, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                    draggable={draggable}
                    onDragStart={(e) => handleDragStart(sq, e as unknown as React.DragEvent)}
                    className={`cursor-${draggable ? 'grab' : 'default'} pointer-events-auto`}
                    style={{ filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.5))' }}
                  >
                    <PieceGlyph piece={piece} theme={theme} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
