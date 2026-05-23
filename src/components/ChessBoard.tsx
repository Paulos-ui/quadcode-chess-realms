import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Chess, type Square } from 'chess.js';
import { fenToBoard, isCheckFen } from '../lib/chess-utils';
import type { BoardTheme } from '../types';
import { PieceGlyph } from '../lib/theme-engine';

interface Props {
  fen: string;
  theme: BoardTheme;
  highlightFrom?: string;
  highlightTo?: string;
  draggable: boolean;
  onMove?: (from: string, to: string, promotion?: string) => boolean;
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

  const sideToMove = (fen.split(' ')[1] as 'w' | 'b') ?? 'w';

  // Selection state for click-to-move
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);

  // Clear selection whenever the position changes (move applied, board reset, etc.)
  useEffect(() => {
    setSelectedSquare(null);
  }, [fen]);

  // Legal destinations from the selected square
  const { legalDests, captureDests } = useMemo(() => {
    if (!selectedSquare) return { legalDests: new Set<string>(), captureDests: new Set<string>() };
    try {
      const chess = new Chess(fen);
      const moves = chess.moves({ square: selectedSquare as Square, verbose: true });
      const legal = new Set<string>();
      const captures = new Set<string>();
      for (const m of moves) {
        legal.add(m.to);
        if (m.captured) captures.add(m.to);
      }
      return { legalDests: legal, captureDests: captures };
    } catch {
      return { legalDests: new Set<string>(), captureDests: new Set<string>() };
    }
  }, [selectedSquare, fen]);

  const pieceAt = (sq: string): string | null => {
    const fileIdx = FILES.indexOf(sq[0]!);
    const rankIdx = parseInt(sq[1]!, 10) - 1;
    if (fileIdx < 0 || rankIdx < 0 || rankIdx > 7) return null;
    const displayR = 7 - rankIdx;
    const displayC = fileIdx;
    return board[displayR][displayC] || null;
  };

  const isOwnPiece = (piece: string | null): boolean => {
    if (!piece) return false;
    return sideToMove === 'w' ? piece === piece.toUpperCase() : piece === piece.toLowerCase();
  };

  const handleSquareClick = (sq: string) => {
    if (!draggable) return;

    const piece = pieceAt(sq);

    // Already have a selection?
    if (selectedSquare) {
      // Clicked the same square — deselect
      if (selectedSquare === sq) {
        setSelectedSquare(null);
        return;
      }
      // Legal destination — make the move
      if (legalDests.has(sq)) {
        onMove?.(selectedSquare, sq);
        setSelectedSquare(null);
        return;
      }
      // Clicked another of your own pieces — switch selection
      if (isOwnPiece(piece)) {
        setSelectedSquare(sq);
        return;
      }
      // Anything else — deselect
      setSelectedSquare(null);
      return;
    }

    // No selection yet — try to select this piece
    if (isOwnPiece(piece)) {
      setSelectedSquare(sq);
    }
  };

  // ─────────────────────── drag-and-drop (kept for desktop muscle memory) ─────
  const [dragFrom, setDragFrom] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (sq: string, e: React.DragEvent) => {
    if (!draggable) return;
    if (!isOwnPiece(pieceAt(sq))) return;
    setDragFrom(sq);
    setSelectedSquare(sq); // also light up legal-dest indicators while dragging
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', sq);
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
    setSelectedSquare(null);
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
          const isSelected = sq === selectedSquare;
          const isLegalDest = legalDests.has(sq);
          const isCaptureDest = captureDests.has(sq);

          const interactive = draggable && (isOwnPiece(piece) || isLegalDest);

          return (
            <div
              key={sq}
              data-sq={sq}
              onClick={() => handleSquareClick(sq)}
              onDragOver={(e) => handleDragOver(sq, e)}
              onDrop={(e) => handleDrop(sq, e)}
              onDragLeave={() => setDragOver((s) => (s === sq ? null : s))}
              className={[
                'relative flex items-center justify-center',
                isFrom ? 'sq-from' : '',
                isTo ? 'sq-to' : '',
                isCheckSq ? 'sq-check' : '',
                isDragOver ? 'sq-highlight' : '',
                interactive ? 'cursor-pointer' : '',
              ].join(' ')}
              style={{
                background: isLight ? theme.light : theme.dark,
              }}
            >
              {/* file / rank labels */}
              {fileIdx === 0 && (
                <span
                  className="absolute top-0.5 left-1 text-[10px] font-mono opacity-50 pointer-events-none"
                  style={{ color: isLight ? '#000' : '#fff' }}
                >
                  {flipped ? rankIdx + 1 : 8 - rankIdx}
                </span>
              )}
              {rankIdx === 7 && (
                <span
                  className="absolute bottom-0.5 right-1 text-[10px] font-mono opacity-50 pointer-events-none"
                  style={{ color: isLight ? '#000' : '#fff' }}
                >
                  {flipped ? FILES[7 - fileIdx] : FILES[fileIdx]}
                </span>
              )}

              {/* Selected square overlay */}
              {isSelected && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: 'rgba(212, 170, 77, 0.28)' }}
                />
              )}

              {/* Legal destination indicator (dot for empty, ring for capture) */}
              {isLegalDest && !isCaptureDest && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div
                    className="rounded-full"
                    style={{
                      width: '32%',
                      height: '32%',
                      background: 'rgba(212, 170, 77, 0.55)',
                      boxShadow: '0 0 12px rgba(212, 170, 77, 0.35)',
                    }}
                  />
                </div>
              )}
              {isCaptureDest && (
                <div
                  className="absolute pointer-events-none"
                  style={{
                    top: '4%',
                    left: '4%',
                    right: '4%',
                    bottom: '4%',
                    borderRadius: '50%',
                    border: '4px solid rgba(212, 170, 77, 0.7)',
                    boxShadow: '0 0 14px rgba(212, 170, 77, 0.4)',
                  }}
                />
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
                    className={`${interactive ? 'cursor-pointer' : 'cursor-default'} pointer-events-auto`}
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
