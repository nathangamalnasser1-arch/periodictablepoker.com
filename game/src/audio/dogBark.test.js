import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  DOG_BARK_SRC,
  DOG_BARK_PREF_KEY,
  getDefaultDogBarkEnabled,
  readDogBarkPreference,
  writeDogBarkPreference,
  isDogBarkEnabled,
  getPrimaryBotWinnerIndex,
  getBotWinnerForBark,
  playDogBark,
} from './dogBark.js';

describe('dog bark preference', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('defaults on for the first solo hand (game 4)', () => {
    expect(getDefaultDogBarkEnabled(4)).toBe(true);
    expect(getDefaultDogBarkEnabled(5)).toBe(false);
    expect(isDogBarkEnabled(4)).toBe(true);
    expect(isDogBarkEnabled(5)).toBe(false);
  });

  it('persists user preference over defaults', () => {
    writeDogBarkPreference(false);
    expect(readDogBarkPreference()).toBe(false);
    expect(isDogBarkEnabled(4)).toBe(false);

    writeDogBarkPreference(true);
    expect(isDogBarkEnabled(5)).toBe(true);
  });

  it('returns bot winner only when bark is enabled', () => {
    expect(getBotWinnerForBark({
      gameNumber: 4,
      winnerIndices: [2],
      humanIndex: 0,
    })).toBe(2);

    expect(getBotWinnerForBark({
      gameNumber: 5,
      winnerIndices: [2],
      humanIndex: 0,
      dogBarkEnabled: false,
    })).toBeNull();
  });
});

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

  it('does not throw when audio is unavailable', async () => {
    const original = globalThis.window;
    // @ts-expect-error test shim
    delete globalThis.window;
    await expect(playDogBark()).resolves.toBeUndefined();
    globalThis.window = original;
  });

  it('plays the dog bark mp3 when audio is available', async () => {
    const play = vi.fn().mockResolvedValue(undefined);
    let audioInstance = null;
    class MockAudio {
      constructor(src) {
        this.src = src;
        this.currentTime = 0;
        this.preload = '';
        audioInstance = this;
      }

      play = play;
    }

    vi.stubGlobal('window', { Audio: MockAudio });
    vi.stubGlobal('Audio', MockAudio);

    await playDogBark();

    expect(play).toHaveBeenCalledTimes(1);
    expect(audioInstance?.src).toBe(DOG_BARK_SRC);
    expect(audioInstance?.currentTime).toBe(0);
  });
});
