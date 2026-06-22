import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App.jsx';
import { AuthProvider } from './auth/useAuth.jsx';

vi.mock('./firebase.js', () => ({
  auth: { currentUser: null },
  db: {},
  default: {},
}));

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (_auth, cb) => {
    cb(null);
    return () => {};
  },
  signInAnonymously: vi.fn(),
  getAuth: vi.fn(),
  GoogleAuthProvider: class GoogleAuthProvider {},
  EmailAuthProvider: { credential: vi.fn() },
  linkWithPopup: vi.fn(),
  signInWithPopup: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  linkWithCredential: vi.fn(),
  sendEmailVerification: vi.fn(),
}));

vi.mock('./auth/userProfile.js', () => ({
  upsertUserFromAuth: vi.fn(),
  finalizeSubscriber: vi.fn(),
  fetchSubscriberCount: vi.fn().mockResolvedValue(0),
}));

function renderApp() {
  return render(
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}

describe('App molecule test button', () => {
  const origLocation = window.location;

  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...origLocation, hostname: 'localhost', search: '' },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: origLocation,
    });
  });

  it('shows Test all 50 molecules on localhost', () => {
    renderApp();
    expect(screen.getByTestId('start-molecule-test')).toBeTruthy();
    expect(screen.getByTestId('local-test-banner').textContent).toMatch(/Local dev/);
  });

  it('shows dev mode hint on production hostname with ?test=1', () => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...origLocation, hostname: 'periodictablepoker.web.app', search: '?test=1' },
    });
    renderApp();
    expect(screen.getByTestId('start-molecule-test')).toBeTruthy();
    expect(screen.getByTestId('local-test-banner').textContent).toMatch(/Test all 50 molecules/);
  });

  it('does not show test button on production without ?test=1', () => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...origLocation, hostname: 'periodictablepoker.web.app', search: '' },
    });
    renderApp();
    expect(screen.queryByTestId('start-molecule-test')).toBeFalsy();
  });

  it('starts molecule test session when clicked', () => {
    renderApp();
    fireEvent.click(screen.getByTestId('start-molecule-test'));
    expect(screen.getByTestId('molecule-test-banner')).toBeTruthy();
    expect(screen.getByTestId('molecule-test-banner').textContent).toContain('1/50');
    expect(screen.getByTestId('molecule-test-banner').textContent).toContain('CHONP');
  });
});

describe('App mobile game shell', () => {
  it('uses app-game layout with compact header when playing solo', () => {
    renderApp();
    fireEvent.click(screen.getByRole('button', { name: /play solo/i }));
    expect(screen.getByTestId('app-game')).toBeTruthy();
    expect(screen.getByTestId('app-game-header')).toBeTruthy();
    expect(screen.getByTestId('game-board')).toBeTruthy();
  });

  it('uses app-lobby layout when playing online', () => {
    renderApp();
    fireEvent.click(screen.getByRole('button', { name: /play online/i }));
    expect(screen.getByTestId('app-lobby')).toBeTruthy();
  });
});
