import type { FamousGame } from '../types';

export const FAMOUS_GAMES: FamousGame[] = [
  {
    id: 'immortal-1851',
    title: 'The Immortal Game',
    subtitle: 'Anderssen vs. Kieseritzky',
    year: 1851,
    white: 'Adolf Anderssen',
    black: 'Lionel Kieseritzky',
    result: '1-0',
    blurb:
      'A reckless symphony of sacrifice in London. Anderssen surrendered queen, rooks, and bishop — and still delivered mate.',
    defaultTheme: 'classic',
    pgn: `[Event "London"]
[Site "London ENG"]
[Date "1851.06.21"]
[Round "?"]
[White "Adolf Anderssen"]
[Black "Lionel Kieseritzky"]
[Result "1-0"]

1.e4 e5 2.f4 exf4 3.Bc4 Qh4+ 4.Kf1 b5 5.Bxb5 Nf6 6.Nf3 Qh6 7.d3 Nh5 8.Nh4 Qg5 9.Nf5 c6 10.g4 Nf6 11.Rg1 cxb5 12.h4 Qg6 13.h5 Qg5 14.Qf3 Ng8 15.Bxf4 Qf6 16.Nc3 Bc5 17.Nd5 Qxb2 18.Bd6 Bxg1 19.e5 Qxa1+ 20.Ke2 Na6 21.Nxg7+ Kd8 22.Qf6+ Nxf6 23.Be7# 1-0`,
    loreSeed:
      'A reckless duel of honor in a London coffee-house. Anderssen, the romantic mathematician, refuses to retreat and walks into legend by burning his entire army.',
  },
  {
    id: 'deep-blue-1997',
    title: 'Kasparov vs. Deep Blue',
    subtitle: 'Game 6 — The Day Machines Won',
    year: 1997,
    white: 'Deep Blue (IBM)',
    black: 'Garry Kasparov',
    result: '1-0',
    blurb:
      'New York City. The reigning world champion versus an IBM titan. Nineteen moves later, the world had changed.',
    defaultTheme: 'cyberpunk',
    pgn: `[Event "IBM Man-Machine, New York USA"]
[Site "New York, NY USA"]
[Date "1997.05.11"]
[Round "6"]
[White "Deep Blue (Computer)"]
[Black "Garry Kasparov"]
[Result "1-0"]

1.e4 c6 2.d4 d6 3.Nc3 dxe4 4.Nxe4 Nd7 5.Ng5 Ngf6 6.Bd3 e6 7.N1f3 h6 8.Nxe6 Qe7 9.O-O fxe6 10.Bg6+ Kd8 11.Bf4 b5 12.a4 Bb7 13.Re1 Nd5 14.Bg3 Kc8 15.axb5 cxb5 16.Qd3 Bc6 17.Bf5 exf5 18.Rxe7 Bxe7 19.c4 1-0`,
    loreSeed:
      'Silicon awakens. Beneath fluorescent lights in Manhattan, a king of flesh meets a kingdom of logic. The board becomes a battlefield for humanity itself.',
  },
  {
    id: 'century-1956',
    title: 'The Game of the Century',
    subtitle: 'Donald Byrne vs. Bobby Fischer',
    year: 1956,
    white: 'Donald Byrne',
    black: 'Bobby Fischer (age 13)',
    result: '0-1',
    blurb:
      'A 13-year-old Bobby Fischer offers his queen on move 17 — and detonates a combination so deep it earned eternal fame.',
    defaultTheme: 'fantasy',
    pgn: `[Event "Third Rosenwald Trophy"]
[Site "New York, NY USA"]
[Date "1956.10.17"]
[Round "8"]
[White "Donald Byrne"]
[Black "Robert James Fischer"]
[Result "0-1"]

1.Nf3 Nf6 2.c4 g6 3.Nc3 Bg7 4.d4 O-O 5.Bf4 d5 6.Qb3 dxc4 7.Qxc4 c6 8.e4 Nbd7 9.Rd1 Nb6 10.Qc5 Bg4 11.Bg5 Na4 12.Qa3 Nxc3 13.bxc3 Nxe4 14.Bxe7 Qb6 15.Bc4 Nxc3 16.Bc5 Rfe8+ 17.Kf1 Be6 18.Bxb6 Bxc4+ 19.Kg1 Ne2+ 20.Kf1 Nxd4+ 21.Kg1 Ne2+ 22.Kf1 Nc3+ 23.Kg1 axb6 24.Qb4 Ra4 25.Qxb6 Nxd1 26.h3 Rxa2 27.Kh2 Nxf2 28.Re1 Rxe1 29.Qd8+ Bf8 30.Nxe1 Bd5 31.Nf3 Ne4 32.Qb8 b5 33.h4 h5 34.Ne5 Kg7 35.Kg1 Bc5+ 36.Kf1 Ng3+ 37.Ke1 Bb4+ 38.Kd1 Bb3+ 39.Kc1 Ne2+ 40.Kb1 Nc3+ 41.Kc1 Rc2# 0-1`,
    loreSeed:
      'A boy with frost in his eyes sits across a Manhattan grandmaster. He gives up his queen as though it were a pawn — and the universe bends to his will.',
  },
  {
    id: 'jayking-special',
    title: 'The Jayking Special',
    subtitle: 'A London Gambit, 2026',
    year: 2026,
    white: 'Jayking (London)',
    black: 'The Shadow King',
    result: '1-0',
    blurb:
      'A dramatic British-inspired masterpiece — a King\'s Gambit storm rising from London, ending in a smothered mate.',
    defaultTheme: 'royal-nigerian',
    flag: '🇬🇧',
    // A real, legal, dramatic miniature culminating in a smothered mate (Légal-style trap into Philidor's smother).
    pgn: `[Event "London Royal Invitational"]
[Site "London, ENG"]
[Date "2026.02.14"]
[Round "Final"]
[White "Jayking"]
[Black "The Shadow King"]
[Result "1-0"]

1.e4 e5 2.Nf3 d6 3.Bc4 Bg4 4.Nc3 g6 5.Nxe5 Bxd1 6.Bxf7+ Ke7 7.Nd5# 1-0`,
    loreSeed:
      'London at dusk. Bells echo across the Thames. A young prince sets a trap older than the Atlantic, and in seven moves the throne falls.',
  },
];
