import { describe, it, expect } from 'vitest';
import {
  buildHierarchyIssueUrl,
  validateProposalName,
  shouldShowCommunityHierarchy,
  formatHandCards,
  githubIssuesListUrl,
  DEFAULT_GITHUB_REPO,
} from './hierarchy.js';

describe('hierarchy', () => {
  describe('validateProposalName', () => {
    it('uses Anonymous when empty', () => {
      expect(validateProposalName('').value).toBe('Anonymous');
      expect(validateProposalName('   ').value).toBe('Anonymous');
    });

    it('trims and accepts valid names', () => {
      expect(validateProposalName('  Alice  ').value).toBe('Alice');
    });

    it('rejects names over 32 chars', () => {
      expect(validateProposalName('a'.repeat(33)).ok).toBe(false);
    });
  });

  describe('shouldShowCommunityHierarchy', () => {
    it('shows in real game when human is in', () => {
      expect(shouldShowCommunityHierarchy({ gameNumber: 4, humanFolded: false })).toBe(true);
    });

    it('hides in tutorial', () => {
      expect(shouldShowCommunityHierarchy({ gameNumber: 3, humanFolded: false })).toBe(false);
    });

    it('hides when human folded', () => {
      expect(shouldShowCommunityHierarchy({ gameNumber: 4, humanFolded: true })).toBe(false);
    });
  });

  describe('formatHandCards', () => {
    it('formats card symbols and mass', () => {
      expect(formatHandCards([{ symbol: 'C', mass: 12 }, { symbol: 'H', number: 1 }])).toBe('C (12u), H (1u)');
    });
  });

  describe('buildHierarchyIssueUrl', () => {
    const repo = DEFAULT_GITHUB_REPO;
    const bestHand = {
      weight: 100,
      cards: [{ symbol: 'Fe', mass: 56 }, { symbol: 'Cu', mass: 64 }],
    };

    it('builds hand-ranking issue URL', () => {
      const url = buildHierarchyIssueUrl(repo, { displayName: 'Alice', bestHand });
      expect(url).toContain('github.com');
      expect(url).toContain('issues/new');
      expect(decodeURIComponent(url)).toContain('Hierarchy proposal: 100 u — Alice');
      expect(decodeURIComponent(url)).toContain('Fe (56u)');
      expect(decodeURIComponent(url)).toContain('Life-first reminder');
    });

    it('builds new-rule issue URL', () => {
      const url = buildHierarchyIssueUrl(repo, { displayName: 'Bob', proposalType: 'new-rule' });
      expect(decodeURIComponent(url)).toContain('New rule proposal — Bob');
      expect(decodeURIComponent(url)).toContain('Proposed rule');
    });

    it('uses Anonymous when name empty', () => {
      const url = buildHierarchyIssueUrl(repo, { displayName: '', bestHand });
      expect(decodeURIComponent(url)).toContain('Anonymous');
    });
  });

  describe('githubIssuesListUrl', () => {
    it('points to repo issues', () => {
      expect(githubIssuesListUrl(DEFAULT_GITHUB_REPO)).toBe(`https://github.com/${DEFAULT_GITHUB_REPO}/issues`);
    });
  });
});
