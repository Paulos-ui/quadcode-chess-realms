# Jayking's Chess Realms ♟️

> **Play chess. Win, lose, or draw. Watch your game become a movie.**

Built for the **Quadcode AI Hackathon 2026**. A real chess engine in your browser, peer-to-peer multiplayer with no servers, and a cinematic post-game replay that turns every game you play into a 60-second story with custom lore, an orchestral soundtrack, and a sharable 15-second highlight clip.

![hero](docs/screenshot.png)
---

## What it does

**Play vs an AI** — six skill levels from Pawn (~600 ELO) to Grandmaster (~2000+). Real negamax engine with alpha-beta pruning, piece-square tables, quiescence search, and iterative deepening on a time budget. Plays in your browser. No backend.

**Play a friend, peer-to-peer** — one of you creates a game, gets a 6-character code, shares it. The other types the code (or clicks an invite link). You're playing over a direct WebRTC connection. No servers, no accounts, no env vars.

**The cinematic replay** — when the game ends, the app generates:
- a 300–400 word movie-script story written for *your specific game* (win, loss, or draw, vs AI or vs friend)
- a per-move commentary feed
- a 60-second procedural orchestral soundtrack (Tone.js, in-browser)
- a 15-second cinematic video export with slow-motion playback, camera shake, scanlines, and a victory burst
- four selectable board themes
- one-click share to X with a pre-filled hype post

**Study Legends mode** — replay four hand-curated masterpieces (Immortal Game, Kasparov vs Deep Blue G6, Byrne vs Fischer, and the Jayking Special) with the same cinematic toys applied.

**Optional accounts** — sign up with email + password to unlock a persistent display name (shows on the opponent banner) and automatic game history. Every completed game saves to your archive with PGN, result, opponent, and date. Click any past game in **Your Games** to replay it as a movie. See [SETUP.md](./SETUP.md) for the 5-minute Supabase setup. **The app is fully playable without an account** — accounts are purely additive.

## The chess engine

Hand-written in TypeScript. Key features:

- Negamax with alpha-beta pruning
- Iterative deepening with a per-skill time budget (100ms → 4.5s)
- Bounded quiescence search (max 6 plies of captures) at skill 3+
- MVV-LVA move ordering for early cutoffs
- Piece-square tables for positional eval
- Mate-distance preference (no jitter at mate scores so the engine never gets cute about a winning move)
- All running on the main thread with `requestAnimationFrame` deferral so the UI stays responsive

Skill speed reference on standard hardware:

| Skill | Name | ELO | Move time |
|---|---|---|---|
| 0 | Pawn | ~600 | instant |
| 1 | Knight | ~900 | ~150ms |
| 2 | Bishop | ~1200 | ~300ms |
| 3 | Rook | ~1500 | ~1.5s |
| 4 | Queen | ~1800 | ~3s |
| 5 | Grandmaster | ~2000+ | ~5s |

## Multiplayer architecture

Uses [PeerJS](https://peerjs.com/) for WebRTC peer-to-peer with the free public broker for signaling. No backend you have to operate.

- Host generates a random 6-character code, registers their peer ID as `jkcr-<CODE>` with the broker.
- Joiner types the code, dials the host's peer ID via the broker, establishes a direct WebRTC data channel.
- Both sides exchange typed messages: `gameStart`, `move`, `resign`, `drawOffer`, `drawAccept`, `drawDecline`, `rematch`.
- Each side maintains its own chess.js instance. The protocol sends only move deltas, never full board state.
- Game-end is detected deterministically on both sides from the move sequence.
- Invite link support: `?join=CODE` in the URL auto-routes to the multiplayer screen with the code prefilled.

## Bring your own key (optional)

Out of the box, every feature works using **hand-crafted bundled writing**. For *live* AI lore generation tailored to your specific game's moves, open the settings icon (top-right), paste an [Anthropic API key](https://console.anthropic.com/), and it's stored in your browser's `localStorage` only.

The app calls the Anthropic Messages API directly from the browser using the `anthropic-dangerous-direct-browser-access` header. Use a key with spend limits.

---

## Quick start

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`.

### Production build

```bash
npm run build
npm run preview
```

### Deploy

Drops on Vercel / Netlify / Cloudflare Pages out of the box. No env vars required.

**Optional:** to enable accounts + game history, follow [SETUP.md](./SETUP.md) and set two env vars: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Free Supabase tier handles 50k MAU.

## Tech stack

- **Vite + React 18 + TypeScript**
- **Tailwind CSS v3** for styling (with custom royal theme tokens)
- **chess.js** for move generation and legality
- **PeerJS** for WebRTC peer-to-peer
- **Tone.js** for procedural orchestral soundtrack + move SFX
- **Framer Motion** for board piece animations and screen transitions
- **Lucide React** for icons

## Project structure

```
src/
├─ App.tsx                       # screen router (setup → play → cinema → multiplayer → legends)
├─ components/
│  ├─ PlaySetup.tsx              # homepage: skill + color picker, two CTAs
│  ├─ PlayBoard.tsx              # active game UI (generic: AI or P2P)
│  ├─ MultiplayerScreen.tsx      # lobby + active P2P game
│  ├─ GameOverModal.tsx          # cinematic win/loss/draw moment
│  ├─ PostGameCinema.tsx         # cinematic replay of YOUR game
│  ├─ ChessBoard.tsx             # the 8×8 grid with drag-drop, animations
│  ├─ LorePanel.tsx              # story + per-move commentary
│  ├─ ThemeGenerator.tsx         # 4 board themes
│  ├─ MusicPlayer.tsx            # 60s orchestral soundtrack
│  ├─ VideoGenerator.tsx         # 15s cinematic .webm export
│  ├─ ShareButtons.tsx           # pre-filled X share
│  └─ GameSelector.tsx           # famous games picker (Study Legends)
├─ hooks/
│  ├─ usePlayGame.ts             # active game vs AI
│  ├─ useNetworkGame.ts          # active game vs friend (P2P)
│  ├─ useChessGame.ts            # passive replay (for famous games)
│  └─ useLocalStorage.ts
└─ lib/
   ├─ chess-ai.ts                # the engine
   ├─ peer-game.ts               # PeerJS connection manager
   ├─ ai-client.ts               # Anthropic Messages API + bundled stories
   ├─ sfx.ts                     # Tone.js move/capture/check/mate SFX
   ├─ music-engine.ts            # Tone.js 60s orchestral score
   ├─ video-engine.ts            # Canvas + MediaRecorder for clip export
   ├─ theme-engine.tsx           # 4 board themes
   ├─ commentary-bank.ts         # per-move commentary
   └─ chess-utils.ts
```

## 🧩 Built for #QuadcodeHackathon

This is a single self-contained SPA — no server, no environment variables, no signups. It runs entirely in the browser and demonstrates how an agentic workspace can stitch together text, design, audio, and video into one cohesive experience.

**Built in Quadcode AI • Jayking ♟️ • #Hackathon2026**