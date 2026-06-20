import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPrimaryBotWinnerIndex, playDogBark } from './dogBark.js';

describe('getPrimaryBotWinnerIndex', () => {
  it('returns bot seat when a solo bot wins', () => {
    expect(getPrimaryBotWinnerIndex({
      winnerIndices: [2],
      humanIndex: 0,
      isMultiplayer: false,
    })).toBe(2);
  });

  it('returns null when human wins solo', () => {
    expect(getPrimaryBotWinnerIndex({
      winnerIndices: [0],
      humanIndex: 0,
      isMultiplayer: false,
    })).toBeNull();
  });

  it('returns null in multiplayer even if winner is not human', () => {
    expect(getPrimaryBotWinnerIndex({
      winnerIndices: [3],
      humanIndex: 1,
      isMultiplayer: true,
    })).toBeNull();
  });

  it('falls back to winnerIndex when winnerIndices is empty', () => {
    expect(getPrimaryBotWinnerIndex({
      winnerIndex: 4,
      winnerIndices: [],
      humanIndex: 0,
      isMultiplayer: false,
    })).toBe(4);
  });
});

describe('playDogBark', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('does not throw when Web Audio is unavailable', async () => {
    const original = globalThis.window;
    // @ts-expect-error test shim
    delete globalThis.window;
    await expect(playDogBark()).resolves.toBeUndefined();
    globalThis.window = original;
  });

  it('plays through AudioContext when available', async () => {
    const start = vi.fn();
    const stop = vi.fn();
    const connect = vi.fn();
    const exponentialRampToValueAtTime = vi.fn();
    const setValueAtTime = vi.fn();

    const node = () => ({
      connect,
      start,
      stop,
      frequency: { setValueAtTime, exponentialRampToValueAtTime },
      gain: { setValueAtTime, exponentialRampToValueAtTime },
      type: '',
      buffer: null,
    });

    const ctx = {
      state: 'running',
      currentTime: 0,
      sampleRate: 44100,
      destination: {},
      resume: vi.fn().mockResolvedValue(undefined),
      createOscillator: vi.fn(node),
      createGain: vi.fn(node),
      createBuffer: vi.fn(() => ({ getChannelData: () => new Float32Array(8) })),
      createBufferSource: vi.fn(node),
      createBiquadFilter: vi.fn(() => ({ connect, type: '', frequency: { value: 0 }, Q: { value: 0 } })),
    };

    class MockAudioContext {
      constructor() {
        return ctx;
      }
    }

    vi.stubGlobal('window', {
      AudioContext: MockAudioContext,
    });

    await playDogBark();

    expect(ctx.createOscillator).toHaveBeenCalled();
    expect(start).toHaveBeenCalled();
    expect(stop).toHaveBeenCalled();
  });
});
