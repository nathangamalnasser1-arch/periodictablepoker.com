/** True on localhost or when URL has ?test=1 (dev-only UI). */
export function isLocalTestEnv(hostname, search = '') {
  return hostname === 'localhost'
    || hostname === '127.0.0.1'
    || String(search).includes('test=1');
}

export function isLocalTestWindow(win = typeof window !== 'undefined' ? window : null) {
  if (!win?.location) return import.meta.env?.DEV === true;
  return isLocalTestEnv(win.location.hostname, win.location.search);
}
