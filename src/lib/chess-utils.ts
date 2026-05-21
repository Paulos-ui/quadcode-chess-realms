import { Chess, Move } from 'chess.js';

export interface ParsedGame {
  headers: Record<string, string | null>;
  fens: string[];          // position FEN before each ply (length = moves + 1)
  moves: Move[];           // chess.js Move objects (verbose)
  sans: string[];          // SAN strings
}

/**
 * Parse a PGN string into a step-by-step replay representation.
 * Throws if PGN is illegal.
 */
export function parsePgn(pgn: string): ParsedGame {
  const chess = new Chess();
  // chess.js v1 throws on illegal pgn — let it bubble
  chess.loadPgn(pgn);

  const headers = chess.header();
  const history = chess.history({ verbose: true }) as Move[];

  // Re-walk from a fresh game to capture FEN at each step.
  const walker = new Chess();
  const fens: string[] = [walker.fen()];
  const sans: string[] = [];
  for (const m of history) {
    walker.move({ from: m.from, to: m.to, promotion: m.promotion });
    fens.push(walker.fen());
    sans.push(m.san);
  }

  return { headers, fens, moves: history, sans };
}

export function fenToBoard(fen: string): (string | null)[][] {
  const placement = fen.split(' ')[0];
  const ranks = placement.split('/');
  const board: (string | null)[][] = [];
  for (const rank of ranks) {
    const row: (string | null)[] = [];
    for (const ch of rank) {
      if (/\d/.test(ch)) {
        for (let i = 0; i < parseInt(ch, 10); i++) row.push(null);
      } else {
        row.push(ch);
      }
    }
    board.push(row);
  }
  return board; // rows index 0 = rank 8
}

export function squareName(fileIdx: number, rankIdx: number): string {
  // rankIdx 0 = rank 8 (top of board for white perspective)
  const files = 'abcdefgh';
  return files[fileIdx] + (8 - rankIdx);
}

export function pieceColor(p: string): 'w' | 'b' {
  return p === p.toUpperCase() ? 'w' : 'b';
}

export function pieceType(p: string): 'k' | 'q' | 'r' | 'b' | 'n' | 'p' {
  return p.toLowerCase() as 'k' | 'q' | 'r' | 'b' | 'n' | 'p';
}

export function isCheckFen(fen: string): boolean {
  try {
    const c = new Chess(fen);
    return c.inCheck();
  } catch {
    return false;
  }
}

export function isCheckmateFen(fen: string): boolean {
  try {
    const c = new Chess(fen);
    return c.isCheckmate();
  } catch {
    return false;
  }
}
