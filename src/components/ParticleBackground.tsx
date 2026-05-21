import { useEffect, useRef } from 'react';

interface Particle {
  x: number; y: number; vx: number; vy: number;
  size: number; rot: number; vrot: number;
  glyph: string;
  alpha: number;
}

const GLYPHS = ['♟', '♞', '♝', '♜', '♛', '♚'];

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = canvas.width = canvas.clientWidth * devicePixelRatio;
    let h = canvas.height = canvas.clientHeight * devicePixelRatio;

    const onResize = () => {
      w = canvas.width = canvas.clientWidth * devicePixelRatio;
      h = canvas.height = canvas.clientHeight * devicePixelRatio;
    };
    window.addEventListener('resize', onResize);

    const count = Math.min(20, Math.max(8, Math.round(canvas.clientWidth / 90)));
    const particles: Particle[] = Array.from({ length: count }).map(() => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.08 * devicePixelRatio,
      vy: -(0.05 + Math.random() * 0.12) * devicePixelRatio,
      size: (24 + Math.random() * 40) * devicePixelRatio,
      rot: Math.random() * Math.PI * 2,
      vrot: (Math.random() - 0.5) * 0.005,
      glyph: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
      alpha: 0.06 + Math.random() * 0.08,
    }));

    let rafId = 0;
    const step = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy; p.rot += p.vrot;
        if (p.y < -100) { p.y = h + 80; p.x = Math.random() * w; }
        if (p.x < -100) p.x = w + 80;
        if (p.x > w + 100) p.x = -80;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = `rgba(244,197,66,${p.alpha})`;
        ctx.font = `${p.size}px Cinzel, serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.glyph, 0, 0);
        ctx.restore();
      }
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden
    />
  );
}
