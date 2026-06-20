import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from './Card.jsx';

describe('Card', () => {
  it('renders element symbol and number', () => {
    const { container } = render(<Card element={{ symbol: 'H', name: 'Hydrogen', number: 1 }} />);
    expect(container.textContent).toContain('H');
    expect(container.textContent).toContain('1');
    expect(container.textContent).toContain('Hydrogen');
  });

  it('renders face down card when faceDown=true', () => {
    render(<Card element={{ symbol: 'H' }} faceDown />);
    expect(screen.getByTestId('card-facedown')).toBeTruthy();
  });

  it('uses dark text on light element backgrounds (wiki links included)', () => {
    render(<Card element={{ symbol: 'S', name: 'Sulfur', number: 16, color: '#ffff30' }} />);
    const link = screen.getByTestId('card-S');
    expect(link.className).toMatch(/card-light/);
    expect(link.style.getPropertyValue('--card-text').trim()).toBe('#1a1208');
  });

  it('uses white text on dark element backgrounds', () => {
    render(<Card element={{ symbol: 'Th', name: 'Thorium', number: 90, color: '#3050f8' }} />);
    const link = screen.getByTestId('card-Th');
    expect(link.className).not.toMatch(/card-light/);
    expect(link.style.getPropertyValue('--card-text').trim()).toBe('#ffffff');
  });

  it('keeps default styling when background color is dark', () => {
    const { container } = render(
      <Card element={{ symbol: 'N', name: 'Nitrogen', number: 7, color: '#3050f8' }} />
    );
    expect(container.querySelector('.card.card-light')).toBeFalsy();
  });

  it('links face-up card to Wikipedia like Periodic Placement', () => {
    render(<Card element={{ symbol: 'Na', name: 'Sodium', number: 11 }} />);
    const link = screen.getByTestId('card-Na');
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('https://en.wikipedia.org/wiki/Sodium');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(screen.getByText('Read on Wikipedia →')).toBeTruthy();
  });

  it('resolves Wikipedia URL from symbol when name omitted', () => {
    render(<Card element={{ symbol: 'He', number: 2, color: '#d9ffff' }} />);
    expect(screen.getByTestId('card-He').getAttribute('href')).toBe('https://en.wikipedia.org/wiki/Helium');
  });

  it('does not link face-down cards', () => {
    render(<Card element={{ symbol: 'H', name: 'Hydrogen' }} faceDown />);
    expect(screen.queryByRole('link')).toBeFalsy();
  });

  it('highlights cards that are part of a known molecule combo', () => {
    const { container } = render(
      <Card element={{ symbol: 'O', name: 'Oxygen', number: 8 }} moleculeCombo="h2o" />
    );
    expect(container.querySelector('.card-known-molecule')).toBeTruthy();
  });

  it('does not highlight when symbol is not in the molecule', () => {
    const { container } = render(
      <Card element={{ symbol: 'Fe', name: 'Iron', number: 26 }} moleculeCombo="h2o" />
    );
    expect(container.querySelector('.card-known-molecule')).toBeFalsy();
  });

  it('highlights catalog molecule symbols in test mode', () => {
    const { container } = render(
      <Card element={{ symbol: 'Si', name: 'Silicon', number: 14 }} moleculeCombo="sio2" />
    );
    expect(container.querySelector('.card-known-molecule')).toBeTruthy();
  });
});
