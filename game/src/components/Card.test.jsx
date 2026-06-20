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

  it('adds card-light class when background color is light', () => {
    const { container } = render(
      <Card element={{ symbol: 'Sc', name: 'Scandium', number: 21, color: '#e6e6e6' }} />
    );
    expect(container.querySelector('.card.card-light')).toBeTruthy();
  });

  it('keeps default styling when background color is dark', () => {
    const { container } = render(
      <Card element={{ symbol: 'N', name: 'Nitrogen', number: 7, color: '#3050f8' }} />
    );
    expect(container.querySelector('.card.card-light')).toBeFalsy();
  });

  it('links element to English Wikipedia', () => {
    render(
      <Card element={{ symbol: 'Fe', name: 'Iron', number: 26, wikiUrl: 'https://en.wikipedia.org/wiki/Iron' }} />
    );
    const link = screen.getByTestId('card-wiki-Fe');
    expect(link.getAttribute('href')).toBe('https://en.wikipedia.org/wiki/Iron');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('title')).toContain('Iron');
  });

  it('does not show wiki link when face down', () => {
    render(<Card element={{ symbol: 'H', name: 'Hydrogen', wikiUrl: 'https://en.wikipedia.org/wiki/Hydrogen' }} faceDown />);
    expect(screen.queryByTestId('card-wiki-H')).toBeFalsy();
  });
});
