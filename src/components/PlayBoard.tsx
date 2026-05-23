import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flag, Handshake, Undo2, RotateCcw, Crown, Loader2, ChevronLeft, Bot, User } from 'lucide-react';
import { ChessBoard } from './ChessBoard';
import { GameOverModal } from './GameOverModal';
import type { UsePlayGameResult } from '../hooks/usePlayGame';
import type { UseNetworkGameResult } from '../hooks/useNetworkGame';
import { SKILL_LABELS } from '../lib/chess-ai';
import type { BoardTheme } from '../types';
import { pieceColor, pieceType } from '../lib/chess-utils';

/** Minimum shape PlayBoard needs to drive a game. Both AI and network hooks satisfy this. */
type GameAPI = UsePlayGameResult | UseNetworkGameResult;

interface Props {
  game: GameAPI;
  theme: BoardTheme;
  onBackToSetup: () => void;
  onSeeCinematicReplay: () => void;
  /** Opponent display label. Defaults to AI skill name. */
  opponentLabel?: string;
  /** Opponent rating display. Defaults to AI skill rating. */
  opponentRating?: string;
  /** Icon style for opponent banner. */
  opponentIcon?: 'ai' | 'human';
  /** Whether to show the "thinking" overlay. AI: true. Network: false. */
  showThinking?: boolean;
  /** Disable undo (used in network games). */
  disableUndo?: boolean;
  /** Draw offer state for network games. */
  drawOffered?: 'none' | 'incoming' | 'outgoing';
  onAcceptDraw?: () => void;
  onDeclineDraw?: () => void;
}

const PIECE_VALUES: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

function calcMaterialDelta(fen: string): { white: number; black: number; delta: number } {
  const board = fen.split(' ')[0]!;
  let white = 0;
  let black = 0;
  for (const ch of board) {
    if (ch === '/' || /\d/.test(ch)) continue;
    const lower = ch.toLowerCase();
    const v = PIECE_VALUES[lower] ?? 0;
    if (ch === ch.toUpperCase()) white += v;
    else black += v;
  }
  return { white, black, delta: white - black };
}

function hasSkill(game: GameAPI): game is UsePlayGameResult {
  return 'skill' in game && typeof (game as UsePlayGameResult).skill === 'number';
}

export function PlayBoard({
  game,
  theme,
  onBackToSetup,
  onSeeCinematicReplay,
  opponentLabel,
  opponentRating,
  opponentIcon = 'ai',
  showThinking = true,
  disableUndo = false,
  drawOffered = 'none',
  onAcceptDraw,
  onDeclineDraw,
}: Props) {
  const [confirmResign, setConfirmResign] = useState(false);
  const [confirmDraw, setConfirmDraw] = useState(false);

  const handlePlayerMove = (from: string, to: string, promotion?: string) => game.userMove(from, to, promotion);

  const material = useMemo(() => calcMaterialDelta(game.fen), [game.fen]);

  const rows = useMemo(() => {
    const out: { num: number; white?: string; black?: string }[] = [];
    for (let i = 0; i < game.history.length; i++) {
      const idx = Math.floor(i / 2);
      if (i % 2 === 0) out.push({ num: idx + 1, white: game.history[i]!.san });
      else out[idx]!.black = game.history[i]!.san;
    }
    return out;
  }, [game.history]);

  // Resolve opponent label/rating — fall back to AI skill info if not provided
  const resolvedLabel = opponentLabel ?? (hasSkill(game) ? SKILL_LABELS[game.skill].name : 'Opponent');
  const resolvedRating = opponentRating ?? (hasSkill(game) ? SKILL_LABELS[game.skill].rating : '');

  return (
    <section className="relative min-h-screen aurora-bg overflow-x-hidden">
      {/* TOP BAR */}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-4 md:px-8 pt-5 pb-4 flex items-center justify-between">
        <button
          onClick={onBackToSetup}
          className="inline-flex items-center gap-1.5 text-gold-200/70 hover:text-gold-100 transition text-sm font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          New game
        </button>
        <div className="text-xs font-mono uppercase tracking-[0.25em] text-gold-200/60 hidden md:block">
          You ({game.playerColor === 'w' ? 'white' : 'black'}) vs <span className="text-gold-200">{resolvedLabel}</span>{resolvedRating ? <> · {resolvedRating}</> : null}
        </div>
      </div>

      {/* INCOMING DRAW OFFER BANNER */}
      <AnimatePresence>
        {drawOffered === 'incoming' && !game.gameOver && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-20 max-w-7xl mx-auto w-full px-4 md:px-8 mb-2"
          >
            <div className="parchment rounded-xl px-4 py-3 flex items-center justify-between border-gold-300/50">
              <div className="inline-flex items-center gap-2 text-sm">
                <Handshake className="w-4 h-4 text-gold-300" />
                <span className="text-gold-100">Your opponent offers a draw.</span>
              </div>
              <div className="flex gap-2">
                <button onClick={onAcceptDraw} className="btn-gold text-xs py-1.5 px-3">
                  Accept
                </button>
                <button onClick={onDeclineDraw} className="btn-ghost text-xs py-1.5 px-3">
                  Decline
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN GRID */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 pb-12 grid lg:grid-cols-[1fr_320px] gap-6 lg:gap-8">
        {/* LEFT: Board + controls */}
        <div className="space-y-4">
          {/* Opponent banner */}
          <div className="parchment rounded-xl px-4 py-3 flex items-center justify-between">
            <div className="inline-flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-violet to-neon-magenta flex items-center justify-center text-sm">
                {opponentIcon === 'human' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
              </span>
              <div>
                <div className="font-display text-sm text-gold-100 leading-tight">{resolvedLabel}</div>
                {resolvedRating && <div className="text-[10px] font-mono text-gold-200/60">{resolvedRating} ELO</div>}
              </div>
            </div>
            <div className="text-right">
              <CapturedRow fen={game.fen} side={game.playerColor === 'w' ? 'b' : 'w'} />
              {material.delta !== 0 && (
                <div className="text-[10px] font-mono text-gold-200/60">
                  {game.playerColor === 'w' ? -material.delta : material.delta} {material.delta !== 0 ? 'material' : ''}
                </div>
              )}
            </div>
          </div>

          {/* Board */}
          <div className="parchment rounded-2xl p-3 md:p-5 relative">
            <ChessBoard
              fen={game.fen}
              theme={theme}
              highlightFrom={game.lastMove?.from}
              highlightTo={game.lastMove?.to}
              draggable={!game.gameOver && !game.aiThinking && game.turn === game.playerColor}
              onMove={handlePlayerMove}
              flipped={game.playerColor === 'b'}
            />
            <AnimatePresence>
              {showThinking && game.aiThinking && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <div className="bg-royal-950/85 backdrop-blur rounded-full px-4 py-2 inline-flex items-center gap-2 border border-neon-violet/40">
                    <Loader2 className="w-3.5 h-3.5 text-neon-violet animate-spin" />
                    <span className="text-xs font-mono text-neon-violet uppercase tracking-widest">
                      {resolvedLabel} is thinking…
                    </span>
                  </div>
                </motion.div>
              )}
              {!showThinking && game.turn !== game.playerColor && !game.gameOver && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <div className="bg-royal-950/85 backdrop-blur rounded-full px-4 py-2 inline-flex items-center gap-2 border border-neon-violet/40">
                    <Loader2 className="w-3.5 h-3.5 text-neon-violet animate-spin" />
                    <span className="text-xs font-mono text-neon-violet uppercase tracking-widest">
                      {resolvedLabel}'s turn…
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Player banner */}
          <div className="parchment rounded-xl px-4 py-3 flex items-center justify-between">
            <div className="inline-flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-300 to-gold-500 flex items-center justify-center text-sm text-royal-950">
                <Crown className="w-4 h-4" />
              </span>
              <div>
                <div className="font-display text-sm text-gold-100 leading-tight">You</div>
                <div className="text-[10px] font-mono text-gold-200/60">{game.playerColor === 'w' ? 'White' : 'Black'}</div>
              </div>
            </div>
            <div className="text-right">
              <CapturedRow fen={game.fen} side={game.playerColor} />
              {material.delta !== 0 && (
                <div className="text-[10px] font-mono text-gold-200/60">
                  {game.playerColor === 'w' ? material.delta : -material.delta} {material.delta !== 0 ? 'material' : ''}
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setConfirmResign(true)}
              disabled={!!game.gameOver}
              className="btn-ghost text-sm py-2.5 inline-flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              <Flag className="w-4 h-4" /> Resign
            </button>
            <button
              onClick={() => setConfirmDraw(true)}
              disabled={!!game.gameOver}
              className="btn-ghost text-sm py-2.5 inline-flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              <Handshake className="w-4 h-4" />
              {drawOffered === 'incoming' ? 'Draw offered' : drawOffered === 'outgoing' ? 'Draw sent' : 'Draw'}
            </button>
            <button
              onClick={game.undo}
              disabled={disableUndo || !!game.gameOver || game.aiThinking || game.history.length === 0}
              className="btn-ghost text-sm py-2.5 inline-flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              <Undo2 className="w-4 h-4" /> Undo
            </button>
          </div>

          {game.inCheck && !game.gameOver && (
            <div className="text-center text-sm font-mono uppercase tracking-widest text-red-300/90">
              ⚠ Check
            </div>
          )}
        </div>

        {/* RIGHT: move list */}
        <aside className="parchment rounded-2xl p-4 lg:sticky lg:top-4 self-start max-h-[calc(100vh-2rem)] flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-base text-gold-100">Move history</h3>
            <span className="text-[10px] font-mono text-gold-200/60">{game.history.length} plies</span>
          </div>
          <div className="overflow-y-auto flex-1 -mx-1 px-1">
            {rows.length === 0 ? (
              <p className="text-sm text-gold-200/50 italic text-center py-8">
                The board awaits its first move…
              </p>
            ) : (
              <ol className="space-y-0.5 text-sm font-mono">
                {rows.map((r) => (
                  <li key={r.num} className="grid grid-cols-[2rem_1fr_1fr] gap-2 px-1.5 py-1 rounded hover:bg-gold-300/5">
                    <span className="text-gold-200/40">{r.num}.</span>
                    <span className="text-gold-100">{r.white ?? ''}</span>
                    <span className="text-gold-100/80">{r.black ?? ''}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </aside>
      </div>

      {/* GAME OVER */}
      <AnimatePresence>
        {game.gameOver && (
          <GameOverModal
            outcome={game.gameOver}
            playerColor={game.playerColor}
            onPlayAgain={onBackToSetup}
            onSeeReplay={onSeeCinematicReplay}
          />
        )}
      </AnimatePresence>

      {/* RESIGN CONFIRM */}
      <AnimatePresence>
        {confirmResign && (
          <ConfirmDialog
            icon={<Flag className="w-5 h-5 text-red-300" />}
            title="Resign this game?"
            body="The AI will be credited with the win and a 'fallen kingdom' lore will be generated."
            confirmText="Resign"
            confirmTone="danger"
            onCancel={() => setConfirmResign(false)}
            onConfirm={() => {
              setConfirmResign(false);
              game.resign();
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmDraw && (
          <ConfirmDialog
            icon={<Handshake className="w-5 h-5 text-gold-300" />}
            title="Offer a draw?"
            body="Both sides agree to split the point. The cinematic replay will close on a peace treaty."
            confirmText="Accept draw"
            confirmTone="primary"
            onCancel={() => setConfirmDraw(false)}
            onConfirm={() => {
              setConfirmDraw(false);
              game.offerDraw();
            }}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

function CapturedRow({ fen, side }: { fen: string; side: 'w' | 'b' }) {
  // Show pieces the other side has captured of THIS side
  const board = fen.split(' ')[0]!;
  const STARTING: Record<string, number> = { p: 8, n: 2, b: 2, r: 2, q: 1 };
  const remaining: Record<string, number> = { p: 0, n: 0, b: 0, r: 0, q: 0 };
  for (const ch of board) {
    if (ch === '/' || /\d/.test(ch)) continue;
    const isWhite = ch === ch.toUpperCase();
    const type = ch.toLowerCase();
    if (side === 'w' && isWhite && type !== 'k') remaining[type] = (remaining[type] ?? 0) + 1;
    if (side === 'b' && !isWhite && type !== 'k') remaining[type] = (remaining[type] ?? 0) + 1;
  }
  const captured: string[] = [];
  for (const t of ['q', 'r', 'b', 'n', 'p']) {
    const lost = (STARTING[t] ?? 0) - (remaining[t] ?? 0);
    for (let i = 0; i < lost; i++) {
      captured.push(side === 'w' ? t.toUpperCase() : t);
    }
  }
  const glyphMap: Record<string, string> = {
    p: '♟', P: '♙', n: '♞', N: '♘', b: '♝', B: '♗', r: '♜', R: '♖', q: '♛', Q: '♕',
  };
  if (captured.length === 0) {
    return <div className="text-[10px] font-mono text-gold-200/40">no captures</div>;
  }
  return (
    <div className="inline-flex flex-wrap gap-0.5 text-base leading-none">
      {captured.map((c, i) => (
        <span key={i} className="text-gold-200/80">{glyphMap[c]}</span>
      ))}
    </div>
  );
}

function ConfirmDialog(props: {
  icon: React.ReactNode;
  title: string;
  body: string;
  confirmText: string;
  confirmTone: 'primary' | 'danger';
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={props.onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="parchment rounded-2xl p-6 max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="inline-flex items-center gap-2 mb-2">
          {props.icon}
          <h3 className="font-display text-lg text-gold-100">{props.title}</h3>
        </div>
        <p className="text-sm text-gold-100/70 mb-5">{props.body}</p>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={props.onCancel} className="btn-ghost text-sm py-2.5">
            Cancel
          </button>
          <button
            onClick={props.onConfirm}
            className={
              props.confirmTone === 'danger'
                ? 'text-sm py-2.5 rounded-lg bg-red-500/15 border border-red-400/40 text-red-200 hover:bg-red-500/25 transition'
                : 'btn-gold text-sm py-2.5'
            }
          >
            {props.confirmText}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// suppress unused-import warnings for utilities imported for future tooling
void pieceColor;
void pieceType;
void RotateCcw;
