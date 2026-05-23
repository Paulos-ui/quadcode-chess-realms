import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Chess, type Move } from 'chess.js';
import { PeerSession, type NetMessage, type PeerStatus } from '../lib/peer-game';
import { sfx } from '../lib/sfx';
import type { PlayerColor, GameOver } from './usePlayGame';

export interface UseNetworkGameResult {
  // Same shape as usePlayGame for component reuse
  fen: string;
  history: Move[];
  playerColor: PlayerColor;
  turn: PlayerColor;
  aiThinking: boolean;     // always false for net games (reused field)
  gameOver: GameOver | null;
  lastMove: Move | null;
  inCheck: boolean;
  userMove: (from: string, to: string, promotion?: string) => boolean;
  resign: () => void;
  offerDraw: () => void;
  undo: () => void;        // no-op in P2P
  reset: () => void;
  pgn: () => string;

  // Network-specific
  status: PeerStatus;
  statusDetail?: string;
  code: string;
  isHost: boolean;
  drawOffered: 'none' | 'incoming' | 'outgoing';
  acceptDraw: () => void;
  declineDraw: () => void;
}

interface UseNetworkGameOptions {
  /** 'host' on the side that opens the game, 'join' on the side that types the code. */
  role: 'host' | 'join';
  /** Provided only by host — their preferred color. Random resolves at game-start. */
  hostColorChoice?: PlayerColor | 'random';
  /** Provided only by joiner — the code typed in. */
  joinCode?: string;
  /** Manual lifecycle — caller controls open. */
  autoOpen?: boolean;
}

function resolveHostColor(choice: PlayerColor | 'random' = 'w'): PlayerColor {
  if (choice === 'random') return Math.random() < 0.5 ? 'w' : 'b';
  return choice;
}

function detectEnd(chess: Chess): GameOver | null {
  if (chess.isCheckmate()) {
    const loser = chess.turn() as PlayerColor;
    return { reason: 'checkmate', winner: loser === 'w' ? 'b' : 'w' };
  }
  if (chess.isStalemate()) return { reason: 'stalemate', winner: null };
  if (chess.isInsufficientMaterial()) return { reason: 'insufficient', winner: null };
  if (chess.isThreefoldRepetition()) return { reason: 'threefold', winner: null };
  if (chess.isDraw()) return { reason: 'draw', winner: null };
  return null;
}

export function useNetworkGame(opts: UseNetworkGameOptions): UseNetworkGameResult {
  const sessionRef = useRef<PeerSession | null>(null);
  if (!sessionRef.current) sessionRef.current = new PeerSession();
  const session = sessionRef.current;

  // Resolve host's color ONCE at mount so 'random' doesn't flip between renders
  // and there's no race between connection-time effects.
  const resolvedHostColorRef = useRef<PlayerColor>(
    opts.role === 'host' ? resolveHostColor(opts.hostColorChoice) : 'b',
  );

  const chessRef = useRef(new Chess());
  const [fen, setFen] = useState(chessRef.current.fen());
  const [history, setHistory] = useState<Move[]>([]);
  const [playerColor, setPlayerColor] = useState<PlayerColor>(resolvedHostColorRef.current);
  const [gameOver, setGameOver] = useState<GameOver | null>(null);

  const [status, setStatus] = useState<PeerStatus>('idle');
  const [statusDetail, setStatusDetail] = useState<string | undefined>(undefined);
  const [code, setCode] = useState('');
  const [drawOffered, setDrawOffered] = useState<'none' | 'incoming' | 'outgoing'>('none');

  const isHost = opts.role === 'host';
  const turn = chessRef.current.turn() as PlayerColor;
  const inCheck = chessRef.current.inCheck();
  const lastMove = history.length > 0 ? history[history.length - 1]! : null;

  // Stable callback to apply a move regardless of source (local or remote)
  const applyMove = useCallback((from: string, to: string, promotion?: string): Move | null => {
    try {
      const m = chessRef.current.move({ from, to, promotion: promotion ?? 'q' });
      if (!m) return null;
      setHistory((h) => [...h, m]);
      setFen(chessRef.current.fen());
      void sfx.playForMove(m);
      const end = detectEnd(chessRef.current);
      if (end) setGameOver(end);
      return m;
    } catch {
      return null;
    }
  }, []);

  // Wire up session handlers
  useEffect(() => {
    session.setHandlers({
      onStatus: (s, d) => {
        setStatus(s);
        setStatusDetail(d);
      },
      onMessage: (msg: NetMessage) => {
        switch (msg.type) {
          case 'gameStart': {
            // Joiner receives this — sets the color the host assigned us
            if (!isHost) {
              setPlayerColor(msg.hostColor === 'w' ? 'b' : 'w');
            }
            break;
          }
          case 'move':
            applyMove(msg.from, msg.to, msg.promotion);
            break;
          case 'resign':
            // Opponent resigned — we win
            setGameOver((prev) => prev ?? { reason: 'resign', winner: playerColor });
            break;
          case 'drawOffer':
            setDrawOffered('incoming');
            break;
          case 'drawAccept':
            setGameOver((prev) => prev ?? { reason: 'draw', winner: null });
            setDrawOffered('none');
            break;
          case 'drawDecline':
            setDrawOffered('none');
            break;
          case 'rematch':
            chessRef.current = new Chess();
            setHistory([]);
            setFen(chessRef.current.fen());
            setGameOver(null);
            setDrawOffered('none');
            break;
        }
      },
    });
  }, [session, applyMove, isHost, playerColor]);

  // Auto-open connection
  useEffect(() => {
    if (opts.autoOpen === false) return;
    let cancelled = false;
    (async () => {
      try {
        if (isHost) {
          const c = await session.openHost();
          if (cancelled) return;
          setCode(c);
        } else {
          if (!opts.joinCode) return;
          setCode(opts.joinCode.toUpperCase());
          await session.openJoin(opts.joinCode);
        }
      } catch {
        // Error already reflected in status
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isHost, opts.autoOpen, opts.joinCode, session]);

  // Host announces game start once the joiner is connected.
  // Uses the color resolved at mount so 'random' is stable.
  useEffect(() => {
    if (status !== 'connected') return;
    if (!isHost) return;
    const hostColor = resolvedHostColorRef.current;
    session.send({ type: 'gameStart', hostColor });
  }, [status, isHost, session]);

  const userMove = useCallback(
    (from: string, to: string, promotion: string = 'q'): boolean => {
      if (gameOver) return false;
      if (status !== 'connected') return false;
      if (turn !== playerColor) return false;
      const m = applyMove(from, to, promotion);
      if (!m) return false;
      session.send({ type: 'move', from, to, promotion });
      return true;
    },
    [applyMove, gameOver, playerColor, session, status, turn],
  );

  const resign = useCallback(() => {
    if (gameOver) return;
    session.send({ type: 'resign' });
    setGameOver({ reason: 'resign', winner: playerColor === 'w' ? 'b' : 'w' });
  }, [gameOver, playerColor, session]);

  const offerDraw = useCallback(() => {
    if (gameOver) return;
    if (drawOffered === 'incoming') {
      session.send({ type: 'drawAccept' });
      setGameOver({ reason: 'draw', winner: null });
      setDrawOffered('none');
      return;
    }
    session.send({ type: 'drawOffer' });
    setDrawOffered('outgoing');
  }, [drawOffered, gameOver, session]);

  const acceptDraw = useCallback(() => {
    session.send({ type: 'drawAccept' });
    setGameOver({ reason: 'draw', winner: null });
    setDrawOffered('none');
  }, [session]);

  const declineDraw = useCallback(() => {
    session.send({ type: 'drawDecline' });
    setDrawOffered('none');
  }, [session]);

  const reset = useCallback(() => {
    session.send({ type: 'rematch' });
    chessRef.current = new Chess();
    setHistory([]);
    setFen(chessRef.current.fen());
    setGameOver(null);
    setDrawOffered('none');
  }, [session]);

  const pgn = useCallback(() => chessRef.current.pgn(), []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      session.destroy();
    };
  }, [session]);

  return useMemo<UseNetworkGameResult>(
    () => ({
      fen,
      history,
      playerColor,
      turn,
      aiThinking: false,
      gameOver,
      lastMove,
      inCheck,
      userMove,
      resign,
      offerDraw,
      undo: () => {
        /* no undo in P2P */
      },
      reset,
      pgn,
      status,
      statusDetail,
      code,
      isHost,
      drawOffered,
      acceptDraw,
      declineDraw,
    }),
    [
      fen,
      history,
      playerColor,
      turn,
      gameOver,
      lastMove,
      inCheck,
      userMove,
      resign,
      offerDraw,
      reset,
      pgn,
      status,
      statusDetail,
      code,
      isHost,
      drawOffered,
      acceptDraw,
      declineDraw,
    ],
  );
}
