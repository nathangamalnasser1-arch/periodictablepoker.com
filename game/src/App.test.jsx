import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App.jsx';

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
    render(<App />);
    expect(screen.getByTestId('start-molecule-test')).toBeTruthy();
    expect(screen.getByTestId('local-test-banner').textContent).toMatch(/Local dev/);
  });

  it('shows dev mode hint on production hostname with ?test=1', () => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...origLocation, hostname: 'periodictablepoker.web.app', search: '?test=1' },
    });
    render(<App />);
    expect(screen.getByTestId('start-molecule-test')).toBeTruthy();
    expect(screen.getByTestId('local-test-banner').textContent).toMatch(/Test all 50 molecules/);
  });

  it('does not show test button on production without ?test=1', () => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...origLocation, hostname: 'periodictablepoker.web.app', search: '' },
    });
    render(<App />);
    expect(screen.queryByTestId('start-molecule-test')).toBeFalsy();
  });

  it('starts molecule test session when clicked', () => {
    render(<App />);
    fireEvent.click(screen.getByTestId('start-molecule-test'));
    expect(screen.getByTestId('molecule-test-banner')).toBeTruthy();
    expect(screen.getByTestId('molecule-test-banner').textContent).toContain('1/50');
    expect(screen.getByTestId('molecule-test-banner').textContent).toContain('CHONP');
  });
});
