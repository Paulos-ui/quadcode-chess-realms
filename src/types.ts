export type ThemeName = 'royal-nigerian' | 'cyberpunk' | 'fantasy' | 'classic';

export interface FamousGame {
  id: string;
  title: string;
  subtitle: string;
  year: number;
  white: string;
  black: string;
  result: '1-0' | '0-1' | '1/2-1/2';
  blurb: string;
  pgn: string;
  loreSeed: string;
  defaultTheme: ThemeName;
  flag?: string;
}

export interface BoardTheme {
  name: ThemeName;
  label: string;
  light: string;
  dark: string;
  border: string;
  glow: string;
  pieceStyle: 'classic' | 'glyph' | 'rune';
  pieceLight: string;
  pieceDark: string;
  accent: string;
  description: string;
}

export interface CommentaryEntry {
  ply: number;
  san: string;
  text: string;
}
