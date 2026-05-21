import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Settings2, X, Trophy, Swords } from 'lucide-react';

import { Hero } from './components/Hero';
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

import { FAMOUS_GAMES } from './data/famousGames';
import { useChessGame } from './hooks/useChessGame';
import { useLocalStorage } from './hooks/useLocalStorage';
import { THEMES } from './lib/theme-engine';
import { getStoredApiKey, setStoredApiKey } from './lib/ai-client';
import type { FamousGame, ThemeName } from './types';

export default function App() {
  // default to the Jayking Special — hackathon flair
  const defaultGame = FAMOUS_GAMES.find((g) => g.id === 'jayking-special') ?? FAMOUS_GAMES[0];
  const [activeGame, setActiveGame] = useState<FamousGame>(defaultGame);

  // Theme: keyed by game id so each game remembers its realm. Fall back to game.defaultTheme.
  const [themeMap, setThemeMap] = useLocalStorage<Record<string, ThemeName>>('jkcr_theme_map', {});
  const currentThemeName: ThemeName = themeMap[activeGame.id] ?? activeGame.defaultTheme;
  const currentTheme = THEMES[currentThemeName];

  const game = useChessGame(activeGame.pgn);
  const [battleOn, setBattleOn] = useState(false);

  // Move highlight pulled from parsed.moves[ply-1]
  const lastMove = useMemo(() => {
    if (!game.parsed || game.ply < 1) return null;
    return game.parsed.moves[game.ply - 1] ?? null;
  }, [game.parsed, game.ply]);

  // Settings dialog
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [apiKeyDraft, setApiKeyDraft] = useState('');
  useEffect(() => {
    if (settingsOpen) {
      setApiKeyDraft(getStoredApiKey() ?? '');
    }
  }, [settingsOpen]);

  // When changing games, exit any active battle and reset
  useEffect(() => {
    if (battleOn) {
      game.exitFreePlay();
      setBattleOn(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGame.id]);

  const handlePickGame = (g: FamousGame) => {
    setActiveGame(g);
    // smooth scroll to the detail view
    requestAnimationFrame(() => {
      document.getElementById('stage')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const jumpTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const onToggleBattle = () => {
    if (battleOn) {
      game.exitFreePlay();
      setBattleOn(false);
    } else {
      // jump to current ply position as the starting point of battle
      game.enterFreePlay();
      setBattleOn(true);
      requestAnimationFrame(() => {
        document.getElementById('stage')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  };

  const handleThemeChange = (t: ThemeName) => {
    setThemeMap({ ...themeMap, [activeGame.id]: t });
  };

  // Decide which FEN to show on the board
  const boardFen = battleOn && game.freePlayFen
    ? game.freePlayFen
    : game.parsed
      ? game.parsed.fens[game.ply]
      : 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  return (
    <div className="min-h-screen bg-royal-950 text-gold-50">
      {/* settings (api key) */}
      <button
        onClick={() => setSettingsOpen(true)}
        className="fixed top-4 right-4 z-40 p-2.5 rounded-full bg-royal-900/70 backdrop-blur border border-gold-300/20 text-gold-200 hover:border-gold-300/60 hover:text-gold-100 transition"
        aria-label="Settings"
      >
        <Settings2 className="w-4 h-4" />
      </button>

      {/* hero */}
      <Hero
        onPickGame={handlePickGame}
        onJumpToBrowser={() => jumpTo('famous')}
        onJumpToBattle={() => jumpTo('battle')}
      />

      {/* game selector */}
      <section id="famous" className="relative py-16 px-6 lg:px-10 max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-gold-300/80 font-mono mb-2">
            <Trophy className="w-3.5 h-3.5" />
            Choose your legend
          </div>
          <h2 className="font-display text-3xl md:text-4xl text-gold-100">Famous Legends &amp; Custom Games</h2>
          <p className="text-gold-100/60 mt-2 max-w-2xl">
            Replay a masterpiece or paste your own PGN. Every game gets the cinematic treatment.
          </p>
        </div>
        <GameSelector active={activeGame} onPick={handlePickGame} />
      </section>

      {/* DETAIL VIEW — the heart of the app */}
      <section id="stage" className="relative py-12 px-6 lg:px-10 max-w-7xl mx-auto">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-gold-300/80 font-mono mb-2">
              <Swords className="w-3.5 h-3.5" />
              Now playing
            </div>
            <h2 className="font-display text-3xl md:text-4xl text-gold-100">
              {activeGame.title} {activeGame.flag ? <span className="ml-1">{activeGame.flag}</span> : null}
            </h2>
            <p className="text-gold-100/60 mt-1.5">
              <span className="text-gold-200">{activeGame.white}</span>
              <span className="mx-2 text-gold-200/40">vs</span>
              <span className="text-gold-200">{activeGame.black}</span>
              <span className="mx-2 text-gold-200/40">•</span>
              <span className="font-mono text-gold-200/80">{activeGame.year}</span>
              <span className="mx-2 text-gold-200/40">•</span>
              <span className="font-mono text-gold-200/80">{activeGame.result}</span>
            </p>
          </div>
          {battleOn && (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon-magenta/15 text-neon-magenta border border-neon-magenta/30 text-xs font-mono uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-neon-magenta animate-pulse" />
              Battle mode live
            </span>
          )}
        </div>

        {game.error ? (
          <div className="parchment rounded-xl p-6 text-red-300 border-red-400/30 border">{game.error}</div>
        ) : (
          <div id="battle" className="grid lg:grid-cols-[1.05fr_1fr] gap-6 lg:gap-8">
            {/* LEFT: board + controls + commentary */}
            <div className="space-y-5">
              <div className="parchment rounded-2xl p-4 md:p-5">
                <ChessBoard
                  fen={boardFen}
                  theme={currentTheme}
                  highlightFrom={lastMove?.from}
                  highlightTo={lastMove?.to}
                  draggable={battleOn}
                  onMove={battleOn ? game.makeUserMove : undefined}
                />
                {game.aiThinking && (
                  <div className="mt-3 text-xs font-mono text-neon-violet/80 inline-flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-neon-violet animate-pulse" />
                    Opponent is thinking…
                  </div>
                )}
              </div>

              <GameControls game={game} onToggleBattle={onToggleBattle} battleOn={battleOn} />

              <CommentaryFeed game={activeGame} parsed={game.parsed} ply={game.ply} />
            </div>

            {/* RIGHT: lore + theme + music + video + share */}
            <div id="create" className="space-y-5">
              <LorePanel game={activeGame} />
              <ThemeGenerator current={currentTheme} onChange={handleThemeChange} />
              <MusicPlayer themeName={currentThemeName} />
              <VideoGenerator game={activeGame} parsed={game.parsed} theme={currentTheme} />
              <ShareButtons game={activeGame} />
            </div>
          </div>
        )}
      </section>

      <Footer />
      <BadgeQuadcode />

      {/* API key modal */}
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
                Jayking's Chess Realms uses high-quality bundled writing instead. Stored only in
                your browser's localStorage.
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
              <p className="text-[11px] text-gold-200/50 mt-4 font-mono leading-relaxed">
                ⚠️ Key is sent direct from your browser to the quodedcode. Use a key with
                spend limits — never share this URL with your key embedded.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
