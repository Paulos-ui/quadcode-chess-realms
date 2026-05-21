import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw, Swords } from 'lucide-react';
import type { UseChessGameResult } from '../hooks/useChessGame';

interface Props {
  game: UseChessGameResult;
  onToggleBattle: () => void;
  battleOn: boolean;
}

export function GameControls({ game, onToggleBattle, battleOn }: Props) {
  const total = game.parsed ? game.parsed.fens.length - 1 : 0;

  return (
    <div className="parchment rounded-xl p-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => game.step(-1)}
            disabled={game.ply === 0 || battleOn}
            className="btn-ghost w-10 h-10 rounded-lg inline-flex items-center justify-center disabled:opacity-30"
            aria-label="Step back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => (game.isPlaying ? game.pause() : game.play())}
            disabled={battleOn}
            className="btn-gold rounded-xl px-5 h-10 inline-flex items-center gap-2 font-semibold disabled:opacity-40"
            aria-label={game.isPlaying ? 'Pause' : 'Play'}
          >
            {game.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {game.isPlaying ? 'Pause' : 'Play'}
          </motion.button>

          <button
            onClick={() => game.step(1)}
            disabled={game.ply >= total || battleOn}
            className="btn-ghost w-10 h-10 rounded-lg inline-flex items-center justify-center disabled:opacity-30"
            aria-label="Step forward"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <button
            onClick={() => game.reset()}
            disabled={battleOn}
            className="btn-ghost w-10 h-10 rounded-lg inline-flex items-center justify-center disabled:opacity-30"
            aria-label="Reset"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-3 flex-1 min-w-[200px]">
          <span className="text-[10px] font-mono uppercase text-gold-200/70">Speed</span>
          <input
            type="range"
            min={300}
            max={2200}
            step={100}
            value={2500 - game.speed}
            onChange={(e) => game.setSpeed(2500 - parseInt(e.target.value, 10))}
            className="flex-1"
            disabled={battleOn}
          />
        </div>

        <button
          onClick={onToggleBattle}
          className={[
            'rounded-xl px-4 h-10 inline-flex items-center gap-2 text-sm font-semibold transition',
            battleOn
              ? 'bg-neon-magenta/20 border border-neon-magenta/60 text-neon-magenta'
              : 'btn-ghost',
          ].join(' ')}
        >
          <Swords className="w-4 h-4" />
          {battleOn ? 'Exit Battle' : 'Mini Battle'}
        </button>
      </div>

      {/* Move scrubber */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-[10px] font-mono uppercase text-gold-200/60 mb-1.5">
          <span>{battleOn ? 'Free Play' : `Move ${game.ply} / ${total}`}</span>
          <span>{game.parsed?.sans[game.ply - 1] || (game.ply === 0 ? 'Opening' : '')}</span>
        </div>
        <input
          type="range"
          min={0}
          max={total}
          value={game.ply}
          onChange={(e) => game.jumpTo(parseInt(e.target.value, 10))}
          className="w-full"
          disabled={battleOn}
        />
      </div>
    </div>
  );
}
