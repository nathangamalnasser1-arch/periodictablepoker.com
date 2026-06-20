import { ELEMENTS } from './elements.js';

const NAME_BY_SYMBOL = Object.fromEntries(ELEMENTS.map((el) => [el.symbol, el.name]));

/** Same URL pattern as Periodic Placement (ptgame). */
export function elementWikiUrl(name) {
  const trimmed = (name ?? '').trim();
  if (!trimmed) return null;
  return `https://en.wikipedia.org/wiki/${trimmed.replace(/\s+/g, '_')}`;
}

export function resolveElementName(element) {
  if (!element) return null;
  if (element.name) return element.name;
  if (element.symbol && NAME_BY_SYMBOL[element.symbol]) return NAME_BY_SYMBOL[element.symbol];
  return null;
}

export function elementWikiUrlFromElement(element) {
  const name = resolveElementName(element);
  return elementWikiUrl(name);
}
