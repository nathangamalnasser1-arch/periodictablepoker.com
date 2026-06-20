import React from 'react';
import { elementWikiUrlFromElement, resolveElementName } from '../data/elementWiki.js';
import { isSymbolInKnownMolecule } from '../data/knownMolecules.js';
import { isSymbolInCatalogMolecule } from '../data/moleculeCatalog.js';

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

export function Card({ element, faceDown = false, moleculeCombo = null }) {
  if (faceDown) {
    return (
      <div className="card card-facedown" data-testid="card-facedown">
        <div className="card-back">?</div>
      </div>
    );
  }

  const { symbol, name, number, color } = element;
  const wikiName = resolveElementName(element);
  const wikiUrl = elementWikiUrlFromElement(element);
  const bg = color || '#1f2937';
  const textDark = isLightColor(bg);
  const cardText = textDark ? '#1a1208' : '#ffffff';
  const inKnownMolecule = moleculeCombo && (
    isSymbolInKnownMolecule(symbol, moleculeCombo)
    || isSymbolInCatalogMolecule(symbol, moleculeCombo)
  );
  const cardClass = `card ${textDark ? 'card-light' : ''}${wikiUrl ? ' card-wiki' : ''}${inKnownMolecule ? ' card-known-molecule' : ''}`;

  const content = (
    <>
      <div className="card-symbol">{symbol}</div>
      <div className="card-number">{number}</div>
      {name && <div className="card-name">{name}</div>}
      {wikiUrl && (
        <div className="card-wiki-link" aria-hidden="true">
          Read on Wikipedia →
        </div>
      )}
    </>
  );

  if (wikiUrl) {
    return (
      <a
        href={wikiUrl}
        className={cardClass}
        data-testid={`card-${symbol}`}
        style={{ '--card-color': bg, '--card-text': cardText }}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${wikiName} — Read on Wikipedia`}
        title={`${wikiName} — Read on Wikipedia`}
      >
        {content}
      </a>
    );
  }

  return (
    <div
      className={cardClass}
      data-testid={`card-${symbol}`}
      style={{ '--card-color': bg, '--card-text': cardText }}
    >
      {content}
    </div>
  );
}
