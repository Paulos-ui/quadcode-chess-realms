/**
 * Renders a 15-second cinematic clip of the chess game onto a canvas
 * and captures it as a downloadable WebM blob using MediaRecorder.
 *
 * Effects:
 *  • Slow-motion playback of the actual game moves
 *  • Glowing piece trails
 *  • Camera "shake" on captures
 *  • Title card intro (1.5s) + victory burst outro (1.5s)
 *  • Vignette + scanline overlay
 */

import type { ParsedGame } from './chess-utils';
import { fenToBoard, pieceColor, pieceType, isCheckmateFen } from './chess-utils';
import type { BoardTheme, FamousGame } from '../types';

export interface RenderResult {
  blobUrl: string;
  duration: number;
}

export interface RenderProgress {
  pct: number;
  stage: string;
}

const SYMBOLS: Record<string, string> = {
  k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟',
};

/**
 * Public API. Renders ~15s of footage and returns a blob URL.
 * Progress callbacks fire so the UI can show a "directing" feel.
 */
export async function renderCinematicClip(opts: {
  game: FamousGame;
  parsed: ParsedGame;
  theme: BoardTheme;
  onProgress?: (p: RenderProgress) => void;
}): Promise<RenderResult> {
  const { game, parsed, theme, onProgress } = opts;
  const W = 720, H = 720;

  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d', { alpha: false })!;

  const stream = canvas.captureStream(30);
  const mime = pickMime();
  const recorder = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 4_500_000 } : undefined);
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };

  const done = new Promise<Blob>((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: mime || 'video/webm' }));
  });

  recorder.start();
  onProgress?.({ pct: 0, stage: 'Setting up cameras…' });

  // Pace the moves to fit within ~12s (1.5s intro + 1.5s outro)
  const totalMoves = parsed.fens.length - 1; // transitions
  const playSeconds = 12;
  const perMove = Math.max(0.18, playSeconds / Math.max(totalMoves, 1));

  // Intro
  await drawIntro(ctx, W, H, theme, game);
  await sleep(1500);
  onProgress?.({ pct: 12, stage: 'Rolling camera…' });

  // Play moves with motion
  for (let i = 0; i < totalMoves; i++) {
    const fromFen = parsed.fens[i];
    const toFen = parsed.fens[i + 1];
    const move = parsed.moves[i];
    const isCapture = !!move.captured;
    const isMate = isCheckmateFen(toFen);
    await animateMove(ctx, W, H, theme, fromFen, toFen, move.from, move.to, perMove * 1000, isCapture, isMate, i, game);
    onProgress?.({ pct: 12 + Math.round((i / totalMoves) * 70), stage: `Move ${i + 1} of ${totalMoves}…` });
  }
  onProgress?.({ pct: 90, stage: 'Adding finale…' });
  // Outro: hold final position with victory burst
  await drawOutro(ctx, W, H, theme, parsed.fens[parsed.fens.length - 1], game);
  await sleep(1500);

  recorder.stop();
  const blob = await done;
  onProgress?.({ pct: 100, stage: 'Cut. Print.' });
  return { blobUrl: URL.createObjectURL(blob), duration: 15 };
}

function pickMime(): string | null {
  const candidates = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4',
  ];
  for (const c of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(c)) return c;
  }
  return null;
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

// ────────────────────────────────────────────────────────────────────
// Rendering primitives
// ────────────────────────────────────────────────────────────────────

function parseGradient(grad: string, ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): CanvasGradient | string {
  // Theme entries use "linear-gradient(135deg, A 0%, B 100%)"
  const m = grad.match(/linear-gradient\([^,]+,\s*([^,]+?)\s*\d*%?,\s*([^)]+?)\s*\d*%?\)/);
  if (!m) return grad;
  const [_, c1, c2] = m;
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, c1.trim()); g.addColorStop(1, c2.trim());
  return g;
}

function drawBoard(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, theme: BoardTheme, highlight?: { from?: string; to?: string }) {
  const sq = size / 8;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const isLight = (r + c) % 2 === 0;
      const grad = parseGradient(isLight ? theme.light : theme.dark, ctx, x + c * sq, y + r * sq, sq, sq);
      ctx.fillStyle = grad as CanvasGradient;
      ctx.fillRect(x + c * sq, y + r * sq, sq, sq);
    }
  }
  // Border
  ctx.strokeStyle = theme.border;
  ctx.lineWidth = 4;
  ctx.strokeRect(x - 2, y - 2, size + 4, size + 4);

  // Highlights
  if (highlight?.from) {
    const [c, r] = sqToRC(highlight.from);
    ctx.strokeStyle = 'rgba(139,92,246,0.95)';
    ctx.lineWidth = 5;
    ctx.strokeRect(x + c * sq + 3, y + r * sq + 3, sq - 6, sq - 6);
  }
  if (highlight?.to) {
    const [c, r] = sqToRC(highlight.to);
    ctx.strokeStyle = 'rgba(217,70,239,0.95)';
    ctx.lineWidth = 5;
    ctx.strokeRect(x + c * sq + 3, y + r * sq + 3, sq - 6, sq - 6);
  }
}

function sqToRC(sq: string): [number, number] {
  const c = sq.charCodeAt(0) - 'a'.charCodeAt(0);
  const r = 8 - parseInt(sq[1], 10);
  return [c, r];
}

function drawPieces(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, theme: BoardTheme, fen: string, skipSquare?: string) {
  const sq = size / 8;
  const board = fenToBoard(fen);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${Math.floor(sq * 0.78)}px Cinzel, serif`;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p) continue;
      const sqName = String.fromCharCode('a'.charCodeAt(0) + c) + (8 - r);
      if (skipSquare === sqName) continue;
      drawPiece(ctx, x + c * sq + sq / 2, y + r * sq + sq / 2, sq, p, theme);
    }
  }
}

function drawPiece(ctx: CanvasRenderingContext2D, cx: number, cy: number, sq: number, p: string, theme: BoardTheme) {
  const isWhite = pieceColor(p) === 'w';
  const fill = isWhite ? theme.pieceLight : theme.pieceDark;
  const stroke = isWhite ? theme.pieceDark : theme.pieceLight;
  const sym = SYMBOLS[pieceType(p)];

  ctx.save();
  // Soft drop shadow
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;

  if (theme.pieceStyle === 'rune') {
    // Neon outline only
    ctx.lineWidth = 2;
    ctx.strokeStyle = fill;
    ctx.fillStyle = `${theme.accent}33`;
    ctx.fillText(sym, cx, cy + sq * 0.04);
    ctx.strokeText(sym, cx, cy + sq * 0.04);
  } else {
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.6;
    ctx.fillText(sym, cx, cy + sq * 0.04);
    ctx.strokeText(sym, cx, cy + sq * 0.04);
  }
  ctx.restore();
}

function drawBackdrop(ctx: CanvasRenderingContext2D, W: number, H: number) {
  // Radial royal background
  const g = ctx.createRadialGradient(W / 2, H * 0.3, 50, W / 2, H / 2, W * 0.7);
  g.addColorStop(0, '#1a1129');
  g.addColorStop(1, '#08070b');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Subtle vignette
  const v = ctx.createRadialGradient(W / 2, H / 2, W * 0.3, W / 2, H / 2, W * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
}

function drawScanlines(ctx: CanvasRenderingContext2D, W: number, H: number, alpha = 0.06) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#000';
  for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
  ctx.restore();
}

// ── Intro ────────────────────────────────────────────────────────────
async function drawIntro(ctx: CanvasRenderingContext2D, W: number, H: number, theme: BoardTheme, game: FamousGame) {
  const frames = 45;
  for (let f = 0; f < frames; f++) {
    const t = f / frames;
    drawBackdrop(ctx, W, H);
    ctx.save();
    ctx.globalAlpha = Math.min(1, t * 2);
    ctx.fillStyle = '#f4c542';
    ctx.font = 'bold 56px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(game.title.toUpperCase(), W / 2, H / 2 - 30);

    ctx.font = '22px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#e9d8a6';
    ctx.fillText(`${game.white} vs ${game.black}  •  ${game.year}`, W / 2, H / 2 + 30);

    ctx.fillStyle = `${theme.accent}cc`;
    ctx.font = '18px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('JAYKING\'S CHESS REALMS', W / 2, H - 60);
    ctx.restore();

    drawScanlines(ctx, W, H, 0.05);
    await sleep(33);
  }
}

// ── Move animation ───────────────────────────────────────────────────
async function animateMove(
  ctx: CanvasRenderingContext2D,
  W: number, H: number,
  theme: BoardTheme,
  fromFen: string, toFen: string,
  from: string, to: string,
  durMs: number,
  isCapture: boolean,
  isMate: boolean,
  idx: number,
  game: FamousGame,
) {
  const boardSize = Math.min(W, H) - 120;
  const bx = (W - boardSize) / 2;
  const by = (H - boardSize) / 2 + 10;
  const sq = boardSize / 8;

  const [fc, fr] = sqToRC(from);
  const [tc, tr] = sqToRC(to);
  const sx = bx + fc * sq + sq / 2;
  const sy = by + fr * sq + sq / 2;
  const ex = bx + tc * sq + sq / 2;
  const ey = by + tr * sq + sq / 2;

  const board = fenToBoard(fromFen);
  const movedPiece = board[fr][fc];
  if (!movedPiece) return;

  const frames = Math.max(8, Math.round(durMs / 33));
  for (let f = 0; f < frames; f++) {
    const t = f / (frames - 1);
    const eased = easeInOutCubic(t);

    drawBackdrop(ctx, W, H);

    // Camera shake on captures/mate
    let shakeX = 0, shakeY = 0;
    if ((isCapture || isMate) && t < 0.4) {
      const k = (0.4 - t) / 0.4;
      shakeX = (Math.random() - 0.5) * 8 * k;
      shakeY = (Math.random() - 0.5) * 8 * k;
    }

    ctx.save();
    ctx.translate(shakeX, shakeY);

    drawBoard(ctx, bx, by, boardSize, theme, { from, to: t > 0.5 ? to : undefined });
    drawPieces(ctx, bx, by, boardSize, theme, fromFen, from);

    // Glow trail
    const px = sx + (ex - sx) * eased;
    const py = sy + (ey - sy) * eased;
    const glow = ctx.createRadialGradient(px, py, 0, px, py, sq * 0.9);
    glow.addColorStop(0, `${theme.accent}aa`);
    glow.addColorStop(1, `${theme.accent}00`);
    ctx.fillStyle = glow;
    ctx.fillRect(px - sq, py - sq, sq * 2, sq * 2);

    drawPiece(ctx, px, py, sq, movedPiece, theme);

    // Move label
    ctx.fillStyle = '#f4e9c8';
    ctx.font = 'bold 18px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${idx + 1}. ${from}→${to}${isMate ? '#' : ''}`, 40, 40);

    ctx.textAlign = 'right';
    ctx.fillStyle = `${theme.accent}cc`;
    ctx.font = '14px "JetBrains Mono", monospace';
    ctx.fillText(game.subtitle, W - 40, 40);

    ctx.restore();
    drawScanlines(ctx, W, H, 0.05);

    await sleep(33);
  }
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ── Outro ────────────────────────────────────────────────────────────
async function drawOutro(ctx: CanvasRenderingContext2D, W: number, H: number, theme: BoardTheme, finalFen: string, game: FamousGame) {
  const frames = 45;
  const boardSize = Math.min(W, H) - 120;
  const bx = (W - boardSize) / 2;
  const by = (H - boardSize) / 2 + 10;

  for (let f = 0; f < frames; f++) {
    const t = f / frames;
    drawBackdrop(ctx, W, H);
    drawBoard(ctx, bx, by, boardSize, theme);
    drawPieces(ctx, bx, by, boardSize, theme, finalFen);

    // Victory burst — expanding gold ring
    const cx = W / 2, cy = H / 2 + 10;
    const radius = 60 + t * 360;
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - t) * 0.6;
    ctx.strokeStyle = '#f4c542';
    ctx.lineWidth = 5 + (1 - t) * 8;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Title card sliding in
    ctx.save();
    ctx.globalAlpha = Math.min(1, t * 2);
    ctx.fillStyle = '#f4c542';
    ctx.font = 'bold 38px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.fillText(game.result === '1-0' ? 'WHITE WINS' : game.result === '0-1' ? 'BLACK WINS' : 'DRAWN', W / 2, 80);
    ctx.font = '18px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#e9d8a6';
    ctx.fillText(game.title, W / 2, 110);
    ctx.restore();

    drawScanlines(ctx, W, H, 0.06);
    await sleep(33);
  }
}
