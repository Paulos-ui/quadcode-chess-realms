import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Chess, Move } from 'chess.js';
import { parsePgn, ParsedGame } from '../lib/chess-utils';

export interface UseChessGameResult {
  parsed: ParsedGame | null;
  ply: number;                 // 0 = starting position, N = after Nth move
  isPlaying: boolean;
  speed: number;               // ms per move
  setSpeed: (n: number) => void;
  play: () => void;
  pause: () => void;
  step: (delta: number) => void;
  reset: () => void;
  jumpTo: (ply: number) => void;
  error: string | null;
  // Mini-Battle (free play) state
  freePlayFen: string | null;  // when not null, board is in free play
  enterFreePlay: () => void;
  exitFreePlay: () => void;
  makeUserMove: (from: string, to: string, promotion?: string) => boolean;
  aiThinking: boolean;
}

export function useChessGame(pgn: string): UseChessGameResult {
  const [parsed, setParsed] = useState<ParsedGame | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ply, setPly] = useState(0);
  const [isPlaying, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(900);

  const [freePlayFen, setFreePlayFen] = useState<string | null>(null);
  const [aiThinking, setAiThinking] = useState(false);
  const freeRef = useRef<Chess | null>(null);

  const tick = useRef<number | null>(null);

  useEffect(() => {
    try {
      const p = parsePgn(pgn);
      setParsed(p);
      setError(null);
      setPly(0);
      setPlaying(false);
    } catch (e) {
      console.error(e);
      setParsed(null);
      setError('Could not parse this PGN. Please double-check the moves.');
    }
  }, [pgn]);

  const totalPlies = parsed ? parsed.fens.length - 1 : 0;

  // Autoplay
  useEffect(() => {
    if (!isPlaying || !parsed) return;
    if (ply >= totalPlies) { setPlaying(false); return; }
    tick.current = window.setTimeout(() => setPly((p) => p + 1), speed);
    return () => { if (tick.current) clearTimeout(tick.current); };
  }, [isPlaying, ply, parsed, speed, totalPlies]);

  const play = useCallback(() => {
    if (!parsed) return;
    if (ply >= totalPlies) setPly(0);
    setPlaying(true);
  }, [parsed, ply, totalPlies]);

  const pause = useCallback(() => setPlaying(false), []);
  const step = useCallback((delta: number) => {
    setPlaying(false);
    setPly((p) => Math.max(0, Math.min(totalPlies, p + delta)));
  }, [totalPlies]);
  const reset = useCallback(() => { setPlaying(false); setPly(0); }, []);
  const jumpTo = useCallback((n: number) => {
    setPlaying(false);
    setPly(Math.max(0, Math.min(totalPlies, n)));
  }, [totalPlies]);

  // ── Free play (Mini Battle) ────────────────────────────────
  const enterFreePlay = useCallback(() => {
    const fen = parsed?.fens[ply] ?? new Chess().fen();
    freeRef.current = new Chess(fen);
    setFreePlayFen(fen);
    setPlaying(false);
  }, [parsed, ply]);

  const exitFreePlay = useCallback(() => {
    freeRef.current = null;
    setFreePlayFen(null);
  }, []);

  const makeUserMove = useCallback((from: string, to: string, promotion = 'q') => {
    const g = freeRef.current;
    if (!g) return false;
    let result: Move | null = null;
    try {
      result = g.move({ from, to, promotion }) as Move | null;
    } catch { result = null; }
    if (!result) return false;
    setFreePlayFen(g.fen());

    // AI replies with a random legal move
    if (!g.isGameOver()) {
      setAiThinking(true);
      setTimeout(() => {
        const moves = g.moves({ verbose: true }) as Move[];
        if (moves.length) {
          const pick = moves[Math.floor(Math.random() * moves.length)];
          g.move({ from: pick.from, to: pick.to, promotion: pick.promotion });
          setFreePlayFen(g.fen());
        }
        setAiThinking(false);
      }, 450 + Math.random() * 350);
    }
    return true;
  }, []);

  return useMemo(() => ({
    parsed,
    ply,
    isPlaying,
    speed,
    setSpeed,
    play, pause, step, reset, jumpTo,
    error,
    freePlayFen,
    enterFreePlay, exitFreePlay,
    makeUserMove,
    aiThinking,
  }), [parsed, ply, isPlaying, speed, play, pause, step, reset, jumpTo, error, freePlayFen, enterFreePlay, exitFreePlay, makeUserMove, aiThinking]);
}
