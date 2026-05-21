import { useState } from 'react';
import { Film, Loader2, Download, Play } from 'lucide-react';
import { renderCinematicClip } from '../lib/video-engine';
import type { ParsedGame } from '../lib/chess-utils';
import type { BoardTheme, FamousGame } from '../types';

interface Props {
  game: FamousGame;
  parsed: ParsedGame | null;
  theme: BoardTheme;
}

export function VideoGenerator({ game, parsed, theme }: Props) {
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [stage, setStage] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const run = async () => {
    if (!parsed) return;
    setBusy(true);
    setErr(null);
    setVideoUrl(null);
    setPct(0);
    try {
      const result = await renderCinematicClip({
        game, parsed, theme,
        onProgress: (p) => { setPct(p.pct); setStage(p.stage); },
      });
      setVideoUrl(result.blobUrl);
    } catch (e) {
      console.error(e);
      setErr('Video capture failed — your browser may not support MediaRecorder. Try Chrome/Edge.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="parchment rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="inline-flex items-center gap-2">
          <Film className="w-4 h-4 text-gold-300" />
          <h3 className="font-display text-base text-gold-100">Victory Clip</h3>
        </div>
        <button
          onClick={run}
          disabled={busy || !parsed}
          className="btn-gold rounded-lg px-3 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
          {busy ? 'Rendering…' : '15s Cinematic'}
        </button>
      </div>

      <p className="text-[12px] text-gold-100/55 leading-relaxed">
        A 15-second movie of the game with glowing trails, camera shake on captures, and a victory burst at the end.
      </p>

      {busy && (
        <div className="mt-3">
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-neon-violet via-neon-magenta to-gold-400 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-1.5 text-[10px] font-mono uppercase text-gold-200/70 inline-flex items-center gap-1.5">
            <Loader2 className="w-3 h-3 animate-spin" /> {stage}
          </div>
        </div>
      )}

      {err && <div className="mt-3 text-xs text-red-300">{err}</div>}

      {videoUrl && !busy && (
        <div className="mt-3 space-y-2">
          <video
            src={videoUrl}
            controls
            autoPlay
            loop
            className="w-full rounded-lg border border-gold-300/20"
          />
          <a
            href={videoUrl}
            download={`${game.id}-cinematic.webm`}
            className="btn-ghost rounded-lg px-3 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Download .webm
          </a>
        </div>
      )}
    </div>
  );
}
