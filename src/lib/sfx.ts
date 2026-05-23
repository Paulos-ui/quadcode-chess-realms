/**
 * Lightweight sound effects engine using Tone.js (already a dep for music).
 * - move:    a soft wooden click
 * - capture: a sharper, satisfying thump
 * - check:   an alert chord
 * - mate:    a deep cinematic resolution
 *
 * All sounds are short, lazy-initialized, and disabled by default until the
 * user has interacted with the page (browser autoplay policy).
 */
import * as Tone from 'tone';

let initialized = false;
let enabled = true;

// Persisted preference
const STORAGE_KEY = 'jkcr_sounds_enabled';
try {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'false') enabled = false;
} catch {
  /* no localStorage */
}

let moveSynth: Tone.MembraneSynth | null = null;
let captureSynth: Tone.MembraneSynth | null = null;
let checkSynth: Tone.PolySynth | null = null;
let mateSynth: Tone.PolySynth | null = null;

function ensureInit() {
  if (initialized) return;
  initialized = true;
  // Soft wood-block thunk
  moveSynth = new Tone.MembraneSynth({
    pitchDecay: 0.008,
    octaves: 2,
    envelope: { attack: 0.001, decay: 0.18, sustain: 0, release: 0.1 },
    volume: -16,
  }).toDestination();

  // Sharper, more "impact" thump for captures
  captureSynth = new Tone.MembraneSynth({
    pitchDecay: 0.02,
    octaves: 4,
    envelope: { attack: 0.001, decay: 0.25, sustain: 0, release: 0.2 },
    volume: -10,
  }).toDestination();

  // Alert chord for check — slight dissonance
  checkSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.005, decay: 0.3, sustain: 0.1, release: 0.4 },
    volume: -18,
  }).toDestination();

  // Cinematic finale for mate — fuller chord
  mateSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: { attack: 0.01, decay: 0.6, sustain: 0.3, release: 1.5 },
    volume: -12,
  }).toDestination();
}

async function unlockContext() {
  if (Tone.context.state !== 'running') {
    try {
      await Tone.start();
    } catch {
      /* may fail if not in a user gesture; will retry */
    }
  }
}

export const sfx = {
  setEnabled(value: boolean) {
    enabled = value;
    try {
      localStorage.setItem(STORAGE_KEY, String(value));
    } catch {
      /* noop */
    }
  },
  isEnabled() {
    return enabled;
  },
  async move() {
    if (!enabled) return;
    await unlockContext();
    ensureInit();
    moveSynth?.triggerAttackRelease('C2', '16n');
  },
  async capture() {
    if (!enabled) return;
    await unlockContext();
    ensureInit();
    captureSynth?.triggerAttackRelease('G1', '8n');
  },
  async check() {
    if (!enabled) return;
    await unlockContext();
    ensureInit();
    const now = Tone.now();
    checkSynth?.triggerAttackRelease(['E4', 'A4', 'C5'], '8n', now);
  },
  async mate() {
    if (!enabled) return;
    await unlockContext();
    ensureInit();
    const now = Tone.now();
    mateSynth?.triggerAttackRelease(['C3', 'G3', 'C4', 'E4'], '1n', now);
  },
  /** Pick a sound based on the move's flags. */
  async playForMove(move: { captured?: string; san: string }) {
    // The SAN suffix tells us the final state: # = mate, + = check
    if (move.san.endsWith('#')) {
      await this.mate();
      return;
    }
    if (move.san.endsWith('+')) {
      await this.check();
      return;
    }
    if (move.captured) {
      await this.capture();
      return;
    }
    await this.move();
  },
};
