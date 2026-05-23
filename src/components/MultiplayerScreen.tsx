import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Users, Copy, Check, Loader2, ChevronLeft, AlertCircle, Wifi } from 'lucide-react';
import { ParticleBackground } from './ParticleBackground';
import { PlayBoard } from './PlayBoard';
import { useNetworkGame } from '../hooks/useNetworkGame';
import { saveGame } from '../lib/auth';
import type { PlayerColor, GameOver } from '../hooks/usePlayGame';
import type { BoardTheme } from '../types';

type LobbyState =
  | { mode: 'choose' }
  | { mode: 'host'; colorChoice: PlayerColor | 'random' }
  | { mode: 'join'; code: string };

interface Props {
  theme: BoardTheme;
  onBackToSetup: () => void;
  onSeeCinematicReplay: (pgn: string, outcome: GameOver, color: PlayerColor) => void;
  /** If provided, skip the choose step and prefill the join code. */
  initialJoinCode?: string;
  /** Logged-in user id — triggers auto-save when the game ends. */
  userId?: string | null;
}

export function MultiplayerScreen({ theme, onBackToSetup, onSeeCinematicReplay, initialJoinCode, userId }: Props) {
  const [lobby, setLobby] = useState<LobbyState>(
    initialJoinCode ? { mode: 'join', code: initialJoinCode.toUpperCase().slice(0, 6) } : { mode: 'choose' },
  );
  const [activated, setActivated] = useState(false); // when true, useNetworkGame mounts

  if (!activated) {
    return (
      <LobbyView
        lobby={lobby}
        onLobbyChange={setLobby}
        onBack={onBackToSetup}
        onActivate={() => setActivated(true)}
      />
    );
  }

  // From here on, render the active network game (handles lobby-waiting + play)
  return (
    <ActiveNetworkGame
      lobby={lobby}
      theme={theme}
      userId={userId}
      onBackToSetup={onBackToSetup}
      onSeeCinematicReplay={onSeeCinematicReplay}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Lobby UI (before the network hook is mounted)
// ─────────────────────────────────────────────────────────────────────────────

function LobbyView({
  lobby,
  onLobbyChange,
  onBack,
  onActivate,
}: {
  lobby: LobbyState;
  onLobbyChange: (l: LobbyState) => void;
  onBack: () => void;
  onActivate: () => void;
}) {
  return (
    <section className="relative min-h-screen aurora-bg overflow-hidden flex flex-col">
      <ParticleBackground />

      <nav className="relative z-10 max-w-7xl mx-auto w-full px-6 lg:px-10 py-6 flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-gold-200/70 hover:text-gold-100 transition text-sm font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <div className="text-xs font-mono uppercase tracking-[0.25em] text-gold-200/60 inline-flex items-center gap-1.5">
          <Users className="w-3 h-3" />
          Play a friend
        </div>
      </nav>

      <div className="relative z-10 max-w-2xl mx-auto w-full px-6 lg:px-10 py-10 flex-1 flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="text-center mb-8"
        >
          <h1 className="font-display text-4xl md:text-5xl text-gold-100 mb-2">A duel between two souls.</h1>
          <p className="text-gold-100/60">
            One creates the game, one joins by code. Connection is peer-to-peer — no server, no accounts.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {lobby.mode === 'choose' && (
            <motion.div
              key="choose"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4 }}
              className="grid md:grid-cols-2 gap-4"
            >
              <button
                onClick={() => onLobbyChange({ mode: 'host', colorChoice: 'w' })}
                className="parchment rounded-2xl p-6 text-left hover:border-gold-300/60 transition group"
              >
                <Crown className="w-7 h-7 text-gold-300 mb-3 group-hover:scale-110 transition" />
                <h3 className="font-display text-xl text-gold-100 mb-1">Create a game</h3>
                <p className="text-sm text-gold-100/60">
                  You'll get a short code. Send it to your friend, they'll join in seconds.
                </p>
              </button>
              <button
                onClick={() => onLobbyChange({ mode: 'join', code: '' })}
                className="parchment rounded-2xl p-6 text-left hover:border-gold-300/60 transition group"
              >
                <Users className="w-7 h-7 text-gold-300 mb-3 group-hover:scale-110 transition" />
                <h3 className="font-display text-xl text-gold-100 mb-1">Join a game</h3>
                <p className="text-sm text-gold-100/60">Got a code? Type it in. We'll do the rest.</p>
              </button>
            </motion.div>
          )}

          {lobby.mode === 'host' && (
            <motion.div
              key="host"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4 }}
              className="parchment rounded-2xl p-6"
            >
              <h3 className="font-display text-xl text-gold-100 mb-1 inline-flex items-center gap-2">
                <Crown className="w-5 h-5 text-gold-300" />
                Create a game
              </h3>
              <p className="text-sm text-gold-100/60 mb-5">Pick your color, then we'll generate a code.</p>
              <div className="grid grid-cols-3 gap-2 mb-5">
                {(['w', 'random', 'b'] as const).map((c) => {
                  const active = c === lobby.colorChoice;
                  const labels = {
                    w: { name: 'White', icon: '♔', sub: 'You move first' },
                    random: { name: 'Random', icon: '🎲', sub: 'Fate decides' },
                    b: { name: 'Black', icon: '♚', sub: 'Friend moves first' },
                  };
                  const l = labels[c];
                  return (
                    <button
                      key={c}
                      onClick={() => onLobbyChange({ ...lobby, colorChoice: c })}
                      className={`rounded-xl p-4 text-center transition border ${
                        active
                          ? 'bg-gold-300/15 border-gold-300/60 text-gold-100'
                          : 'bg-royal-950/40 border-gold-300/10 text-gold-100/60 hover:border-gold-300/30'
                      }`}
                    >
                      <div className="text-2xl mb-1">{l.icon}</div>
                      <div className="font-display text-sm">{l.name}</div>
                      <div className="text-[10px] font-mono text-gold-200/60 mt-0.5">{l.sub}</div>
                    </button>
                  );
                })}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => onLobbyChange({ mode: 'choose' })} className="btn-ghost py-2.5">
                  Back
                </button>
                <button onClick={onActivate} className="btn-gold py-2.5">
                  Generate code
                </button>
              </div>
            </motion.div>
          )}

          {lobby.mode === 'join' && (
            <motion.div
              key="join"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4 }}
              className="parchment rounded-2xl p-6"
            >
              <h3 className="font-display text-xl text-gold-100 mb-1 inline-flex items-center gap-2">
                <Users className="w-5 h-5 text-gold-300" />
                Join a game
              </h3>
              <p className="text-sm text-gold-100/60 mb-5">
                Type the 6-character code your friend shared.
              </p>
              <input
                autoFocus
                value={lobby.code}
                onChange={(e) =>
                  onLobbyChange({ ...lobby, code: e.target.value.toUpperCase().replace(/[^A-Z2-9]/g, '').slice(0, 6) })
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && lobby.code.length === 6) onActivate();
                }}
                placeholder="A1B2C3"
                className="w-full px-4 py-4 text-center font-display text-3xl tracking-[0.4em] bg-royal-950/80 border border-gold-300/20 rounded-xl text-gold-100 placeholder:text-gold-200/20 focus:outline-none focus:border-gold-300/60 mb-5"
              />
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => onLobbyChange({ mode: 'choose' })} className="btn-ghost py-2.5">
                  Back
                </button>
                <button
                  onClick={onActivate}
                  disabled={lobby.code.length !== 6}
                  className="btn-gold py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Connect
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Active network game — once user has chosen host/join, mount the hook
// ─────────────────────────────────────────────────────────────────────────────

function ActiveNetworkGame({
  lobby,
  theme,
  userId,
  onBackToSetup,
  onSeeCinematicReplay,
}: {
  lobby: LobbyState;
  theme: BoardTheme;
  userId?: string | null;
  onBackToSetup: () => void;
  onSeeCinematicReplay: (pgn: string, outcome: GameOver, color: PlayerColor) => void;
}) {
  const role = lobby.mode === 'host' ? 'host' : 'join';
  const hostColorChoice = lobby.mode === 'host' ? lobby.colorChoice : undefined;
  const joinCode = lobby.mode === 'join' ? lobby.code : undefined;
  const game = useNetworkGame({ role, hostColorChoice, joinCode });
  const [copied, setCopied] = useState(false);
  const savedRef = useRef(false);

  // Auto-save the game when it ends (for logged-in users)
  useEffect(() => {
    if (!game.gameOver || !userId || savedRef.current) return;
    savedRef.current = true;
    const winner: 'w' | 'b' | 'draw' = game.gameOver.winner ?? 'draw';
    void saveGame(userId, {
      opponent_type: 'friend',
      opponent_label: 'Friend',
      opponent_skill: null,
      player_color: game.playerColor,
      winner,
      result_reason: game.gameOver.reason,
      pgn: game.pgn(),
      move_count: game.history.length,
    });
  }, [game.gameOver, userId, game.playerColor, game.history.length, game.pgn]);

  // Once game.gameOver is set, expose the replay handoff
  const handleSeeReplay = () => {
    if (!game.gameOver) return;
    onSeeCinematicReplay(game.pgn(), game.gameOver, game.playerColor);
  };

  // Connecting / waiting / error screen overlays the play board
  const showLobbyOverlay = game.status !== 'connected';

  return (
    <>
      {!showLobbyOverlay && (
        <PlayBoard
          game={game}
          theme={theme}
          opponentLabel="Friend"
          opponentRating="∞"
          opponentIcon="human"
          showThinking={false}
          disableUndo={true}
          drawOffered={game.drawOffered}
          onAcceptDraw={game.acceptDraw}
          onDeclineDraw={game.declineDraw}
          onBackToSetup={onBackToSetup}
          onSeeCinematicReplay={handleSeeReplay}
        />
      )}

      <AnimatePresence>
        {showLobbyOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 aurora-bg flex flex-col"
          >
            <ParticleBackground />
            <div className="relative z-10 max-w-2xl mx-auto w-full px-6 py-10 flex-1 flex flex-col justify-center">
              {game.status === 'opening' || game.status === 'connecting' ? (
                <ConnectingPanel
                  isHost={role === 'host'}
                  message={
                    role === 'host' ? 'Reaching the matchmaking server…' : 'Connecting to your friend…'
                  }
                />
              ) : game.status === 'waiting' ? (
                <HostWaitingPanel code={game.code} copied={copied} onCopy={async () => {
                  try {
                    await navigator.clipboard.writeText(game.code);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  } catch {
                    /* clipboard denied */
                  }
                }} onCancel={onBackToSetup} />
              ) : game.status === 'error' ? (
                <ErrorPanel detail={game.statusDetail} onBack={onBackToSetup} />
              ) : game.status === 'disconnected' ? (
                <ErrorPanel detail={game.statusDetail ?? 'Connection lost'} onBack={onBackToSetup} />
              ) : (
                <ConnectingPanel isHost={role === 'host'} message="Establishing connection…" />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Lobby sub-panels
// ─────────────────────────────────────────────────────────────────────────────

function HostWaitingPanel({
  code,
  copied,
  onCopy,
  onCancel,
}: {
  code: string;
  copied: boolean;
  onCopy: () => void;
  onCancel: () => void;
}) {
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/?join=${code}` : '';
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="parchment rounded-2xl p-8 text-center"
    >
      <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-[0.3em] text-gold-300/80 mb-3">
        <span className="w-1.5 h-1.5 rounded-full bg-gold-300 animate-pulse" />
        Waiting for your friend
      </div>
      <h2 className="font-display text-2xl md:text-3xl text-gold-100 mb-1">Share this code</h2>
      <p className="text-sm text-gold-100/60 mb-6">
        Your friend opens the same site and types this in.
      </p>

      <div className="relative inline-block mb-5">
        <div className="font-display text-5xl md:text-6xl tracking-[0.35em] text-gold-100 select-all bg-royal-950/60 border border-gold-300/30 rounded-2xl px-8 py-5">
          {code || '—'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-6">
        <button onClick={onCopy} className="btn-gold py-2.5 inline-flex items-center justify-center gap-1.5">
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied' : 'Copy code'}
        </button>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(shareUrl);
          }}
          className="btn-ghost py-2.5 inline-flex items-center justify-center gap-1.5 font-mono text-xs"
        >
          Copy invite link
        </button>
      </div>

      <div className="inline-flex items-center gap-2 text-xs text-gold-200/50 font-mono mb-6">
        <Loader2 className="w-3 h-3 animate-spin" />
        Listening for connection…
      </div>

      <div>
        <button onClick={onCancel} className="text-xs text-gold-200/50 hover:text-gold-200 font-mono uppercase tracking-widest">
          Cancel
        </button>
      </div>
    </motion.div>
  );
}

function ConnectingPanel({ isHost, message }: { isHost: boolean; message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="parchment rounded-2xl p-8 text-center"
    >
      <div className="flex justify-center mb-5">
        <div className="relative w-16 h-16">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-full border-2 border-gold-300/30 border-t-gold-300"
          />
          <Wifi className="w-7 h-7 text-gold-200 absolute inset-0 m-auto" />
        </div>
      </div>
      <h2 className="font-display text-2xl text-gold-100 mb-1">
        {isHost ? 'Opening a hall' : 'Approaching the gate'}
      </h2>
      <p className="text-sm text-gold-100/60">{message}</p>
    </motion.div>
  );
}

function ErrorPanel({ detail, onBack }: { detail?: string; onBack: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="parchment rounded-2xl p-8 text-center"
    >
      <AlertCircle className="w-10 h-10 text-red-300 mx-auto mb-4" />
      <h2 className="font-display text-2xl text-gold-100 mb-2">Couldn't make the connection</h2>
      <p className="text-sm text-gold-100/70 mb-6">{detail ?? 'Something went wrong with the link.'}</p>
      <button onClick={onBack} className="btn-gold py-2.5 px-6">
        Back to setup
      </button>
    </motion.div>
  );
}
