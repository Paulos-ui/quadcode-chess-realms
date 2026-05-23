/**
 * Chess AI — negamax with alpha-beta pruning, iterative deepening,
 * piece-square tables, MVV-LVA move ordering, and bounded quiescence search.
 *
 * Uses a TIME BUDGET (not fixed depth) so the AI is always responsive.
 * Iterative deepening means it returns the best move found within the budget.
 */
import { Chess, type Move } from 'chess.js';

export type Skill = 0 | 1 | 2 | 3 | 4 | 5;

const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Piece-square tables — white perspective. Mirror for black.
const PST: Record<string, number[][]> = {
  p: [
    [ 0,  0,  0,  0,  0,  0,  0,  0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [ 5,  5, 10, 25, 25, 10,  5,  5],
    [ 0,  0,  0, 20, 20,  0,  0,  0],
    [ 5, -5,-10,  0,  0,-10, -5,  5],
    [ 5, 10, 10,-20,-20, 10, 10,  5],
    [ 0,  0,  0,  0,  0,  0,  0,  0],
  ],
  n: [
    [-50,-40,-30,-30,-30,-30,-40,-50],
    [-40,-20,  0,  0,  0,  0,-20,-40],
    [-30,  0, 10, 15, 15, 10,  0,-30],
    [-30,  5, 15, 20, 20, 15,  5,-30],
    [-30,  0, 15, 20, 20, 15,  0,-30],
    [-30,  5, 10, 15, 15, 10,  5,-30],
    [-40,-20,  0,  5,  5,  0,-20,-40],
    [-50,-40,-30,-30,-30,-30,-40,-50],
  ],
  b: [
    [-20,-10,-10,-10,-10,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5, 10, 10,  5,  0,-10],
    [-10,  5,  5, 10, 10,  5,  5,-10],
    [-10,  0, 10, 10, 10, 10,  0,-10],
    [-10, 10, 10, 10, 10, 10, 10,-10],
    [-10,  5,  0,  0,  0,  0,  5,-10],
    [-20,-10,-10,-10,-10,-10,-10,-20],
  ],
  r: [
    [ 0,  0,  0,  0,  0,  0,  0,  0],
    [ 5, 10, 10, 10, 10, 10, 10,  5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [ 0,  0,  0,  5,  5,  0,  0,  0],
  ],
  q: [
    [-20,-10,-10, -5, -5,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5,  5,  5,  5,  0,-10],
    [ -5,  0,  5,  5,  5,  5,  0, -5],
    [  0,  0,  5,  5,  5,  5,  0, -5],
    [-10,  5,  5,  5,  5,  5,  0,-10],
    [-10,  0,  5,  0,  0,  0,  0,-10],
    [-20,-10,-10, -5, -5,-10,-10,-20],
  ],
  k: [
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-20,-30,-30,-40,-40,-30,-30,-20],
    [-10,-20,-20,-20,-20,-20,-20,-10],
    [ 20, 20,  0,  0,  0,  0, 20, 20],
    [ 20, 30, 10,  0,  0, 10, 30, 20],
  ],
};

const QUIESCENCE_MAX_PLIES = 6;

/** Evaluate from white's perspective. Centipawns. */
function evaluate(chess: Chess): number {
  if (chess.isCheckmate()) return chess.turn() === 'w' ? -100000 : 100000;
  if (chess.isStalemate() || chess.isInsufficientMaterial() || chess.isThreefoldRepetition() || chess.isDraw()) {
    return 0;
  }
  let score = 0;
  const board = chess.board();
  for (let r = 0; r < 8; r++) {
    const row = board[r]!;
    for (let f = 0; f < 8; f++) {
      const cell = row[f];
      if (!cell) continue;
      const value = PIECE_VALUES[cell.type] ?? 0;
      const pst = PST[cell.type]!;
      const posBonus = cell.color === 'w' ? pst[r]![f]! : pst[7 - r]![f]!;
      const total = value + posBonus;
      score += cell.color === 'w' ? total : -total;
    }
  }
  return score;
}

/** MVV-LVA: prioritise capturing the highest-value piece with the lowest-value attacker. */
function moveScore(move: Move): number {
  if (move.captured) {
    const victim = PIECE_VALUES[move.captured] ?? 0;
    const attacker = PIECE_VALUES[move.piece] ?? 0;
    return 10000 + victim * 10 - attacker;
  }
  if (move.promotion) return 9000;
  if (move.flags.includes('k') || move.flags.includes('q')) return 500;
  return 0;
}

class SearchAborted extends Error {}

interface SearchContext {
  deadline: number;
  nodes: number;
}

function checkTime(ctx: SearchContext) {
  ctx.nodes++;
  // Check every 1024 nodes to keep overhead low
  if ((ctx.nodes & 1023) === 0 && performance.now() > ctx.deadline) {
    throw new SearchAborted();
  }
}

function quiescence(
  chess: Chess,
  alpha: number,
  beta: number,
  perspective: number,
  ply: number,
  ctx: SearchContext,
): number {
  checkTime(ctx);
  const standPat = evaluate(chess) * perspective;
  if (ply >= QUIESCENCE_MAX_PLIES) return standPat;
  if (standPat >= beta) return beta;
  if (standPat > alpha) alpha = standPat;

  // Only captures
  const captures = chess.moves({ verbose: true }).filter((m) => m.captured);
  captures.sort((a, b) => moveScore(b) - moveScore(a));

  for (const m of captures) {
    chess.move({ from: m.from, to: m.to, promotion: m.promotion });
    const score = -quiescence(chess, -beta, -alpha, -perspective, ply + 1, ctx);
    chess.undo();
    if (score >= beta) return beta;
    if (score > alpha) alpha = score;
  }
  return alpha;
}

function negamax(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  perspective: number,
  useQuiescence: boolean,
  ctx: SearchContext,
): number {
  checkTime(ctx);
  if (depth === 0) {
    return useQuiescence ? quiescence(chess, alpha, beta, perspective, 0, ctx) : evaluate(chess) * perspective;
  }
  if (chess.isGameOver()) {
    return evaluate(chess) * perspective;
  }

  const moves = chess.moves({ verbose: true });
  moves.sort((a, b) => moveScore(b) - moveScore(a));

  let best = -Infinity;
  for (const m of moves) {
    chess.move({ from: m.from, to: m.to, promotion: m.promotion });
    const score = -negamax(chess, depth - 1, -beta, -alpha, -perspective, useQuiescence, ctx);
    chess.undo();
    if (score > best) best = score;
    if (score > alpha) alpha = score;
    if (alpha >= beta) break;
  }
  return best;
}

export interface ThinkResult {
  move: Move;
  evaluation: number;
  depth: number;
  nodes: number;
}

interface SkillConfig {
  timeMs: number;
  maxDepth: number;
  useQuiescence: boolean;
  randomness: number; // 0–1, applied to root move ordering jitter
}

const SKILL_CONFIGS: Record<Skill, SkillConfig> = {
  0: { timeMs: 100,  maxDepth: 1, useQuiescence: false, randomness: 1.0 },
  1: { timeMs: 250,  maxDepth: 2, useQuiescence: false, randomness: 0.5 },
  2: { timeMs: 600,  maxDepth: 3, useQuiescence: false, randomness: 0.15 },
  3: { timeMs: 1200, maxDepth: 4, useQuiescence: true,  randomness: 0.05 },
  4: { timeMs: 2500, maxDepth: 5, useQuiescence: true,  randomness: 0 },
  5: { timeMs: 4500, maxDepth: 6, useQuiescence: true,  randomness: 0 },
};

/** Find the best move using iterative deepening within a time budget. */
export function findBestMove(fen: string, skill: Skill): ThinkResult | null {
  const chess = new Chess(fen);
  const moves = chess.moves({ verbose: true });
  if (moves.length === 0) return null;

  // Skill 0: lightly weighted random with capture preference
  if (skill === 0) {
    const scored = moves.map((m) => ({ m, score: moveScore(m) + Math.random() * 200 }));
    scored.sort((a, b) => b.score - a.score);
    return { move: scored[0]!.m, evaluation: 0, depth: 0, nodes: 0 };
  }

  const cfg = SKILL_CONFIGS[skill];
  const deadline = performance.now() + cfg.timeMs;
  const ctx: SearchContext = { deadline, nodes: 0 };
  const perspective = chess.turn() === 'w' ? 1 : -1;

  moves.sort((a, b) => moveScore(b) - moveScore(a));

  // Sensible default in case time runs out before depth 1 completes
  let bestMove: Move = moves[0]!;
  let bestScore = -Infinity;
  let lastCompletedDepth = 0;

  // Iterative deepening
  outer: for (let depth = 1; depth <= cfg.maxDepth; depth++) {
    let depthBest: Move | null = null;
    let depthBestScore = -Infinity;
    let alpha = -Infinity;
    const beta = Infinity;

    try {
      for (const m of moves) {
        chess.move({ from: m.from, to: m.to, promotion: m.promotion });
        const score = -negamax(chess, depth - 1, -beta, -alpha, -perspective, cfg.useQuiescence, ctx);
        chess.undo();
        // Don't apply jitter to mate scores — beta cutoffs propagate the mate
        // bound to non-mate moves, and any jitter at all can pick the wrong move.
        const jitter =
          cfg.randomness > 0 && Math.abs(score) < 50000
            ? (Math.random() - 0.5) * 30 * cfg.randomness
            : 0;
        if (score + jitter > depthBestScore) {
          depthBestScore = score + jitter;
          depthBest = m;
        }
        if (score > alpha) alpha = score;
      }
    } catch (e) {
      if (e instanceof SearchAborted) {
        // Partial depth — keep previous depth's best
        break outer;
      }
      throw e;
    }

    if (depthBest) {
      bestMove = depthBest;
      bestScore = depthBestScore;
      lastCompletedDepth = depth;
    }

    // Re-order root moves by score so next iteration is faster
    if (depthBest) {
      const idx = moves.indexOf(depthBest);
      if (idx > 0) {
        moves.splice(idx, 1);
        moves.unshift(depthBest);
      }
    }

    // If we found mate, stop — no point looking deeper
    if (Math.abs(bestScore) > 50000) break outer;
  }

  return {
    move: bestMove,
    evaluation: bestScore * perspective,
    depth: lastCompletedDepth,
    nodes: ctx.nodes,
  };
}

/** Promise-wrapped version with a minimum think delay so the UI feels human. */
export function thinkAsync(fen: string, skill: Skill, minDelayMs = 250): Promise<ThinkResult | null> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      const start = performance.now();
      const result = findBestMove(fen, skill);
      const elapsed = performance.now() - start;
      const remaining = Math.max(0, minDelayMs - elapsed);
      setTimeout(() => resolve(result), remaining);
    });
  });
}

export const SKILL_LABELS: Record<Skill, { name: string; rating: string; description: string }> = {
  0: { name: 'Pawn',        rating: '~600',   description: 'Plays semi-randomly. Hangs pieces.' },
  1: { name: 'Knight',      rating: '~900',   description: 'Looks one move ahead.' },
  2: { name: 'Bishop',      rating: '~1200',  description: 'Plans 2–3 moves out. Decent club player.' },
  3: { name: 'Rook',        rating: '~1500',  description: 'Tactical search to 3–4 plies.' },
  4: { name: 'Queen',       rating: '~1800',  description: 'Strong tactical play. Punishes blunders.' },
  5: { name: 'Grandmaster', rating: '~2000+', description: 'Deep search. Takes a few seconds per move.' },
};
