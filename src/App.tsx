import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Settings2, X, ChevronLeft, Trophy, Volume2, VolumeX } from 'lucide-react';

import { PlaySetup, resolveColor } from './components/PlaySetup';
import { PlayBoard } from './components/PlayBoard';
import { PostGameCinema } from './components/PostGameCinema';
import { MultiplayerScreen } from './components/MultiplayerScreen';
import { GameSelector } from './components/GameSelector';
import { ChessBoard } from './components/ChessBoard';
import { GameControls } from './components/GameControls';
import { CommentaryFeed } from './components/CommentaryFeed';
import { LorePanel } from './components/LorePanel';
import { ThemeGenerator } from './components/ThemeGenerator';
import { MusicPlayer } from './components/MusicPlayer';
import { VideoGenerator } from './components/VideoGenerator';
import { ShareButtons } from './components/ShareButtons';
import { Footer } from './components/Footer';
import { BadgeQuadcode } from './components/BadgeQuadcode';
import { AuthModal } from './components/AuthModal';
import { UserMenu } from './components/UserMenu';
import { GameHistoryScreen } from './components/GameHistoryScreen';
import { ProfileScreen } from './components/ProfileScreen';

import { FAMOUS_GAMES } from './data/famousGames';
import { useChessGame } from './hooks/useChessGame';
import { usePlayGame, type PlayerColor } from './hooks/usePlayGame';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useAuth } from './hooks/useAuth';
import { THEMES } from './lib/theme-engine';
import { SKILL_LABELS, type Skill } from './lib/chess-ai';
import { getStoredApiKey, setStoredApiKey } from './lib/ai-client';
import { saveGame } from './lib/auth';
import { sfx } from './lib/sfx';
import type { FamousGame, ThemeName } from './types';

type Screen = 'setup' | 'play' | 'multiplayer' | 'cinema' | 'legends' | 'history' | 'profile';

export default function App() {
  const [screen, setScreen] = useState<Screen>('setup');

  // Setup state (persisted)
  const [skill, setSkill] = useLocalStorage<Skill>('jkcr_skill', 2);
  const [colorChoice, setColorChoice] = useLocalStorage<PlayerColor | 'random'>('jkcr_color', 'w');

  // Resolved color for the active game (so 'random' doesn't change between renders)
  const [resolvedColor, setResolvedColor] = useState<PlayerColor>('w');

  // Theme selection (global; persists across screens)
  const [themeName, setThemeName] = useLocalStorage<ThemeName>('jkcr_theme', 'royal-nigerian');
  const theme = THEMES[themeName];

  // Auth (no-op when Supabase isn't configured — UI hides gracefully)
  const auth = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  // Settings modal
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [apiKeyDraft, setApiKeyDraft] = useState('');
  const [soundOn, setSoundOn] = useState(sfx.isEnabled());
  useEffect(() => {
    if (settingsOpen) {
      setApiKeyDraft(getStoredApiKey() ?? '');
      setSoundOn(sfx.isEnabled());
    }
  }, [settingsOpen]);

  // Snapshot of the finished game's PGN + outcome (drives the cinema screen)
  const [snapshot, setSnapshot] = useState<{
    pgn: string;
    outcome: import('./hooks/usePlayGame').GameOver;
    color: PlayerColor;
    skillName: string;
  } | null>(null);

  // Invite link handling: if URL contains ?join=CODE, jump straight to multiplayer
  const [initialJoinCode, setInitialJoinCode] = useState<string | undefined>(undefined);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const join = params.get('join');
    if (join && /^[A-Z2-9]{6}$/.test(join.toUpperCase())) {
      setInitialJoinCode(join.toUpperCase());
      setScreen('multiplayer');
      // Clean the URL so a refresh doesn't re-route
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleStart = () => {
    const color = resolveColor(colorChoice);
    setResolvedColor(color);
    setSnapshot(null);
    setScreen('play');
  };

  const handleBackToSetup = () => {
    setSnapshot(null);
    setScreen('setup');
  };

  const handleOpenLegends = () => setScreen('legends');
  const handleOpenMultiplayer = () => {
    setSnapshot(null);
    setScreen('multiplayer');
  };

  return (
    <div className="min-h-screen bg-royal-950 text-gold-50">
      {/* Top-right cluster: user menu + settings cog */}
      <div className="fixed top-4 right-4 z-40 flex items-center gap-2">
        <UserMenu
          authEnabled={auth.enabled}
          isLoggedIn={!!auth.user}
          profile={auth.profile}
          onSignInClick={() => setAuthOpen(true)}
          onProfileClick={() => setScreen('profile')}
          onHistoryClick={() => setScreen('history')}
          onLogOut={async () => {
            await auth.logOut();
            handleBackToSetup();
          }}
        />
        <button
          onClick={() => setSettingsOpen(true)}
          className="p-2.5 rounded-full bg-royal-900/70 backdrop-blur border border-gold-300/20 text-gold-200 hover:border-gold-300/60 hover:text-gold-100 transition"
          aria-label="Settings"
        >
          <Settings2 className="w-4 h-4" />
        </button>
      </div>

      <AnimatePresence mode="wait">
        {screen === 'setup' && (
          <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            <PlaySetup
              skill={skill}
              color={colorChoice}
              onSkillChange={setSkill}
              onColorChange={setColorChoice}
              onStart={handleStart}
              onOpenLegends={handleOpenLegends}
              onOpenMultiplayer={handleOpenMultiplayer}
            />
          </motion.div>
        )}

        {screen === 'play' && (
          <motion.div key="play" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            <PlayScreen
              color={resolvedColor}
              skill={skill}
              theme={theme}
              userId={auth.user?.id ?? null}
              onBackToSetup={handleBackToSetup}
              onCinema={(pgn, outcome, color, skillName) => {
                setSnapshot({ pgn, outcome, color, skillName });
                setScreen('cinema');
              }}
            />
          </motion.div>
        )}

        {screen === 'multiplayer' && (
          <motion.div key="multiplayer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            <MultiplayerScreen
              theme={theme}
              initialJoinCode={initialJoinCode}
              userId={auth.user?.id ?? null}
              onBackToSetup={() => {
                setInitialJoinCode(undefined);
                handleBackToSetup();
              }}
              onSeeCinematicReplay={(pgn, outcome, color) => {
                setSnapshot({ pgn, outcome, color, skillName: 'Friend' });
                setScreen('cinema');
              }}
            />
          </motion.div>
        )}

        {screen === 'history' && auth.user && (
          <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            <GameHistoryScreen
              user={auth.user}
              onBack={handleBackToSetup}
              onReplay={(pgn, outcome, color, opponentLabel) => {
                setSnapshot({ pgn, outcome, color, skillName: opponentLabel });
                setScreen('cinema');
              }}
            />
          </motion.div>
        )}

        {screen === 'profile' && auth.user && (
          <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            <ProfileScreen
              user={auth.user}
              profile={auth.profile}
              onBack={handleBackToSetup}
              onProfileUpdated={() => auth.refreshProfile()}
            />
          </motion.div>
        )}

        {screen === 'cinema' && snapshot && (
          <motion.div key="cinema" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            <PostGameCinema
              pgn={snapshot.pgn}
              outcome={snapshot.outcome}
              playerColor={snapshot.color}
              skillName={snapshot.skillName}
              theme={theme}
              themeName={themeName}
              onThemeChange={setThemeName}
              onBackToSetup={handleBackToSetup}
            />
          </motion.div>
        )}

        {screen === 'legends' && (
          <motion.div key="legends" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            <LegendsScreen
              themeName={themeName}
              onThemeChange={setThemeName}
              onBack={handleBackToSetup}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {screen === 'setup' && <Footer />}
      <BadgeQuadcode />

      <AnimatePresence>
        {settingsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSettingsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="parchment rounded-2xl p-6 max-w-md w-full relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSettingsOpen(false)}
                className="absolute top-3 right-3 text-gold-200/60 hover:text-gold-100"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
              <h3 className="font-display text-xl text-gold-100 mb-1">Anthropic API key</h3>
              <p className="text-sm text-gold-100/60 mb-4">
                Optional. Add a key to enable live AI lore + per-move commentary. Without one,
                the app uses high-quality bundled writing instead. Stored only in your browser.
              </p>
              <input
                type="password"
                value={apiKeyDraft}
                onChange={(e) => setApiKeyDraft(e.target.value)}
                placeholder="sk-ant-…"
                className="w-full px-3 py-2.5 rounded-lg bg-royal-950/80 border border-gold-300/20 text-gold-100 font-mono text-sm placeholder:text-gold-200/30 focus:outline-none focus:border-gold-300/60"
              />
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => {
                    setStoredApiKey(apiKeyDraft.trim() || null);
                    setSettingsOpen(false);
                  }}
                  className="btn-gold flex-1"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setStoredApiKey(null);
                    setApiKeyDraft('');
                  }}
                  className="btn-ghost"
                >
                  Clear
                </button>
              </div>

              {/* Sound toggle */}
              <div className="mt-5 pt-5 border-t border-gold-300/10">
                <button
                  onClick={() => {
                    const next = !soundOn;
                    setSoundOn(next);
                    sfx.setEnabled(next);
                  }}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg bg-royal-950/40 border border-gold-300/20 hover:border-gold-300/40 transition"
                >
                  <span className="inline-flex items-center gap-2">
                    {soundOn ? (
                      <Volume2 className="w-4 h-4 text-gold-200" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-gold-200/60" />
                    )}
                    <span className="text-sm text-gold-100">Move sounds</span>
                  </span>
                  <span className={`text-[10px] font-mono uppercase tracking-widest ${soundOn ? 'text-gold-200' : 'text-gold-200/50'}`}>
                    {soundOn ? 'On' : 'Off'}
                  </span>
                </button>
              </div>

              <p className="text-[11px] text-gold-200/50 mt-4 font-mono leading-relaxed">
                ⚠ Key is sent direct from your browser to the Anthropic API. Use a key with
                spend limits.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auth modal */}
      <AnimatePresence>
        {authOpen && (
          <AuthModal
            onClose={() => setAuthOpen(false)}
            onAuthenticated={() => setAuthOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PlayScreen — wires up usePlayGame and renders PlayBoard
// ─────────────────────────────────────────────────────────────────────────────

interface PlayScreenProps {
  color: PlayerColor;
  skill: Skill;
  theme: import('./types').BoardTheme;
  userId: string | null;
  onBackToSetup: () => void;
  onCinema: (pgn: string, outcome: import('./hooks/usePlayGame').GameOver, color: PlayerColor, skillName: string) => void;
}

function PlayScreen({ color, skill, theme, userId, onBackToSetup, onCinema }: PlayScreenProps) {
  const game = usePlayGame({ playerColor: color, skill });
  const skillName = SKILL_LABELS[skill].name;
  const savedRef = useRef(false);

  // Auto-save completed game when user is logged in
  useEffect(() => {
    if (!game.gameOver || !userId || savedRef.current) return;
    savedRef.current = true;
    const winner: 'w' | 'b' | 'draw' = game.gameOver.winner ?? 'draw';
    void saveGame(userId, {
      opponent_type: 'ai',
      opponent_label: skillName,
      opponent_skill: skill,
      player_color: color,
      winner,
      result_reason: game.gameOver.reason,
      pgn: game.pgn(),
      move_count: game.history.length,
    });
  }, [game.gameOver, userId, skill, color, skillName, game.history.length, game.pgn]);

  return (
    <PlayBoard
      game={game}
      theme={theme}
      onBackToSetup={onBackToSetup}
      onSeeCinematicReplay={() => {
        if (!game.gameOver) return;
        onCinema(game.pgn(), game.gameOver, color, skillName);
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LegendsScreen — the secondary "study famous games" experience
// ─────────────────────────────────────────────────────────────────────────────

interface LegendsScreenProps {
  themeName: ThemeName;
  onThemeChange: (t: ThemeName) => void;
  onBack: () => void;
}

function LegendsScreen({ themeName, onThemeChange, onBack }: LegendsScreenProps) {
  const [active, setActive] = useState<FamousGame>(FAMOUS_GAMES[3] ?? FAMOUS_GAMES[0]!);
  const game = useChessGame(active.pgn);
  const theme = THEMES[themeName];

  const lastMove = useMemo(() => {
    if (!game.parsed || game.ply < 1) return null;
    return game.parsed.moves[game.ply - 1] ?? null;
  }, [game.parsed, game.ply]);

  const boardFen = game.parsed ? game.parsed.fens[game.ply] : 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  return (
    <section className="relative min-h-screen aurora-bg overflow-x-hidden">
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-6 flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-gold-200/70 hover:text-gold-100 transition text-sm font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to play
        </button>
        <div className="text-xs font-mono uppercase tracking-[0.25em] text-gold-200/60 inline-flex items-center gap-1.5">
          <Trophy className="w-3 h-3" />
          Study Legends
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="font-display text-4xl md:text-5xl text-gold-100">Famous Legends</h1>
          <p className="text-gold-100/60 mt-2 max-w-xl">
            Replay history's masterpieces — or paste your own PGN to make it cinematic.
          </p>
        </motion.div>

        <GameSelector active={active} onPick={setActive} />

        <div className="my-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl text-gold-100">
              {active.title} {active.flag ? <span>{active.flag}</span> : null}
            </h2>
            <p className="text-gold-100/60 mt-1.5">
              <span className="text-gold-200">{active.white}</span>
              <span className="mx-2 text-gold-200/40">vs</span>
              <span className="text-gold-200">{active.black}</span>
              <span className="mx-2 text-gold-200/40">•</span>
              <span className="font-mono text-gold-200/80">{active.year}</span>
              <span className="mx-2 text-gold-200/40">•</span>
              <span className="font-mono text-gold-200/80">{active.result}</span>
            </p>
          </div>
        </div>

        {game.error ? (
          <div className="parchment rounded-xl p-6 text-red-300 border-red-400/30 border">{game.error}</div>
        ) : (
          <div className="grid lg:grid-cols-[1.05fr_1fr] gap-6 lg:gap-8">
            <div className="space-y-5">
              <div className="parchment rounded-2xl p-4 md:p-5">
                <ChessBoard
                  fen={boardFen}
                  theme={theme}
                  highlightFrom={lastMove?.from}
                  highlightTo={lastMove?.to}
                />
              </div>
              <GameControls game={game} onToggleBattle={() => {}} battleOn={false} />
              <CommentaryFeed game={active} parsed={game.parsed} ply={game.ply} />
            </div>

            <div className="space-y-5">
              <LorePanel game={active} />
              <ThemeGenerator current={theme} onChange={onThemeChange} />
              <MusicPlayer themeName={themeName} />
              <VideoGenerator game={active} parsed={game.parsed} theme={theme} />
              <ShareButtons game={active} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}