import React from 'react';
import { elementWikiUrl } from '../data/elements.js';

/** Returns true if hex color is light (use black text) */
function isLightColor(hex) {
  if (!hex || typeof hex !== 'string') return false;
  const h = hex.replace(/^#/, '');
  if (h.length !== 6 && h.length !== 3) return false;
  const r = parseInt(h.length === 3 ? h[0] + h[0] : h.slice(0, 2), 16) / 255;
  const g = parseInt(h.length === 3 ? h[1] + h[1] : h.slice(2, 4), 16) / 255;
  const b = parseInt(h.length === 3 ? h[2] + h[2] : h.slice(4, 6), 16) / 255;
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance > 0.5;
}

export function Card({ element, faceDown = false }) {
  if (faceDown) {
    return (
      <div className="card card-facedown" data-testid="card-facedown">
        <div className="card-back">?</div>
      </div>
    );
  }

  const { symbol, name, number, color, wikiUrl } = element;
  const bg = color || '#1f2937';
  const textDark = isLightColor(bg);
  const href = wikiUrl ?? elementWikiUrl(name);
  const wikiTitle = name ? `${name} on Wikipedia` : 'Wikipedia';

  return (
    <div
      className={`card ${textDark ? 'card-light' : ''}`}
      data-testid={`card-${symbol}`}
      style={{ '--card-color': bg }}
    >
      <a
        href={href}
        className="card-wiki-link"
        target="_blank"
        rel="noopener noreferrer"
        title={wikiTitle}
        aria-label={wikiTitle}
        data-testid={`card-wiki-${symbol}`}
      >
        <div className="card-symbol">{symbol}</div>
        <div className="card-number">{number}</div>
        {name && <div className="card-name">{name}</div>}
      </a>
    </div>
  );
}
