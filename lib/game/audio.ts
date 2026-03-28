type AudioCue = "attack" | "boss" | "warning" | "hit" | "damage" | "reward" | "math";

type WindowWithAudio = Window & {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
};

type CueConfig = {
  freq: number;
  type: OscillatorType;
  duration: number;
  volume: number;
  sweep?: number;
};

const CUE_MAP: Record<AudioCue, CueConfig> = {
  attack: { freq: 420, type: "triangle", duration: 0.12, volume: 0.24, sweep: 120 },
  boss: { freq: 200, type: "sine", duration: 0.28, volume: 0.2, sweep: -30 },
  warning: { freq: 180, type: "square", duration: 0.32, volume: 0.18, sweep: 80 },
  hit: { freq: 480, type: "triangle", duration: 0.1, volume: 0.22, sweep: 220 },
  damage: { freq: 138, type: "sawtooth", duration: 0.18, volume: 0.2, sweep: -40 },
  reward: { freq: 660, type: "sine", duration: 0.2, volume: 0.22, sweep: 320 },
  math: { freq: 540, type: "square", duration: 0.18, volume: 0.14, sweep: -100 }
};

const audioState = {
  context: null as AudioContext | null,
  musicInterval: null as number | null,
  musicStep: 0,
  unlocked: false
};

const melody = [330, 392, 523, 587, 523, 392, 440, 523];

const getAudioContext = () => {
  if (typeof window === "undefined") return null;
  if (audioState.context) return audioState.context;
  const win = window as WindowWithAudio;
  const AudioCtor = win.AudioContext || win.webkitAudioContext;
  if (!AudioCtor) return null;
  audioState.context = new AudioCtor();
  return audioState.context;
};

const playTone = (config: CueConfig, overrideFreq?: number) => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const start = () => {
    const now = ctx.currentTime;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = config.type;
    oscillator.frequency.setValueAtTime(overrideFreq ?? config.freq, now);
    if (config.sweep) {
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, (overrideFreq ?? config.freq) + config.sweep), now + config.duration);
    }

    gain.gain.setValueAtTime(config.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + config.duration);

    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(now);
    oscillator.stop(now + config.duration);
  };

  if (ctx.state === "suspended") {
    ctx.resume().then(start).catch(() => {});
  } else {
    start();
  }
};

export const unlockAudio = () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
  audioState.unlocked = true;
};

export const startMusicBed = () => {
  if (typeof window === "undefined") return;
  if (audioState.musicInterval !== null) return;
  unlockAudio();
  audioState.musicInterval = window.setInterval(() => {
    if (!audioState.unlocked) return;
    const note = melody[audioState.musicStep % melody.length];
    playTone({ freq: note, type: "triangle", duration: 0.22, volume: 0.055, sweep: 20 }, note);
    if (audioState.musicStep % 4 === 0) {
      playTone({ freq: Math.max(120, note / 2), type: "sine", duration: 0.26, volume: 0.035, sweep: -10 });
    }
    audioState.musicStep += 1;
  }, 260);
};

export const stopMusicBed = () => {
  if (typeof window === "undefined") return;
  if (audioState.musicInterval !== null) {
    window.clearInterval(audioState.musicInterval);
    audioState.musicInterval = null;
  }
};

export const playAudioCue = (cue: AudioCue) => {
  const config = CUE_MAP[cue];
  if (!config) return;
  playTone(config);
};
