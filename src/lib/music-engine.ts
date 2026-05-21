/**
 * Procedural orchestral soundtrack generator using Tone.js.
 * No external audio files; the entire 60-second track is synthesized in the browser.
 *
 * Composition:
 *   • Sustained bass drone (D minor) — tense pad
 *   • Cello-like ostinato climbing a melodic minor scale
 *   • Sparse high-string accents
 *   • Deep tom drum hits on a 4-bar cycle
 *   • Bell-like motif at the climax
 */

import * as Tone from 'tone';

const DURATION_S = 60;

export interface PlayingTrack {
  stop(): void;
  isPlaying(): boolean;
}

let current: PlayingTrack | null = null;

export function isMusicPlaying() {
  return current?.isPlaying() ?? false;
}

export async function generateAndPlay(themeName: string): Promise<PlayingTrack> {
  if (current) current.stop();

  await Tone.start();
  const transport = Tone.getTransport();
  transport.bpm.value = 72;

  // ───── Bus ─────────────────────────────────────────────
  const masterGain = new Tone.Gain(0.65).toDestination();
  const reverb = new Tone.Reverb({ decay: 6, wet: 0.45 }).connect(masterGain);
  const compressor = new Tone.Compressor(-18, 3).connect(reverb);

  // ───── Drone pad (low strings) ────────────────────────
  const pad = new Tone.PolySynth(Tone.AMSynth, {
    harmonicity: 1.4,
    oscillator: { type: 'sine' },
    modulation: { type: 'sawtooth' },
    envelope: { attack: 2, decay: 1, sustain: 0.9, release: 4 },
    modulationEnvelope: { attack: 1, decay: 0.5, sustain: 0.6, release: 2 },
  });
  const padGain = new Tone.Gain(0.55).connect(compressor);
  pad.connect(padGain);

  // ───── Ostinato (cellos) ──────────────────────────────
  const cello = new Tone.MonoSynth({
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.04, decay: 0.2, sustain: 0.4, release: 0.4 },
    filter: { Q: 4, type: 'lowpass', rolloff: -24 },
    filterEnvelope: { attack: 0.02, decay: 0.2, sustain: 0.3, release: 0.5, baseFrequency: 180, octaves: 3 },
  });
  const celloGain = new Tone.Gain(0.42).connect(compressor);
  cello.connect(celloGain);

  // ───── High strings (sparse stabs) ────────────────────
  const stab = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.6, decay: 0.5, sustain: 0.6, release: 2 },
  });
  const stabGain = new Tone.Gain(0.22).connect(compressor);
  stab.connect(stabGain);

  // ───── Drums ──────────────────────────────────────────
  const kick = new Tone.MembraneSynth({
    pitchDecay: 0.08,
    octaves: 6,
    envelope: { attack: 0.001, decay: 0.5, sustain: 0.01, release: 1.4 },
  });
  const kickGain = new Tone.Gain(0.85).connect(compressor);
  kick.connect(kickGain);

  // ───── Bell motif (climax) ────────────────────────────
  const bell = new Tone.FMSynth({
    harmonicity: 3,
    modulationIndex: 12,
    envelope: { attack: 0.002, decay: 1.4, sustain: 0, release: 1.6 },
    modulationEnvelope: { attack: 0.002, decay: 0.6, sustain: 0, release: 1 },
  });
  const bellGain = new Tone.Gain(0).connect(compressor); // ramped in
  bell.connect(bellGain);

  // ───── Theme-based key selection ──────────────────────
  // royal-nigerian: D minor (warm)
  // cyberpunk:    E minor + dissonant fifth
  // fantasy:      A minor (open, heroic)
  // classic:      G minor
  const keys: Record<string, { root: string; scale: string[] }> = {
    'royal-nigerian': { root: 'D2', scale: ['D3', 'E3', 'F3', 'G3', 'A3', 'Bb3', 'C4', 'D4'] },
    cyberpunk:        { root: 'E2', scale: ['E3', 'F#3', 'G3', 'A3', 'B3', 'C4', 'D4', 'E4'] },
    fantasy:          { root: 'A2', scale: ['A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4'] },
    classic:          { root: 'G2', scale: ['G3', 'A3', 'Bb3', 'C4', 'D4', 'Eb4', 'F4', 'G4'] },
  };
  const tonality = keys[themeName] || keys['royal-nigerian'];

  const now = Tone.now() + 0.1;
  transport.start(now);

  // ── Pad: long sustained chords every 8 seconds ──────────
  const padChords = [
    [tonality.root, tonality.scale[2], tonality.scale[4]],          // i
    [tonality.scale[5], tonality.scale[0], tonality.scale[2]],      // VI
    [tonality.scale[3], tonality.scale[5], tonality.scale[0]],      // iv
    [tonality.root, tonality.scale[2], tonality.scale[4]],          // i
    [tonality.scale[4], tonality.scale[6], tonality.scale[1]],      // V
    [tonality.root, tonality.scale[2], tonality.scale[4]],          // i
    [tonality.scale[5], tonality.scale[0], tonality.scale[2]],      // VI
    [tonality.scale[4], tonality.scale[6], tonality.scale[1]],      // V (build)
  ];
  padChords.forEach((chord, i) => {
    pad.triggerAttackRelease(chord, '7s', now + i * 7.5);
  });

  // ── Cello ostinato: a 4-note climbing pattern ────────────
  const ostinato = [
    tonality.scale[0], tonality.scale[2], tonality.scale[4], tonality.scale[2],
  ];
  let beat = 0;
  const ostiLoop = new Tone.Loop((time) => {
    const note = ostinato[beat % ostinato.length];
    cello.triggerAttackRelease(note, '0.45', time, 0.7);
    beat++;
  }, '0.5');
  ostiLoop.start(now + 4);
  ostiLoop.stop(now + DURATION_S - 6);

  // ── Drum: deep tom on beats 1 and 3 every 4 bars ─────────
  const drumLoop = new Tone.Loop((time) => {
    kick.triggerAttackRelease('C1', '0.5', time, 0.9);
    kick.triggerAttackRelease('C1', '0.5', time + 1.5, 0.6);
  }, '4n').start(now + 6);
  drumLoop.interval = '2n';

  // ── High string stabs at hits (8s, 16s, 32s, 48s) ────────
  [8, 16, 32, 48].forEach((t, i) => {
    const chord = [tonality.scale[4], tonality.scale[6]];
    stab.triggerAttackRelease(chord, '2', now + t, 0.5 + i * 0.1);
  });

  // ── Climax: bell motif comes in at 40s ───────────────────
  bellGain.gain.linearRampTo(0.35, 4, now + 38);
  const climaxNotes = [tonality.scale[4], tonality.scale[7], tonality.scale[6], tonality.scale[4]];
  climaxNotes.forEach((n, i) => {
    bell.triggerAttackRelease(n, '0.6', now + 42 + i * 1.2, 0.9);
  });

  // ── Master fade out at the end ───────────────────────────
  masterGain.gain.setValueAtTime(0.65, now + DURATION_S - 5);
  masterGain.gain.linearRampToValueAtTime(0, now + DURATION_S);

  let alive = true;
  const stopAll = () => {
    if (!alive) return;
    alive = false;
    try { ostiLoop.stop(); ostiLoop.dispose(); } catch {}
    try { drumLoop.stop(); drumLoop.dispose(); } catch {}
    try { pad.releaseAll(); pad.dispose(); } catch {}
    try { stab.releaseAll(); stab.dispose(); } catch {}
    try { cello.dispose(); } catch {}
    try { bell.dispose(); } catch {}
    try { kick.dispose(); } catch {}
    setTimeout(() => {
      try { transport.stop(); } catch {}
      try { reverb.dispose(); } catch {}
      try { compressor.dispose(); } catch {}
      try { masterGain.dispose(); } catch {}
    }, 200);
    if (current === track) current = null;
  };

  // auto-stop at end
  setTimeout(stopAll, DURATION_S * 1000);

  const track: PlayingTrack = {
    stop: stopAll,
    isPlaying: () => alive,
  };
  current = track;
  return track;
}

export function stopMusic() {
  current?.stop();
  current = null;
}
