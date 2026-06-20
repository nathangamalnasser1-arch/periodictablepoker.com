/** Primary winner seat index when a solo bot wins the hand; null otherwise. */
export function getPrimaryBotWinnerIndex({
  winnerIndices,
  winnerIndex,
  humanIndex,
  isMultiplayer = false,
}) {
  if (isMultiplayer) return null;
  const indices = winnerIndices?.length
    ? winnerIndices
    : (winnerIndex != null ? [winnerIndex] : []);
  const primary = indices[0];
  if (primary == null || primary === humanIndex) return null;
  return primary;
}

let sharedAudioContext = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) return null;
  if (!sharedAudioContext) {
    sharedAudioContext = new AudioContextCtor();
  }
  return sharedAudioContext;
}

/** Synthesized short bark — no asset file required. */
export async function playDogBark() {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch {
      return;
    }
  }

  const start = ctx.currentTime;
  const duration = 0.24;

  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(300, start);
  osc.frequency.exponentialRampToValueAtTime(110, start + duration);

  const oscGain = ctx.createGain();
  oscGain.gain.setValueAtTime(0.0001, start);
  oscGain.gain.exponentialRampToValueAtTime(0.28, start + 0.015);
  oscGain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const samples = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) {
    samples[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }

  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 820;
  filter.Q.value = 0.75;

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.22, start);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, start + duration * 0.75);

  osc.connect(oscGain);
  oscGain.connect(ctx.destination);
  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(ctx.destination);

  osc.start(start);
  osc.stop(start + duration);
  noise.start(start);
  noise.stop(start + duration);
}
