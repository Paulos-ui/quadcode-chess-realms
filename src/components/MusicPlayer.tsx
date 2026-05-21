import { useEffect, useRef, useState } from 'react';
import { Music2, Loader2, Play, Square } from 'lucide-react';
import type { ThemeName } from '../types';
import { generateAndPlay, stopMusic, type PlayingTrack } from '../lib/music-engine';

interface Props {
  themeName: ThemeName;
}

export function MusicPlayer({ themeName }: Props) {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const trackRef = useRef<PlayingTrack | null>(null);
  const tickRef = useRef<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    return () => {
      // cleanup on unmount
      trackRef.current?.stop();
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  const start = async () => {
    setLoading(true);
    try {
      const track = await generateAndPlay(themeName);
      trackRef.current = track;
      setPlaying(true);
      setElapsed(0);
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = window.setInterval(() => {
        setElapsed((e) => {
          if (!trackRef.current?.isPlaying()) {
            if (tickRef.current) clearInterval(tickRef.current);
            setPlaying(false);
            return 0;
          }
          return Math.min(60, e + 1);
        });
      }, 1000);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  const stop = () => {
    stopMusic();
    trackRef.current = null;
    setPlaying(false);
    setElapsed(0);
    if (tickRef.current) clearInterval(tickRef.current);
  };

  const pct = (elapsed / 60) * 100;

  return (
    <div className="parchment rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="inline-flex items-center gap-2">
          <Music2 className="w-4 h-4 text-gold-300" />
          <h3 className="font-display text-base text-gold-100">Epic Soundtrack</h3>
        </div>
        {playing ? (
          <button onClick={stop} className="btn-ghost rounded-lg px-3 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5">
            <Square className="w-3.5 h-3.5" /> Stop
          </button>
        ) : (
          <button onClick={start} disabled={loading} className="btn-gold rounded-lg px-3 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            {loading ? 'Composing…' : 'Generate'}
          </button>
        )}
      </div>

      <p className="text-[12px] text-gold-100/55 leading-relaxed">
        A 60-second orchestral track synthesized live — tense strings, deep drums, and a climactic bell.
      </p>

      {/* Progress bar */}
      <div className="mt-3 h-1 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-gold-400 via-gold-200 to-gold-400 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1.5 text-[10px] font-mono text-gold-200/60 flex justify-between">
        <span>{formatTime(elapsed)}</span>
        <span>1:00</span>
      </div>

      {/* Visual EQ during play */}
      {playing && (
        <div className="mt-3 flex items-end justify-center gap-1 h-8">
          {Array.from({ length: 14 }).map((_, i) => (
            <span
              key={i}
              className="w-1.5 rounded-sm bg-gold-300/80"
              style={{
                height: `${20 + Math.abs(Math.sin((Date.now() / 250) + i)) * 80}%`,
                animation: 'pulseGlow 1.6s ease-in-out infinite',
                animationDelay: `${i * 0.07}s`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}
