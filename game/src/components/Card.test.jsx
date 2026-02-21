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
});
