import { describe, it, expect } from 'vitest';
import {
  getDogAvatarSrc,
  DOG_AVATAR_PIPE,
  DOG_AVATAR_PINCE_NEZ,
  DOG_AVATAR_PEERING,
} from './dogAvatars.js';

describe('dogAvatars', () => {
  it('gives human the pipe dog', () => {
    expect(getDogAvatarSrc(2, 2)).toBe(DOG_AVATAR_PIPE);
  });

  it('maps bot seats to distinct portraits when human is seat 0', () => {
    expect(getDogAvatarSrc(0, 0)).toBe(DOG_AVATAR_PIPE);
    expect(getDogAvatarSrc(1, 0)).toBe(DOG_AVATAR_PINCE_NEZ);
    expect(getDogAvatarSrc(2, 0)).toBe(DOG_AVATAR_PEERING);
  });

  it('avoids pipe avatar on bot-occupied seat 0 when human is elsewhere', () => {
    expect(getDogAvatarSrc(0, 3)).not.toBe(DOG_AVATAR_PIPE);
  });
});
