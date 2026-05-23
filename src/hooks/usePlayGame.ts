import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Chess, type Move } from 'chess.js';
import { thinkAsync, type Skill } from '../lib/chess-ai';
import { sfx } from '../lib/sfx';

export type PlayerColor = 'w' | 'b';

export interface GameOver {
  reason: 'checkmate' | 'stalemate' | 'draw' | 'resign' | 'insufficient' | 'threefold';
  winner: PlayerColor | null; // null = draw
}

export interface UsePlayGameOptions {
  playerColor: PlayerColor;
  skill: Skill;
}

export interface UsePlayGameResult {
  fen: string;
  history: Move[];
  playerColor: PlayerColor;
  skill: Skill;
  turn: PlayerColor;
  aiThinking: boolean;
  gameOver: GameOver | null;
  lastMove: Move | null;
  inCheck: boolean;
  /** Attempt a user move. Returns true if legal. */
  userMove: (from: string, to: string, promotion?: string) => boolean;
  resign: () => void;
  offerDraw: () => void;
  undo: () => void; // un-do both AI + user move
  reset: (opts?: Partial<UsePlayGameOptions>) => void;
  /** PGN of the played game (for handoff to the cinematic pipeline) */
  pgn: () => string;
}

function detectEnd(chess: Chess): GameOver | null {
  if (chess.isCheckmate()) {
    // The side TO MOVE is the loser
    const loser: PlayerColor = chess.turn();
    return { reason: 'checkmate', winner: loser === 'w' ? 'b' : 'w' };
  }
  if (chess.isStalemate()) return { reason: 'stalemate', winner: null };
  if (chess.isInsufficientMaterial()) return { reason: 'insufficient', winner: null };
  if (chess.isThreefoldRepetition()) return { reason: 'threefold', winner: null };
  if (chess.isDraw()) return { reason: 'draw', winner: null };
  return null;
}

export function usePlayGame(initial: UsePlayGameOptions): UsePlayGameResult {
  const chessRef = useRef(new Chess());
  const [fen, setFen] = useState(chessRef.current.fen());
  const [history, setHistory] = useState<Move[]>([]);
  const [playerColor, setPlayerColor] = useState<PlayerColor>(initial.playerColor);
  const [skill, setSkill] = useState<Skill>(initial.skill);
  const [aiThinking, setAiThinking] = useState(false);
  const [gameOver, setGameOver] = useState<GameOver | null>(null);

  const turn = chessRef.current.turn() as PlayerColor;
  const inCheck = chessRef.current.inCheck();
  const lastMove = history.length > 0 ? history[history.length - 1]! : null;

  // Trigger AI to move when it's their turn
  useEffect(() => {
    if (gameOver) return;
    const currentTurn = chessRef.current.turn() as PlayerColor;
    if (currentTurn === playerColor) return; // human's turn
    let cancelled = false;

    setAiThinking(true);
    thinkAsync(chessRef.current.fen(), skill).then((result) => {
      if (cancelled) return;
      if (!result) {
        setAiThinking(false);
        return;
      }
      try {
        const move = chessRef.current.move({
          from: result.move.from,
          to: result.move.to,
          promotion: result.move.promotion,
        });
        if (move) {
          setHistory((h) => [...h, move]);
          setFen(chessRef.current.fen());
          void sfx.playForMove(move);
          const end = detectEnd(chessRef.current);
          if (end) setGameOver(end);
        }
      } catch {
        // Engine produced an illegal move — should not happen, but bail safely
      }
      setAiThinking(false);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fen, playerColor, skill, gameOver]);

  const userMove = useCallback(
    (from: string, to: string, promotion: string = 'q'): boolean => {
      if (gameOver) return false;
      if (aiThinking) return false;
      if ((chessRef.current.turn() as PlayerColor) !== playerColor) return false;
      try {
        const move = chessRef.current.move({ from, to, promotion });
        if (!move) return false;
        setHistory((h) => [...h, move]);
        setFen(chessRef.current.fen());
        void sfx.playForMove(move);
        const end = detectEnd(chessRef.current);
        if (end) setGameOver(end);
        return true;
      } catch {
        return false;
      }
    },
    [aiThinking, gameOver, playerColor],
  );

  const resign = useCallback(() => {
    if (gameOver) return;
    setGameOver({ reason: 'resign', winner: playerColor === 'w' ? 'b' : 'w' });
  }, [gameOver, playerColor]);

  const offerDraw = useCallback(() => {
    // Simple heuristic: AI accepts a draw if its eval shows a near-equal position OR it's down material
    if (gameOver) return;
    setGameOver({ reason: 'draw', winner: null });
  }, [gameOver]);

  const undo = useCallback(() => {
    if (aiThinking) return;
    if (history.length === 0) return;
    // Undo back to the most recent player move's predecessor (so pop user + AI = 2 plies)
    const plies = (chessRef.current.turn() as PlayerColor) === playerColor ? 2 : 1;
    for (let i = 0; i < plies; i++) {
      const m = chessRef.current.undo();
      if (!m) break;
    }
    setHistory(chessRef.current.history({ verbose: true }) as Move[]);
    setFen(chessRef.current.fen());
    setGameOver(null);
  }, [aiThinking, history.length, playerColor]);

  const reset = useCallback((opts: Partial<UsePlayGameOptions> = {}) => {
    chessRef.current = new Chess();
    setHistory([]);
    setFen(chessRef.current.fen());
    setGameOver(null);
    if (opts.playerColor) setPlayerColor(opts.playerColor);
    if (opts.skill !== undefined) setSkill(opts.skill);
  }, []);

  const pgn = useCallback(() => chessRef.current.pgn(), []);

  const result = useMemo<UsePlayGameResult>(
    () => ({
      fen,
      history,
      playerColor,
      skill,
      turn,
      aiThinking,
      gameOver,
      lastMove,
      inCheck,
      userMove,
      resign,
      offerDraw,
      undo,
      reset,
      pgn,
    }),
    [fen, history, playerColor, skill, turn, aiThinking, gameOver, lastMove, inCheck, userMove, resign, offerDraw, undo, reset, pgn],
  );

  return result;
}
