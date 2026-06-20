import { describe, it, expect } from 'vitest';
import { isLocalTestEnv } from './localTest.js';

describe('localTest', () => {
  it('detects localhost', () => {
    expect(isLocalTestEnv('localhost', '')).toBe(true);
    expect(isLocalTestEnv('127.0.0.1', '')).toBe(true);
    expect(isLocalTestEnv('periodictablepoker.web.app', '')).toBe(false);
  });

  it('detects ?test=1 query', () => {
    expect(isLocalTestEnv('periodictablepoker.web.app', '?test=1')).toBe(true);
    expect(isLocalTestEnv('example.com', '?foo=1')).toBe(false);
  });
});
