import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HomePage } from './HomePage.jsx';

describe('HomePage', () => {
  it('renders hero scene with periodic table on the wall', () => {
    render(
      <HomePage
        isLocalTest={false}
        localTestBanner={null}
        onPlaySolo={() => {}}
        onPlayOnline={() => {}}
        onMoleculeTest={() => {}}
        githubRepo="owner/repo"
      />
    );
    expect(screen.getByTestId('home-hero')).toBeTruthy();
    expect(screen.getByAltText(/Periodic table of the elements/i)).toBeTruthy();
    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeTruthy();
  });

  it('calls play handlers from navigation buttons', () => {
    const onPlaySolo = vi.fn();
    const onPlayOnline = vi.fn();
    render(
      <HomePage
        isLocalTest={false}
        localTestBanner={null}
        onPlaySolo={onPlaySolo}
        onPlayOnline={onPlayOnline}
        onMoleculeTest={() => {}}
        githubRepo="owner/repo"
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /play solo/i }));
    fireEvent.click(screen.getByRole('button', { name: /play online/i }));
    expect(onPlaySolo).toHaveBeenCalledTimes(1);
    expect(onPlayOnline).toHaveBeenCalledTimes(1);
  });

  it('styles scoreboard and github links as secondary actions', () => {
    render(
      <HomePage
        isLocalTest={true}
        localTestBanner={<div data-testid="banner">dev</div>}
        onPlaySolo={() => {}}
        onPlayOnline={() => {}}
        onMoleculeTest={() => {}}
        githubRepo="owner/repo"
      />
    );
    expect(screen.getByTestId('view-scoreboard-home').className).toMatch(/btn-secondary/);
    expect(screen.getByTestId('community-rules-github-home').className).toMatch(/btn-secondary/);
    expect(screen.getByTestId('start-molecule-test')).toBeTruthy();
  });
});
