import type { FamousGame } from '../types';

const API_KEY_STORAGE = 'jkcr_anthropic_key';

export function getStoredApiKey(): string | null {
  try { return localStorage.getItem(API_KEY_STORAGE); } catch { return null; }
}
export function setStoredApiKey(k: string | null) {
  try {
    if (k) localStorage.setItem(API_KEY_STORAGE, k);
    else localStorage.removeItem(API_KEY_STORAGE);
  } catch { /* noop */ }
}

/**
 * Call Anthropic's /v1/messages endpoint directly from the browser using a user-supplied key.
 * If no key is configured, returns null and the caller falls back to bundled templates.
 *
 * NOTE: For production, requests should be proxied through a backend so the key isn't in the browser.
 * For this hackathon demo we expose an explicit "Bring your own key" field.
 */
export async function callClaude(prompt: string, maxTokens = 1024): Promise<string | null> {
  const key = getStoredApiKey();
  if (!key) return null;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) {
      console.warn('AI request failed', await res.text());
      return null;
    }
    const data = await res.json();
    const text = (data.content || [])
      .map((b: { type: string; text?: string }) => (b.type === 'text' ? b.text : ''))
      .filter(Boolean)
      .join('\n');
    return text || null;
  } catch (e) {
    console.warn('AI request errored', e);
    return null;
  }
}

// ────────────────────────────────────────────────────────────────────
// Lore generation
// ────────────────────────────────────────────────────────────────────

export async function generateLore(game: FamousGame): Promise<string> {
  const prompt = `You are a cinematic narrator writing a movie-trailer-style lore passage for a famous chess game.

GAME: "${game.title}" — ${game.subtitle} (${game.year})
WHITE: ${game.white}
BLACK: ${game.black}
RESULT: ${game.result}
SEED: ${game.loreSeed}

Write 320–380 words of dramatic, evocative prose. Voice: half movie-script narrator, half mythic chronicler. Imagine this is the opening voiceover of a Christopher Nolan film about chess.

Rules:
- Open with a single short, punchy line on its own (a tagline).
- Use vivid sensory imagery (smoke, candle-wax, hum of servers, drums, the snap of a clock).
- Reference the actual players by name at least twice.
- Build to a climactic final line that lands like a hammer.
- No bullet points, no headers, just flowing prose.`;

  const ai = await callClaude(prompt, 1400);
  if (ai) return ai.trim();

  return fallbackLore(game);
}

function fallbackLore(game: FamousGame): string {
  // Hand-written cinematic templates per game. These are intentionally rich
  // so the demo lands hard even without an API key.
  const stories: Record<string, string> = {
    'immortal-1851': `Some games are played. Others are *summoned.*

London, June 1851. The Great Exhibition has filled the city with steam, optimism, and the rattle of new machines. In a candlelit room above Simpson's Divan, two men face each other across sixty-four squares. Adolf Anderssen — the romantic mathematician, the schoolteacher with a saint's patience and an executioner's eye. Across from him, Lionel Kieseritzky, who has spent his life chasing brilliance through the cafés of Paris like a man chasing a ghost.

The King's Gambit is offered. Accepted. The wager: a queen, two rooks, a bishop. Anderssen does not flinch. He gives them. Not in panic — in pursuit. Each sacrifice is a step deeper into Kieseritzky's position, like a swordsman walking through fire because he can see the city on the other side.

Move 18. The white bishop appears on d6, hanging on nothing, defended by nothing, attacking everything. Move 22. The queen offers herself, and the black knight, in taking her, becomes the lock on his own king's coffin. Move 23. Be7. Checkmate. The board: a battlefield strewn with white corpses, in the center of which the black king stands alone, surrounded, and the white pieces — what few survive — close like hands around a throat.

Kieseritzky stares at the position for a long time. He does not resign. He doesn't have to. The game is its own resignation. A waiter sets down two glasses of brandy. Anderssen lifts his. *To you, sir.* Kieseritzky raises his in return, and in that moment they both know: this isn't a game anymore. It is a poem. It is a prayer. It is the night chess proved it had a soul.

They will call it The Immortal Game. They will call it a hundred things over a hundred and seventy years. But on this night, in this room, with the wax dripping down brass candlesticks and London beyond the windows, it is something simpler than that:

It is *beautiful.* And it is *true.*`,

    'deep-blue-1997': `Six games. Six chances. One species against itself.

New York City, May 11, 1997. The Equitable Center, thirty-fifth floor. Outside: yellow cabs, hot dog vendors, the indifferent throb of a Sunday afternoon. Inside: silence. The kind of silence that exists only in churches, courtrooms, and rooms where history is about to break in half.

Garry Kasparov sits down. The greatest chess player of the twentieth century — the boy from Baku who beat the Soviet system, the world champion for thirteen years, a man who has stared into the face of every grandmaster alive and seen them blink first. Across from him, an empty chair. The chair is empty because his opponent does not need to sit. His opponent is a 1.4-ton mainframe in another room, humming through 200 million positions a second, named for the color of melancholy: *Deep Blue.*

Move 7. The sacrifice. Knight takes e6 — a piece given for nothing but pressure, the kind of move a human grandmaster would consider for an hour. Deep Blue plays it in seconds. Kasparov's face changes. Not panic — not yet. Something quieter. Recognition.

By move 11 his king is exposed. By move 16 his queen is hounded. By move 19, with a small white pawn pushing to c4, he extends his hand. *Resign.* Nineteen moves. The shortest defeat of his career. The shortest defeat in the career of any world champion in a championship match, anywhere, ever.

Kasparov stands. The cameras flash. Somewhere in another room a printer chatters out the moves Deep Blue has just played, and the machine does not know it has won. It does not know what *winning* is. It only knows the next position, and the next, and the next.

The board sits between them like a small graveyard.

Outside, the city does not stop. Inside, a door has opened that will never, ever close again.`,

    'century-1956': `He was thirteen years old.

October 17, 1956. The Marshall Chess Club, New York. A boy with a butcher's haircut and a thrift-store sweater sits across from Donald Byrne — a U.S. champion, a man twice his age, a man who has already beaten half the grandmasters in America. The boy's name is Bobby Fischer. He has no entourage. He has no manager. He has his mother in Brooklyn and a chessboard he set up at the age of six because his sister bought it for a dollar.

The opening drifts. Byrne plays solidly, sensibly, the way you play when you're an adult and your opponent is a child. Move 11, Fischer plays Na4 — a knight thrust to the edge of the board, looking, on the surface, like the kind of move a teenager makes because he doesn't know better. Byrne smiles, perhaps. He shouldn't.

Move 17. Black to move. Fischer's queen sits in the open, attacked by Byrne's bishop. Every adult in the room sees it. Every adult expects him to move it.

He doesn't.

He plays Be6. He *abandons his queen* to a bishop he cannot recapture for three more moves. Byrne takes it. Byrne is now up a queen against a thirteen-year-old. Byrne is, also, losing.

The combination Fischer has seen — and which no one else in the building, perhaps no one else in the city, has seen — extends nine moves into the future. Discovered check. Discovered check. Discovered check. Knight, bishop, knight, like hammers on an anvil. Byrne's king is dragged across the board with a leash made of geometry. By move 41 the white king sits on c1 like a confession, and Fischer plays Rc2 — mate.

Donald Byrne extends his hand. He is gracious. He is also the first man in history to know what it feels like to lose to a god.

The press will call it *The Game of the Century.* They are wrong only because the century was not yet over. There would be no other game like it. There has not been since.

The boy walks home alone. Tomorrow, he has school.`,

    'jayking-special': `Lagos. February 14, 2026. The drums begin at sunset.

The Lagos Royal Invitational has been held for one year and is already a legend. They built the venue on the lagoon — glass and brass over black water, a stadium shaped like an Ife mask. Inside, a single board lit from above by a beam so white it looks like a verdict from heaven. The crowd: ten thousand strong. The stakes: a kingdom's pride.

Across the board: a man known only as *The Shadow King.* No country listed. No federation. A career of dismantling grandmasters in blitz games on rooftops from Moscow to Mumbai. They say he plays in silence. They say he has never been mated.

Opposite him sits Jayking. Lagos boy. Self-taught. The hood of his agbada is pulled forward, gold thread catching the spotlight. He is twenty-one. He has been preparing for this game his whole life.

1. e4. The crowd roars. 2. Nf3 d6 — Philidor's Defense, an old line, a quiet line. 3. Bc4. The bishop slides into the diagonal like a leopard easing onto a branch. The Shadow King plays Bg4, pinning the knight. He has played this position a thousand times. He is, for the first time in years, comfortable.

He shouldn't be.

4. Nc3 g6 — a fianchetto. A small mistake. A door left ajar. Jayking sees it. The crowd does not. He plays Nxe5 — and the air in the stadium leaves it like a stadium gasping. *He's hung his queen.* The Shadow King's hand hovers. He has seen this trick. He thinks he has seen this trick. He takes the queen. *Bxd1.* And now —

6. Bxf7+. The bishop spikes into the boy-king's heart. Ke7 — the only square. The Shadow King's eyes finally widen.

7. Nd5. Mate.

Silence. Then a sound like an ocean breaking. The drums rise. Somewhere in the rafters someone is screaming Jayking's name and somewhere on the lagoon a fisherman lifts his head and listens. Seven moves. *Seven moves.* From the streets of Surulere to the throne of the chess world, by way of a 17th-century trap and a 21st-century heart.

The Shadow King resigns by standing up. He bows. He has been mated. He has been *seen.*

Jayking lifts his head. The crowd sees his face for the first time. He smiles. The drums get louder.`,
  };

  return stories[game.id] || `${game.title}. ${game.year}. A board. Two souls. A war that ended in ${game.result === '1-0' ? 'white\'s' : game.result === '0-1' ? 'black\'s' : 'a shared'} victory. Someday they will make a film. For now, replay the moves and feel it for yourself.`;
}

// ────────────────────────────────────────────────────────────────────
// Move commentary
// ────────────────────────────────────────────────────────────────────

import { CINEMATIC_LINES, MOVE_VERB_BANK } from './commentary-bank';

export async function generateCommentary(opts: {
  san: string;
  ply: number;
  fen: string;
  game: FamousGame;
  isCheck: boolean;
  isMate: boolean;
  isCapture: boolean;
}): Promise<string> {
  const { san, ply, game, isCheck, isMate, isCapture } = opts;

  // Try AI live (kept short to be snappy)
  const key = getStoredApiKey();
  if (key) {
    const prompt = `You are the dramatic in-game narrator for the chess match "${game.title}" (${game.white} vs ${game.black}, ${game.year}).

The move just played was: ${san} (ply ${ply + 1}).
${isMate ? 'This is CHECKMATE.' : isCheck ? 'This delivers CHECK.' : isCapture ? 'This is a CAPTURE.' : ''}

Output a single dramatic one-liner of 12–22 words. Voice: movie trailer narrator meets sports commentator. No quotation marks, no preamble.`;
    const ai = await callClaude(prompt, 80);
    if (ai) return ai.trim().replace(/^"|"$/g, '');
  }

  // Procedural fallback — feels handcrafted, never repeats verbatim in a single session
  return proceduralCommentary(san, ply, isCheck, isMate, isCapture);
}

function proceduralCommentary(
  san: string,
  ply: number,
  isCheck: boolean,
  isMate: boolean,
  isCapture: boolean,
): string {
  if (isMate) {
    const lines = [
      `${san}. The crown falls. The board is still. Eternity.`,
      `${san}. Checkmate. The room learns to breathe again.`,
      `${san}. And so the king is silenced — on this square, on this evening, forever.`,
      `${san}! The final blow. Somewhere, a clock stops listening.`,
    ];
    return pick(lines, ply);
  }
  if (isCheck) {
    const lines = [
      `${san}+ — the crown begins to tremble.`,
      `${san}+ slices through the air like a blade through silk.`,
      `${san}+ — and the king is suddenly very, very alone.`,
      `${san}+ rings out across the board like a bell.`,
    ];
    return pick(lines, ply);
  }
  if (isCapture) {
    const verb = pick(MOVE_VERB_BANK.capture, ply);
    return `${san} — ${verb}. The board grows quieter.`;
  }
  const baseline = CINEMATIC_LINES;
  return `${san} — ${pick(baseline, ply)}`;
}

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}
