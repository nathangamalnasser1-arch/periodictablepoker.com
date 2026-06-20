export const DEFAULT_GITHUB_REPO = 'nathangamalnasser1-arch/periodictablepoker.com';

const LIFE_FIRST_REMINDER = [
  '## Life-first reminder',
  'Per game rules: arguing destruction makes a hand "better" is disqualifying. Argue how elements sustain life, energy, or scientific value.',
].join('\n');

const FOOTER = '_Submitted from Periodic Table Poker — community hierarchy proposal_';

export function validateProposalName(name) {
  const trimmed = (name ?? '').trim();
  if (!trimmed) return { ok: true, value: 'Anonymous' };
  if (trimmed.length > 32) return { ok: false, error: 'Name must be 32 characters or less' };
  return { ok: true, value: trimmed };
}

export function shouldShowCommunityHierarchy({ gameNumber, humanFolded }) {
  if (gameNumber < 4) return false;
  if (humanFolded) return false;
  return true;
}

export function formatHandCards(cards) {
  return (cards ?? [])
    .map((c) => `${c.symbol} (${c.mass ?? c.number ?? '?'}u)`)
    .join(', ');
}

export function githubIssuesListUrl(repo) {
  return `https://github.com/${repo}/issues`;
}

export function buildHierarchyIssueUrl(repo, { displayName, bestHand, proposalType = 'hand-ranking' } = {}) {
  const validated = validateProposalName(displayName);
  if (!validated.ok) throw new Error(validated.error);
  const name = validated.value;
  const base = `https://github.com/${repo}/issues/new`;

  if (proposalType === 'new-rule') {
    const title = `New rule proposal — ${name}`;
    const body = [
      '## Player',
      name,
      '',
      '## Proposed rule',
      '(Describe the new rule or change to the hierarchy.)',
      '',
      '## Scientific / educational rationale',
      '(Explain why this rule improves the game or reflects science.)',
      '',
      LIFE_FIRST_REMINDER,
      '',
      FOOTER,
    ].join('\n');
    return `${base}?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
  }

  const { cards = [], weight = 0 } = bestHand ?? {};
  const title = `Hierarchy proposal: ${weight} u — ${name}`;
  const body = [
    '## Player',
    name,
    '',
    '## Proposed best hand',
    `**Weight:** ${weight} u`,
    `**Cards:** ${formatHandCards(cards)}`,
    '',
    '## Why should this rank where it does?',
    '(Explain with scientific reasoning — life-first arguments preferred.)',
    '',
    LIFE_FIRST_REMINDER,
    '',
    FOOTER,
  ].join('\n');
  return `${base}?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
}
