import { compositeScore, mapStatsEntryDoc } from '../stats/stats.js';

export const RANKING_TABS = [
  { id: 'champions', label: 'Champions' },
  { id: 'bestHands', label: 'Best hands' },
  { id: 'coins', label: 'Prize coins' },
  { id: 'overall', label: 'Overall' },
];

export function sortChampions(entries) {
  return [...entries].sort((a, b) => {
    const w = (b.gamesWon ?? 0) - (a.gamesWon ?? 0);
    if (w !== 0) return w;
    return (b.coinBalance ?? 0) - (a.coinBalance ?? 0);
  });
}

export function sortBestHands(entries) {
  return [...entries].sort((a, b) => {
    const h = (b.bestHandWeight ?? 0) - (a.bestHandWeight ?? 0);
    if (h !== 0) return h;
    return (b.gamesWon ?? 0) - (a.gamesWon ?? 0);
  });
}

export function sortCoins(entries) {
  return [...entries].sort((a, b) => {
    const c = (b.coinBalance ?? 0) - (a.coinBalance ?? 0);
    if (c !== 0) return c;
    return (b.gamesWon ?? 0) - (a.gamesWon ?? 0);
  });
}

export function sortOverall(entries) {
  return [...entries]
    .map((e) => ({ ...e, composite: compositeScore(e) }))
    .sort((a, b) => b.composite - a.composite);
}

export function rankEntries(entries, tabId) {
  let sorted;
  if (tabId === 'champions') sorted = sortChampions(entries);
  else if (tabId === 'bestHands') sorted = sortBestHands(entries);
  else if (tabId === 'coins') sorted = sortCoins(entries);
  else sorted = sortOverall(entries);

  return sorted.map((row, i) => ({
    ...mapStatsEntryDoc(row.id ?? row.uid, row),
    rank: i + 1,
    composite: row.composite ?? compositeScore(row),
  }));
}

export function formatBestHandLabel(weight, reason, moleculeLabelFn) {
  if (!weight) return '—';
  const label = reason && moleculeLabelFn ? moleculeLabelFn(reason) : '';
  if (label) return `${label} (${weight} u)`;
  return `${weight} u`;
}
