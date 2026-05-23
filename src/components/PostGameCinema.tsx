import { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Swords } from 'lucide-react';
import { ChessBoard } from './ChessBoard';
import { GameControls } from './GameControls';
import { CommentaryFeed } from './CommentaryFeed';
import { LorePanel } from './LorePanel';
import { ThemeGenerator } from './ThemeGenerator';
import { MusicPlayer } from './MusicPlayer';
import { VideoGenerator } from './VideoGenerator';
import { ShareButtons } from './ShareButtons';
import { useChessGame } from '../hooks/useChessGame';
import { THEMES } from '../lib/theme-engine';
import type { FamousGame, ThemeName, BoardTheme } from '../types';
import type { GameOver, PlayerColor } from '../hooks/usePlayGame';

interface Props {
  pgn: string;
  outcome: GameOver;
  playerColor: PlayerColor;
  skillName: string;
  theme: BoardTheme;
  themeName: ThemeName;
  onThemeChange: (t: ThemeName) => void;
  onBackToSetup: () => void;
}

function buildUserGame(pgn: string, outcome: GameOver, playerColor: PlayerColor, skillName: string): FamousGame {
  const result: '1-0' | '0-1' | '1/2-1/2' =
    outcome.winner === null ? '1/2-1/2' : outcome.winner === 'w' ? '1-0' : '0-1';
  const youAre = playerColor === 'w' ? 'White' : 'Black';
  const opponentSide = playerColor === 'w' ? 'Black' : 'White';
  const vsHuman = skillName === 'Friend';
  const opponentRef = vsHuman ? 'your friend' : `the ${skillName}`;
  const flavor =
    outcome.winner === playerColor
      ? `Your finest hour against ${opponentRef}.`
      : outcome.winner === null
      ? `A grueling stalemate against ${opponentRef}.`
      : `Your fall to ${opponentRef} — a worthy duel.`;
  const loreSeed = vsHuman
    ? outcome.winner === playerColor
      ? `A cinematic story of two friends crossing swords on the chessboard — one rising above the other in a moment of clarity. Emphasize the camaraderie, the trash talk, the move that decided it.`
      : outcome.winner === null
      ? `A cinematic story of two friends locked in a draw — every move matched, neither willing to lose, neither able to win.`
      : `A cinematic story of two friends, with one falling to the other's brilliance. Find the moment the game tipped; honor the loss without bitterness.`
    : outcome.winner === playerColor
    ? `A cinematic story of an underdog hero rising from obscurity to defeat a legendary ${skillName.toLowerCase()}-tier opponent in a chess duel. Make it dramatic, full of tension, twists, and a triumphant finale. Emphasize specific moves where momentum shifted.`
    : outcome.winner === null
    ? `A cinematic story of two evenly matched warriors locked in a stalemate, both refusing to fall. End on grudging respect between rivals.`
    : `A cinematic story of a noble protagonist who fought bravely but fell to a stronger ${skillName.toLowerCase()}-tier adversary. Find honor in the loss; foreshadow a return.`;
  return {
    id: 'user-game',
    title: 'Your Game',
    subtitle: vsHuman ? `${youAre} vs your friend` : `${youAre} vs the ${skillName}`,
    white: playerColor === 'w' ? 'You' : skillName,
    black: playerColor === 'b' ? 'You' : skillName,
    year: new Date().getFullYear(),
    result,
    pgn,
    blurb: flavor + ` Playing as ${youAre} against the ${skillName} as ${opponentSide}.`,
    loreSeed,
    defaultTheme: 'royal-nigerian',
  };
}

export function PostGameCinema({
  pgn,
  outcome,
  playerColor,
  skillName,
  theme,
  themeName,
  onThemeChange,
  onBackToSetup,
}: Props) {
  const userGame = useMemo(() => buildUserGame(pgn, outcome, playerColor, skillName), [pgn, outcome, playerColor, skillName]);
  const game = useChessGame(userGame.pgn);

  // Auto-scroll up on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  const lastMove = useMemo(() => {
    if (!game.parsed || game.ply < 1) return null;
    return game.parsed.moves[game.ply - 1] ?? null;
  }, [game.parsed, game.ply]);

  const boardFen = game.parsed ? game.parsed.fens[game.ply] : 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  // Use theme from props (which lives in App state) — but allow override
  const activeTheme = THEMES[themeName] ?? theme;

  const resultLine =
    outcome.winner === null
      ? 'Drawn'
      : outcome.winner === playerColor
      ? 'Victory'
      : 'Defeat';

  return (
    <section className="relative min-h-screen aurora-bg overflow-x-hidden">
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-6 flex items-center justify-between">
        <button
          onClick={onBackToSetup}
          className="inline-flex items-center gap-1.5 text-gold-200/70 hover:text-gold-100 transition text-sm font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to setup
        </button>
        <button
          onClick={onBackToSetup}
          className="btn-gold text-sm py-2 px-4 inline-flex items-center gap-1.5"
        >
          <Swords className="w-4 h-4" />
          Play again
        </button>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-gold-300/80 font-mono mb-2">
            <span className={`w-1.5 h-1.5 rounded-full ${
              outcome.winner === playerColor ? 'bg-gold-300' :
              outcome.winner === null ? 'bg-neon-violet' : 'bg-red-300'
            } animate-pulse`} />
            {resultLine}
          </div>
          <h1 className="font-display text-4xl md:text-5xl text-gold-100 leading-tight">
            Your game, the movie.
          </h1>
          <p className="text-gold-100/60 mt-2 max-w-xl">
            {game.parsed?.moves.length ?? 0} moves between you and the {skillName}.
            Below: the replay, plus all the cinematic toys.
          </p>
        </motion.div>

        {game.error ? (
          <div className="parchment rounded-xl p-6 text-red-300 border-red-400/30 border">{game.error}</div>
        ) : (
          <div className="grid lg:grid-cols-[1.05fr_1fr] gap-6 lg:gap-8">
            <div className="space-y-5">
              <div className="parchment rounded-2xl p-4 md:p-5">
                <ChessBoard
                  fen={boardFen}
                  theme={activeTheme}
                  highlightFrom={lastMove?.from}
                  highlightTo={lastMove?.to}
                  flipped={playerColor === 'b'}
                  draggable={false}
                />
              </div>
              <GameControls game={game} onToggleBattle={() => {}} battleOn={false} />
              <CommentaryFeed game={userGame} parsed={game.parsed} ply={game.ply} />
            </div>

            <div className="space-y-5">
              <LorePanel game={userGame} />
              <ThemeGenerator current={activeTheme} onChange={onThemeChange} />
              <MusicPlayer themeName={themeName} />
              <VideoGenerator game={userGame} parsed={game.parsed} theme={activeTheme} />
              <ShareButtons game={userGame} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
