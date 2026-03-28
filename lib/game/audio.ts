/**
 * Audio System – Marmalade Game
 *
 * Comprehensive audio management for game feel:
 * - Background music bed (warm piano/ukulele loop, C Major, 110 BPM)
 * - SFX cues (correct answer, wrong answer, state changes)
 * - Coach voice (warm mentor, -14 LUFS, never condescending)
 * - Dynamic mixing with priority-based ducking
 *
 * Audio Priority (SFX > Voice > Music > Ambient)
 * When multiple events fire simultaneously, lower-priority tracks reduce gain.
 */

import type { CharacterState } from "./characterState";

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

export type AudioCue = "correct" | "wrong" | "whoosh" | "shimmer" | "lockInThunk";
export type CoachVoiceCue = "encouragement" | "correction" | "celebration" | "warmth";

export type AudioPriority = "sfx" | "voice" | "music" | "ambient";

interface AudioConfig {
  /** Master volume (0-1) */
  masterVolume: number;
  /** Track-specific volumes (0-1) */
  trackVolumes: Record<AudioPriority, number>;
  /** Ducking amounts when higher-priority track plays (0-1, subtracted from gain) */
  duckingAmount: Record<AudioPriority, Record<AudioPriority, number>>;
  /** Fade duration for smooth transitions (ms) */
  fadeDuration: number;
}

interface SFXConfig {
  /** Primary frequency (Hz) */
  freq: number;
  /** Oscillator type */
  type: OscillatorType;
  /** Duration (seconds) */
  duration: number;
  /** Starting volume (0-1) */
  volume: number;
  /** Frequency sweep amount (Hz, optional) */
  sweep?: number;
  /** Type of sweep: "up" or "down" */
  sweepDir?: "up" | "down";
  /** Second harmonic frequency for richness (optional) */
  harmonic?: number;
  /** Harmonic volume (0-1) */
  harmonicVolume?: number;
}

interface CoachVoiceEntry {
  cue: CoachVoiceCue;
  text: string;
  /** Emotional intent (for casting director) */
  intent: string;
  /** Approximate duration (seconds) */
  duration: number;
  /** Suggest pause before next question (ms) */
  pauseAfter?: number;
}

/**
 * SFX specifications aligned to Audio Designer brief.
 * Real audio files will replace these synthesized cues.
 */
const SFX_MAP: Record<AudioCue, SFXConfig> = {
  // Correct answer: bright harmonic (800–1200 Hz), -8 LUFS
  correct: {
    freq: 1000,
    type: "sine",
    duration: 0.4,
    volume: 0.28, // -8 LUFS equivalent in Web Audio
    harmonic: 1600,
    harmonicVolume: 0.14,
    sweep: 200,
    sweepDir: "up"
  },
  // Wrong answer: warm bongo (300–500 Hz downward bend), -10 LUFS
  wrong: {
    freq: 400,
    type: "triangle",
    duration: 0.35,
    volume: 0.22, // -10 LUFS equivalent
    sweep: -150,
    sweepDir: "down"
  },
  // Phase transition: whoosh
  whoosh: {
    freq: 600,
    type: "sawtooth",
    duration: 0.22,
    volume: 0.18,
    sweep: -250,
    sweepDir: "down"
  },
  // Power level up: shimmer
  shimmer: {
    freq: 1200,
    type: "square",
    duration: 0.28,
    volume: 0.2,
    harmonic: 2400,
    harmonicVolume: 0.1,
    sweep: 400,
    sweepDir: "up"
  },
  // Boss attack wind-up: lock-in thunk
  lockInThunk: {
    freq: 220,
    type: "sine",
    duration: 0.18,
    volume: 0.25,
    sweep: 50,
    sweepDir: "up"
  }
};

/**
 * Coach voice dialogue with emotional intent cues.
 * These are placeholders; actual voice recording specs follow in the casting brief.
 */
const COACH_VOICE_MAP: Record<CoachVoiceCue, CoachVoiceEntry> = {
  encouragement: {
    cue: "encouragement",
    text: "Great effort! Let's keep going.",
    intent: "Warm, supportive, like a coach noticing genuine effort. Not patronizing.",
    duration: 1.8,
    pauseAfter: 500
  },
  correction: {
    cue: "correction",
    text: "That's okay—let's try again. You've got this.",
    intent: "Gentle, constructive. Never shame. Uncle/aunt energy: 'I believe in you.'",
    duration: 2.0,
    pauseAfter: 800
  },
  celebration: {
    cue: "celebration",
    text: "YES! Fantastic!",
    intent: "Genuine joy, real celebration. Like proud parent. High energy, brief.",
    duration: 1.2,
    pauseAfter: 300
  },
  warmth: {
    cue: "warmth",
    text: "You're doing amazing.",
    intent: "Tender affirmation. Slow, deliberate. Builds confidence for next question.",
    duration: 1.6,
    pauseAfter: 600
  }
};

// ============================================================================
// AUDIO CONTEXT & STATE
// ============================================================================

type WindowWithAudio = Window & {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
};

interface AudioState {
  context: AudioContext | null;
  config: AudioConfig;
  activeTracks: Map<string, GainNode>;
  musicOscillator: OscillatorNode | null;
  musicGain: GainNode | null;
  musicStep: number;
  isPlaying: boolean;
}

const audioState: AudioState = {
  context: null,
  config: {
    masterVolume: 0.75,
    trackVolumes: {
      sfx: 1.0,
      voice: 0.85,
      music: 0.6,
      ambient: 0.4
    },
    duckingAmount: {
      sfx: { voice: 0.4, music: 0.7, ambient: 0.9, sfx: 0 },
      voice: { music: 0.5, ambient: 0.8, sfx: 0, voice: 0 },
      music: { ambient: 0.2, sfx: 0, voice: 0, music: 0 },
      ambient: { sfx: 0, voice: 0, music: 0, ambient: 0 }
    },
    fadeDuration: 200
  },
  activeTracks: new Map(),
  musicOscillator: null,
  musicGain: null,
  musicStep: 0,
  isPlaying: false
};

/**
 * C Major scale (Keeper's theme baseline, 110 BPM ≈ 545ms per beat)
 * Notes: C4, D4, E4, F4, G4, A4, B4 (and octave variations)
 * Frequencies: 262, 294, 330, 349, 392, 440, 494 Hz
 */
const MUSIC_MELODY = [262, 330, 392, 440, 330, 262, 294, 330];

// ============================================================================
// AUDIO CONTEXT INITIALIZATION
// ============================================================================

const getAudioContext = (): AudioContext | null => {
  if (typeof window === "undefined") return null;
  if (audioState.context) return audioState.context;

  const win = window as WindowWithAudio;
  const AudioCtor = win.AudioContext || win.webkitAudioContext;
  if (!AudioCtor) return null;

  audioState.context = new AudioCtor();
  return audioState.context;
};

export const unlockAudio = (): void => {
  const ctx = getAudioContext();
  if (!ctx || ctx.state !== "suspended") return;
  ctx.resume().catch(() => {});
};

// ============================================================================
// DYNAMIC MIXING & DUCKING
// ============================================================================

/**
 * Apply ducking to a track based on which priority track is currently playing.
 * Higher-priority tracks reduce the gain of lower-priority tracks.
 */
const applyDucking = (
  gainNode: GainNode,
  currentPriority: AudioPriority,
  activePriority: AudioPriority,
  ctx: AudioContext
): void => {
  if (!gainNode) return;

  const duckAmount = audioState.config.duckingAmount[activePriority]?.[currentPriority] ?? 0;
  const baseVolume = audioState.config.trackVolumes[currentPriority];
  const targetGain = baseVolume * audioState.config.masterVolume * (1 - duckAmount);

  const now = ctx.currentTime;
  gainNode.gain.setTargetAtTime(targetGain, now, audioState.config.fadeDuration / 1000);
};

/**
 * Update all active track gains based on the highest-priority track currently playing.
 */
const updateMixLevels = (triggeringPriority: AudioPriority): void => {
  const ctx = getAudioContext();
  if (!ctx) return;

  audioState.activeTracks.forEach((gainNode, trackKey) => {
    const trackPriority = (trackKey.split("-")[0] as AudioPriority) ?? "ambient";
    applyDucking(gainNode, trackPriority, triggeringPriority, ctx);
  });
};

// ============================================================================
// SFX PLAYBACK
// ============================================================================

/**
 * Play a sound effect cue with optional harmonics and frequency sweep.
 * Implements proper Web Audio scheduling and gain enveloping.
 */
export const playSFX = (cue: AudioCue): void => {
  const config = SFX_MAP[cue];
  if (!config) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  unlockAudio();

  const playSound = (): void => {
    const now = ctx.currentTime;

    // Create oscillators
    const osc1 = ctx.createOscillator();
    const osc2 = config.harmonic ? ctx.createOscillator() : null;
    const gain = ctx.createGain();
    const gainNode = ctx.createGain();

    // Set up first oscillator
    osc1.type = config.type;
    osc1.frequency.setValueAtTime(config.freq, now);

    if (config.sweep) {
      const targetFreq = config.freq + config.sweep;
      osc1.frequency.exponentialRampToValueAtTime(Math.max(40, targetFreq), now + config.duration);
    }

    // Set up optional harmonic
    if (osc2 && config.harmonic && config.harmonicVolume) {
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(config.harmonic, now);
      const harmonicGain = ctx.createGain();
      harmonicGain.gain.setValueAtTime(config.harmonicVolume * config.volume, now);
      harmonicGain.gain.exponentialRampToValueAtTime(0.001, now + config.duration);
      osc2.connect(harmonicGain).connect(gain);
    }

    // Envelope: attack instant, decay to silence
    gain.gain.setValueAtTime(config.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + config.duration);

    // Track for mixing
    const trackId = `sfx-${cue}-${Math.random()}`;
    gainNode.gain.setValueAtTime(
      audioState.config.trackVolumes.sfx * audioState.config.masterVolume,
      now
    );
    audioState.activeTracks.set(trackId, gainNode);

    // Connect graph
    osc1.connect(gain).connect(gainNode).connect(ctx.destination);

    // Play
    osc1.start(now);
    osc1.stop(now + config.duration);
    if (osc2) {
      osc2.start(now);
      osc2.stop(now + config.duration);
    }

    // Cleanup
    setTimeout(
      () => audioState.activeTracks.delete(trackId),
      config.duration * 1000 + 100
    );
  };

  if (ctx.state === "suspended") {
    ctx.resume().then(playSound).catch(() => {});
  } else {
    playSound();
  }

  // Apply ducking to lower-priority tracks
  updateMixLevels("sfx");
};

// ============================================================================
// BACKGROUND MUSIC
// ============================================================================

/**
 * Start the background music loop.
 * C Major melody, ~110 BPM (545ms per beat, so 272ms per half-beat step).
 * Uses gentle triangle wave, warm but not distracting.
 */
export const startMusicBed = (): void => {
  if (typeof window === "undefined") return;
  if (audioState.isPlaying) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  unlockAudio();

  audioState.isPlaying = true;
  audioState.musicStep = 0;

  const playNextMusicStep = (): void => {
    if (!audioState.isPlaying) return;

    const now = ctx.currentTime;
    const note = MUSIC_MELODY[audioState.musicStep % MUSIC_MELODY.length];

    // Melody line (triangle wave, warm)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const gainNode = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(note, now);
    osc.frequency.exponentialRampToValueAtTime(note * 1.02, now + 0.24);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

    const trackId = `music-melody-${audioState.musicStep}`;
    gainNode.gain.setValueAtTime(
      audioState.config.trackVolumes.music * audioState.config.masterVolume,
      now
    );
    audioState.activeTracks.set(trackId, gainNode);

    osc.connect(gain).connect(gainNode).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.26);

    setTimeout(() => audioState.activeTracks.delete(trackId), 300);

    // Occasional bass (every 4 steps, lower octave)
    if (audioState.musicStep % 4 === 0) {
      const bassOsc = ctx.createOscillator();
      const bassGain = ctx.createGain();
      const bassGainNode = ctx.createGain();

      const baseNote = Math.max(130, note / 2);
      bassOsc.type = "sine";
      bassOsc.frequency.setValueAtTime(baseNote, now);
      bassOsc.frequency.exponentialRampToValueAtTime(baseNote * 0.98, now + 0.28);

      bassGain.gain.setValueAtTime(0.04, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.30);

      const bassTrackId = `music-bass-${audioState.musicStep}`;
      bassGainNode.gain.setValueAtTime(
        audioState.config.trackVolumes.music * audioState.config.masterVolume,
        now
      );
      audioState.activeTracks.set(bassTrackId, bassGainNode);

      bassOsc.connect(bassGain).connect(bassGainNode).connect(ctx.destination);
      bassOsc.start(now);
      bassOsc.stop(now + 0.30);

      setTimeout(() => audioState.activeTracks.delete(bassTrackId), 350);
    }

    audioState.musicStep += 1;

    // Schedule next step (~272ms per step at 110 BPM, accounts for envelope tail)
    if (audioState.isPlaying) {
      setTimeout(playNextMusicStep, 280);
    }
  };

  playNextMusicStep();
};

/**
 * Stop the background music loop.
 */
export const stopMusicBed = (): void => {
  audioState.isPlaying = false;
  audioState.musicStep = 0;
};

// ============================================================================
// COACH VOICE SYSTEM
// ============================================================================

/**
 * Retrieve coach voice dialogue for a given cue.
 * In production, this would trigger actual audio playback from recorded files.
 * For now, returns the entry data for reference.
 */
export const getCoachVoiceCue = (cue: CoachVoiceCue): CoachVoiceEntry => {
  return COACH_VOICE_MAP[cue];
};

/**
 * Play a coach voice cue (placeholder implementation).
 * In production, this would:
 * 1. Load the pre-recorded audio file (m4a/mp3)
 * 2. Create a buffer source from Web Audio API
 * 3. Apply gain normalization (-14 LUFS target)
 * 4. Queue playback with proper mixing
 * 5. Auto-duck music below voice
 * 6. Pause question timer during playback
 *
 * For development, we log the intent and return the pause duration.
 */
export const playCoachVoice = (cue: CoachVoiceCue, childName?: string): number => {
  const entry = COACH_VOICE_MAP[cue];
  if (!entry) return 0;

  // Development: log emotional intent for validation
  console.debug(`[Coach Voice] ${childName ?? "Student"}: "${entry.text}"`, {
    intent: entry.intent,
    duration: entry.duration
  });

  // In production:
  // 1. Load audio file from /public/audio/coach-voice/${cue}.m4a
  // 2. Normalize to -14 LUFS in post-production
  // 3. Create AudioBufferSourceNode and play
  // 4. Apply voice ducking to music track
  // 5. Return pauseAfter duration for question timer delay

  return entry.pauseAfter ?? 0;
};

/**
 * Select a coach voice cue based on game context.
 * Used by app/page.tsx to choose the right encouragement.
 */
export const selectCoachVoiceCue = (context: {
  isCorrect: boolean;
  isCombo: boolean;
  comboCount?: number;
  isTimeout?: boolean;
}): CoachVoiceCue => {
  if (context.isTimeout) return "correction";
  if (context.isCorrect && context.isCombo && (context.comboCount ?? 0) >= 5) {
    return "celebration";
  }
  if (context.isCorrect) return "encouragement";
  if (!context.isCorrect && !context.isTimeout) return "correction";
  return "warmth";
};

// ============================================================================
// CONFIGURATION & CONTROL
// ============================================================================

/**
 * Update master volume (0-1).
 */
export const setMasterVolume = (volume: number): void => {
  audioState.config.masterVolume = Math.max(0, Math.min(1, volume));
};

/**
 * Update a track's volume level (0-1).
 */
export const setTrackVolume = (track: AudioPriority, volume: number): void => {
  audioState.config.trackVolumes[track] = Math.max(0, Math.min(1, volume));
};

/**
 * Get current audio configuration.
 */
export const getAudioConfig = (): AudioConfig => audioState.config;

/**
 * Placeholder for Phaser scene audio integration (unused in current build)
 * Kept for backward compatibility with scene files
 */
export const playAudioCue = (cue: string): void => {
  // Phaser scenes are not currently used; audio is handled via Web Audio API inline
};

/**
 * Get audio context for advanced use cases.
 */
export const getAudioContextInstance = (): AudioContext | null => getAudioContext();
