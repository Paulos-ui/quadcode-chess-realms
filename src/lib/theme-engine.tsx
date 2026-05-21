import type { BoardTheme, ThemeName } from '../types';

export const THEMES: Record<ThemeName, BoardTheme> = {
  'royal-nigerian': {
    name: 'royal-nigerian',
    label: 'Royal Nigerian',
    light: 'linear-gradient(135deg, #f9eccf 0%, #e9c46a 100%)',
    dark: 'linear-gradient(135deg, #0c5c36 0%, #053a22 100%)',
    border: 'rgba(244,197,66,0.55)',
    glow: '0 0 60px -10px rgba(0,135,81,0.5)',
    pieceStyle: 'classic',
    pieceLight: '#fff8e7',
    pieceDark: '#0b0a10',
    accent: '#008751',
    description: 'Emerald palace squares, ivory & onyx kings. Inspired by Lagos at dusk.',
  },
  cyberpunk: {
    name: 'cyberpunk',
    label: 'Cyberpunk',
    light: 'linear-gradient(135deg, #1a1042 0%, #2b1265 100%)',
    dark: 'linear-gradient(135deg, #050208 0%, #120726 100%)',
    border: 'rgba(34,211,238,0.55)',
    glow: '0 0 80px -10px rgba(217,70,239,0.5)',
    pieceStyle: 'rune',
    pieceLight: '#22d3ee',
    pieceDark: '#d946ef',
    accent: '#22d3ee',
    description: 'Neon-circuit board. Pieces hum with electric current.',
  },
  fantasy: {
    name: 'fantasy',
    label: 'Fantasy',
    light: 'linear-gradient(135deg, #d8c089 0%, #a07f3e 100%)',
    dark: 'linear-gradient(135deg, #2a1810 0%, #4a2818 100%)',
    border: 'rgba(244,197,66,0.5)',
    glow: '0 0 60px -10px rgba(180,120,40,0.55)',
    pieceStyle: 'glyph',
    pieceLight: '#f8e9c2',
    pieceDark: '#1a0e08',
    accent: '#c89a4e',
    description: 'Carved oak and lion-bone ivory. The age of dragons.',
  },
  classic: {
    name: 'classic',
    label: 'Classic',
    light: 'linear-gradient(135deg, #f0d9b5 0%, #d8b88a 100%)',
    dark: 'linear-gradient(135deg, #b58863 0%, #8b5a3c 100%)',
    border: 'rgba(244,197,66,0.45)',
    glow: '0 0 50px -10px rgba(244,197,66,0.4)',
    pieceStyle: 'classic',
    pieceLight: '#fffaf0',
    pieceDark: '#1a1410',
    accent: '#f4c542',
    description: 'Timeless tournament wood. As Anderssen would have played.',
  },
};

export const THEME_ROTATION: ThemeName[] = ['royal-nigerian', 'cyberpunk', 'fantasy', 'classic'];

export function nextTheme(current: ThemeName): ThemeName {
  const idx = THEME_ROTATION.indexOf(current);
  return THEME_ROTATION[(idx + 1) % THEME_ROTATION.length];
}

/**
 * Generate an SVG glyph for a chess piece given the active theme.
 * pieceChar is a chess.js style letter: KQRBNP / kqrbnp (upper = white)
 */
export function PieceGlyph({
  piece,
  theme,
  size = 56,
}: {
  piece: string;
  theme: BoardTheme;
  size?: number;
}) {
  const isWhite = piece === piece.toUpperCase();
  const fill = isWhite ? theme.pieceLight : theme.pieceDark;
  const stroke = isWhite ? theme.pieceDark : theme.pieceLight;

  if (theme.pieceStyle === 'rune') {
    return runeGlyph(piece, fill, theme.accent, size);
  }
  if (theme.pieceStyle === 'glyph') {
    return glyphGlyph(piece, fill, stroke, size);
  }
  return classicGlyph(piece, fill, stroke, size);
}

// ────────────────────────────────────────────────────────────────────
// SVG glyph builders
// Each returns a JSX element. We keep them simple but characterful.
// ────────────────────────────────────────────────────────────────────

function classicGlyph(piece: string, fill: string, stroke: string, size: number) {
  const symbols: Record<string, string> = {
    k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟',
  };
  const sym = symbols[piece.toLowerCase()];
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <defs>
        <filter id="cs" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.45" />
        </filter>
      </defs>
      <text
        x="50"
        y="78"
        textAnchor="middle"
        fontFamily="'Cinzel', serif"
        fontSize="84"
        fill={fill}
        stroke={stroke}
        strokeWidth={1.2}
        paintOrder="stroke"
        filter="url(#cs)"
      >
        {sym}
      </text>
    </svg>
  );
}

function glyphGlyph(piece: string, fill: string, stroke: string, size: number) {
  // Adds a runic ring behind the Unicode piece for a fantasy vibe
  const symbols: Record<string, string> = {
    k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟',
  };
  const sym = symbols[piece.toLowerCase()];
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <circle cx="50" cy="50" r="40" fill="none" stroke={stroke} strokeOpacity="0.18" strokeWidth={2} />
      <circle cx="50" cy="50" r="32" fill="none" stroke={stroke} strokeOpacity="0.12" strokeWidth={1} strokeDasharray="2 3" />
      <text
        x="50"
        y="78"
        textAnchor="middle"
        fontFamily="'Cinzel', serif"
        fontSize="80"
        fill={fill}
        stroke={stroke}
        strokeWidth={1.4}
        paintOrder="stroke"
      >
        {sym}
      </text>
    </svg>
  );
}

function runeGlyph(piece: string, fill: string, accent: string, size: number) {
  // Cyberpunk: neon outline of piece silhouettes with scan lines
  const symbols: Record<string, string> = {
    k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟',
  };
  const sym = symbols[piece.toLowerCase()];
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <defs>
        <filter id="neon" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <text
        x="50"
        y="78"
        textAnchor="middle"
        fontFamily="'Cinzel', serif"
        fontSize="80"
        fill="none"
        stroke={fill}
        strokeWidth={2}
        filter="url(#neon)"
      >
        {sym}
      </text>
      <text
        x="50"
        y="78"
        textAnchor="middle"
        fontFamily="'Cinzel', serif"
        fontSize="80"
        fill={accent}
        fillOpacity="0.18"
      >
        {sym}
      </text>
    </svg>
  );
}
