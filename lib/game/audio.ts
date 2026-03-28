type AudioCue = "attack" | "boss" | "warning" | "hit" | "damage";

type WindowWithAudio = Window & {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
};

type CueConfig = {
  freq: number;
  type: OscillatorType;
  duration: number;
  volume: number;
};

const CUE_MAP: Record<AudioCue, CueConfig> = {
  attack: { freq: 420, type: "triangle", duration: 0.12, volume: 0.24 },
  boss: { freq: 200, type: "sine", duration: 0.28, volume: 0.2 },
  warning: { freq: 180, type: "square", duration: 0.32, volume: 0.18 },
  hit: { freq: 480, type: "triangle", duration: 0.1, volume: 0.22 },
  damage: { freq: 138, type: "sawtooth", duration: 0.18, volume: 0.2 }
};

const audioState = {
  context: null as AudioContext | null
};

const getAudioContext = () => {
  if (typeof window === "undefined") return null;
  if (audioState.context) return audioState.context;
  const win = window as WindowWithAudio;
  const AudioCtor = win.AudioContext || win.webkitAudioContext;
  if (!AudioCtor) return null;
  audioState.context = new AudioCtor();
  return audioState.context;
};

const playTone = (config: CueConfig) => {
  const ctx = getAudioContext();
  if (!ctx) return;
  const start = () => {
    const now = ctx.currentTime;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = config.type;
    oscillator.frequency.value = config.freq;
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

export const playAudioCue = (cue: AudioCue) => {
  const config = CUE_MAP[cue];
  if (!config) return;
  playTone(config);
};
