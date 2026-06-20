import React, { useState, useEffect, useRef } from 'react';
import { Card } from './Card.jsx';
import { getBestHand, getMoleculeCombo, getMinOpenBet, getMinRaiseTo } from '../game/gameLogic.js';
import { formatFirebaseError } from '../multiplayer/core.js';
import {
  shouldShowMoleculeScoreboard,
  submitMoleculeScore,
  moleculeLabel,
} from '../scoreboard/scoreboard.js';
import {
  KNOWN_MOLECULES,
  MOLECULES_WIKI_INDEX,
  moleculeWikiUrl,
  moleculeDisplayLabel,
  moleculeRankingLabel,
  knownMoleculeLinkTitle,
  getKnownMolecule,
} from '../data/knownMolecules.js';
import {
  getCatalogMolecule,
  catalogSymbolsPresent,
  MOLECULE_CATALOG_COUNT,
} from '../data/moleculeCatalog.js';
import {
  buildHierarchyIssueUrl,
  shouldShowCommunityHierarchy,
  githubIssuesListUrl,
  validateProposalName,
} from '../hierarchy/hierarchy.js';
import {
  getDogAvatarSrc,
  getDogAvatarAlt,
} from '../data/dogAvatars.js';
import {
  TURN_TIMEOUT_SECONDS,
  BOT_TURN_GRACE_MS,
  getTurnSecondsRemaining,
  getTimeoutAction,
} from '../game/turnTimeout.js';

const HUMAN_INDEX = 0;
const NUM_PLAYERS = 5;

/** Seat positions around oval: index 0 = bottom (you), 1..4 = clockwise. */
function getSeatPosition(seatIndex) {
  const angleDeg = -90 + (seatIndex * 360 / NUM_PLAYERS);
  const angleRad = (angleDeg * Math.PI) / 180;
  const radiusX = 40;
  const radiusY = 36;
  const left = 50 + radiusX * Math.cos(angleRad);
  const top = 50 + radiusY * Math.sin(angleRad);
  const isTop = top < 50;
  const infoSide = left < 50 ? 'left' : 'right';
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  const portraitPush = 62;
  const contentPull = 22;
  return {
    left,
    top,
    isTop,
    infoSide,
    portraitDx: cos * portraitPush,
    portraitDy: sin * portraitPush,
    contentDx: -cos * contentPull,
    contentDy: -sin * contentPull,
  };
}

export function GameBoard({ gameState, gameNumber, onPlayerAction, onBotTurn, onNextHand, isGameOver, githubRepo, humanIndex = HUMAN_INDEX, isMultiplayer = false, openCards = false, playerNames = null, onSubmitMoleculeScore = submitMoleculeScore }) {
  if (!gameState) {
    return (
      <div className="game-board" data-testid="game-board">
        <p>No game in progress</p>
      </div>
    );
  }

  const {
    players, communityCards, phase, pot = 0, pots = [], currentBet = 0, roundBets = [],
    currentPlayerIndex, dealerIndex, winnerIndex, winnerIndices, winnerReason, lastAction, tutorial,
    moleculeTest, moleculeTestId, moleculeTestIndex, moleculeTestComplete,
  } = gameState;
  const minOpenBet = getMinOpenBet();
  const minRaiseTo = getMinRaiseTo(gameState);
  const isShowdown = phase === 'showdown';
  const you = players?.[humanIndex];
  const toCall = you && !you.folded ? Math.max(0, currentBet - (roundBets[humanIndex] || 0)) : 0;
  const isYourTurn = !isShowdown && currentPlayerIndex === humanIndex && you && !you.folded && you.chips > 0;
  const currentBot = !isShowdown && currentPlayerIndex !== humanIndex ? players?.[currentPlayerIndex] : null;
  const isBotTurn = !isMultiplayer && currentBot && !currentBot.folded && currentBot.chips > 0;
  const isBotTurnAllIn = !isMultiplayer && currentBot && !currentBot.folded && currentBot.chips === 0;
  const youAllIn = you && !you.folded && you.chips === 0;
  const currentTurnPlayer =
    !isShowdown && currentPlayerIndex != null && players?.[currentPlayerIndex] && !players[currentPlayerIndex].folded
      ? (currentPlayerIndex === humanIndex ? 'You' : (playerNames?.[currentPlayerIndex] ?? (isMultiplayer ? `Player ${currentPlayerIndex}` : `Bot ${currentPlayerIndex}`)))
      : null;
  const currentTurnIsAllIn = currentTurnPlayer && players?.[currentPlayerIndex]?.chips === 0;

  const indices = (winnerIndices != null && winnerIndices.length) ? winnerIndices : (winnerIndex != null ? [winnerIndex] : []);
  const winnerNames = indices.map((idx) => {
    if (!players?.[idx]) return '';
    if (idx === humanIndex) return 'You';
    return playerNames?.[idx] ?? (isMultiplayer ? `Player ${idx}` : `Bot ${idx}`);
  }).filter(Boolean);
  const winnerName = winnerNames.length === 1 ? winnerNames[0] : winnerNames.length > 1 ? winnerNames.join(', ') : '';
  const isSplitPot = (indices.length > 1);
  const winnerReasonLabel = winnerReason === 'mass' ? 'best hand' : moleculeDisplayLabel(winnerReason);

  const catalogTarget = moleculeTest ? getCatalogMolecule(moleculeTestId) : null;
  const yourCombo = you
    ? (moleculeTest && catalogSymbolsPresent(moleculeTestId, you.holeCards, communityCards)
      ? moleculeTestId
      : getMoleculeCombo(you.holeCards, communityCards))
    : null;
  const moleculeTestPassed = moleculeTest && isShowdown && you
    && catalogSymbolsPresent(moleculeTestId, you.holeCards, communityCards);
  const youHaveWinningMolecule =
    (gameNumber === 1 && yourCombo === 'nacl') ||
    (gameNumber === 2 && yourCombo === 'h2o') ||
    (gameNumber === 3 && yourCombo === 'chonp');
  const winningMoleculeLabel = gameNumber === 1 ? 'NaCl' : gameNumber === 2 ? 'H₂O' : gameNumber === 3 ? 'CHONP' : '';

  const showCardsOpen = isShowdown || !isMultiplayer || openCards;

  const [scoreboardName, setScoreboardName] = useState('');
  const [hierarchyName, setHierarchyName] = useState('');
  const [scoreboardSubmitting, setScoreboardSubmitting] = useState(false);
  const [scoreboardSubmitted, setScoreboardSubmitted] = useState(false);
  const [scoreboardError, setScoreboardError] = useState(null);
  const [flashingWinnerIndex, setFlashingWinnerIndex] = useState(null);
  const [clockTick, setClockTick] = useState(0);
  const [houseRulesOpen, setHouseRulesOpen] = useState(false);
  const [houseRulesTab, setHouseRulesTab] = useState('rules');
  const [realGameToastVisible, setRealGameToastVisible] = useState(false);
  const realGameToastShown = useRef(false);
  const riverAllInTriggered = useRef(false);
  const isRiverAllIn =
    phase === 'river' &&
    communityCards?.length === 5 &&
    players?.length > 0 &&
    players.filter((p) => !p.folded).every((p) => p.chips === 0);
  useEffect(() => {
    if (!isRiverAllIn || !onBotTurn || riverAllInTriggered.current) return;
    riverAllInTriggered.current = true;
    const t = setTimeout(onBotTurn, 100);
    return () => clearTimeout(t);
  }, [isRiverAllIn, onBotTurn]);
  useEffect(() => {
    if (phase !== 'river') riverAllInTriggered.current = false;
  }, [phase]);

  useEffect(() => {
    if (gameNumber === 4 && !realGameToastShown.current) {
      realGameToastShown.current = true;
      setRealGameToastVisible(true);
      const t = setTimeout(() => setRealGameToastVisible(false), 5000);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [gameNumber]);

  const showdownWinnerIndices = isShowdown && indices.length > 0 ? indices : [];
  useEffect(() => {
    if (showdownWinnerIndices.length > 0) {
      setFlashingWinnerIndex(showdownWinnerIndices[0]);
      const t = setTimeout(() => setFlashingWinnerIndex(null), 4500);
      return () => clearTimeout(t);
    }
    setFlashingWinnerIndex(null);
  }, [isShowdown, winnerIndex]);

  useEffect(() => {
    if (isShowdown) return undefined;
    const id = setInterval(() => setClockTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [isShowdown]);

  const turnSecondsRemaining = getTurnSecondsRemaining(gameState);
  // clockTick keeps countdown updating each second
  void clockTick;

  useEffect(() => {
    if (!isYourTurn || turnSecondsRemaining == null) return undefined;
    const msLeft = (turnSecondsRemaining ?? 0) * 1000;
    const timeout = setTimeout(() => {
      onPlayerAction(getTimeoutAction(gameState, humanIndex));
    }, Math.max(0, msLeft));
    return () => clearTimeout(timeout);
  }, [isYourTurn, gameState.turnStartedAt, gameState.currentPlayerIndex, humanIndex, onPlayerAction, turnSecondsRemaining]);

  const needsAutoAdvance = !isShowdown && currentTurnIsAllIn;
  useEffect(() => {
    if (!onBotTurn || (!isBotTurn && !needsAutoAdvance)) return;
    const delay = needsAutoAdvance ? 0 : 600;
    const t = setTimeout(onBotTurn, delay);
    const safety = setTimeout(() => onBotTurn(), BOT_TURN_GRACE_MS);
    return () => {
      clearTimeout(t);
      clearTimeout(safety);
    };
  }, [isBotTurn, needsAutoAdvance, currentPlayerIndex, onBotTurn, isShowdown]);

  const lastHandWeight = you && isShowdown ? getBestHand(you.holeCards, communityCards).weight : 0;

  const showMoleculeScoreboard = shouldShowMoleculeScoreboard({
    isShowdown,
    humanIndex,
    winnerIndex,
    winnerIndices,
    winnerReason,
    gameNumber,
    isMultiplayer,
  });
  const scoreboardHandKey = showMoleculeScoreboard ? `${gameNumber}-${winnerReason}` : null;

  useEffect(() => {
    setScoreboardSubmitted(false);
    setScoreboardError(null);
    setScoreboardSubmitting(false);
  }, [scoreboardHandKey]);

  const handleScoreboardSubmit = async () => {
    setScoreboardError(null);
    setScoreboardSubmitting(true);
    try {
      await onSubmitMoleculeScore({
        displayName: scoreboardName,
        molecule: winnerReason,
        gameNumber,
        handWeight: lastHandWeight,
      });
      setScoreboardSubmitted(true);
    } catch (err) {
      setScoreboardError(formatFirebaseError(err));
    } finally {
      setScoreboardSubmitting(false);
    }
  };

  const showCommunityHierarchy = shouldShowCommunityHierarchy({
    gameNumber,
    humanFolded: !!you?.folded,
  });
  const repo = githubRepo ?? 'nathangamalnasser1-arch/periodictablepoker.com';
  const yourBestHand = you ? getBestHand(you.holeCards, communityCards) : { cards: [], weight: 0 };
  const hierarchyNameValid = validateProposalName(hierarchyName);
  const hierarchyHandUrl = showCommunityHierarchy && hierarchyNameValid.ok
    ? buildHierarchyIssueUrl(repo, { displayName: hierarchyName, bestHand: yourBestHand })
    : null;
  const hierarchyNewRuleUrl = showCommunityHierarchy && hierarchyNameValid.ok
    ? buildHierarchyIssueUrl(repo, { displayName: hierarchyName, proposalType: 'new-rule' })
    : null;
  const githubIssuesUrl = githubIssuesListUrl(repo);

  const renderSeat = (player, seatIndex, displayName, isDealer) => {
    if (!player) return null;
    const { left, top, isTop, infoSide, portraitDx, portraitDy, contentDx, contentDy } = getSeatPosition(seatIndex);
    const bestHand = getBestHand(player.holeCards, communityCards);
    const combo = moleculeTest && seatIndex === humanIndex && catalogSymbolsPresent(moleculeTestId, player.holeCards, communityCards)
      ? moleculeTestId
      : getMoleculeCombo(player.holeCards, communityCards);
    const comboLabel = combo
      ? (getCatalogMolecule(combo)?.label || moleculeDisplayLabel(combo) || null)
      : null;
    const comboWikiUrl = combo
      ? (getCatalogMolecule(combo)?.wikiUrl || moleculeWikiUrl(combo))
      : null;
    const isYou = seatIndex === humanIndex;
    const showHandInfo = showCardsOpen || isYou;
    const isWinnerFlash = showdownWinnerIndices.includes(seatIndex) && flashingWinnerIndex != null;
    const folded = player.folded;
    const isCurrentTurn = !isShowdown && currentPlayerIndex === seatIndex && !folded;
    const turnLabel = isCurrentTurn ? (seatIndex === humanIndex ? 'Your turn' : `${displayName}'s turn`) : null;
    return (
      <div
        key={player.id}
        className={`seat seat-${seatIndex} ${isYou ? 'seat-you' : ''} ${isTop ? 'seat-top' : 'seat-bottom'} seat-info-${infoSide} ${isWinnerFlash ? 'winner-flash' : ''} ${folded ? 'seat-folded' : ''} ${isCurrentTurn ? 'seat-current-turn' : ''}`}
        data-testid={`player-${player.id}`}
        style={{ left: `${left}%`, top: `${top}%` }}
      >
        <div
          className={`seat-dog-portrait ${isYou ? 'seat-dog-portrait-you' : ''}`}
          data-testid={`dog-avatar-${seatIndex}`}
          style={{
            transform: `translate(calc(-50% + ${portraitDx}px), calc(-50% + ${portraitDy}px))`,
          }}
        >
          <img
            src={getDogAvatarSrc(seatIndex, humanIndex)}
            alt={getDogAvatarAlt(seatIndex, humanIndex, displayName)}
            className="seat-dog-portrait-img"
          />
        </div>
        <div
          className="seat-content"
          style={{
            transform: `translate(calc(-50% + ${contentDx}px), calc(-50% + ${contentDy}px))`,
          }}
        >
          <div className="seat-info">
            <div className={`player-box ${combo && !folded ? 'player-flash' : ''} ${isYou ? 'player-box-you' : ''}`} style={{ position: 'relative' }}>
              {isDealer && <span className="dealer-badge">D</span>}
              <div className="player-info">
                <span className="player-name" title={displayName}>{displayName}</span>
                <span className="player-chips">{player.chips}</span>
              </div>
            </div>
            {turnLabel && <div className="player-turn-label" data-testid={`turn-label-${seatIndex}`}>{turnLabel}</div>}
            {folded && <div className="player-folded-label">Folded</div>}
            {!folded && player.chips === 0 && (
              <div className="player-allin-label" data-testid={`player-allin-${player.id}`}>
                {isShowdown && isGameOver ? 'Busted' : 'All-in'}
              </div>
            )}
            {comboLabel && !folded && (
              <a
                href={comboWikiUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="player-combo-badge player-combo-link"
                data-testid={`combo-badge-${combo}`}
                title={`${getKnownMolecule(combo)?.name ?? getCatalogMolecule(combo)?.name ?? comboLabel} on Wikipedia`}
              >
                {comboLabel}!
              </a>
            )}
            {!folded && showHandInfo && <div className="player-best-hand">Best hand: {bestHand.weight} u</div>}
          </div>
          <div className="seat-cards">
            <div className="player-cards">
              {player.holeCards?.map((card, i) => (
                <Card
                  key={card.id || i}
                  element={card}
                  faceDown={!showCardsOpen && !isYou}
                  moleculeCombo={combo && !folded ? combo : null}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="game-board poker-view" data-testid="game-board">
      {moleculeTest && catalogTarget && !moleculeTestComplete && (
        <div className="molecule-test-banner" data-testid="molecule-test-banner">
          Molecule test {moleculeTestIndex}/{MOLECULE_CATALOG_COUNT}: {catalogTarget.label} — need {catalogTarget.cardHint}
        </div>
      )}
      {moleculeTestComplete && (
        <div className="molecule-test-complete" data-testid="molecule-test-complete">
          All {MOLECULE_CATALOG_COUNT} molecule tests complete.
        </div>
      )}
      {gameNumber === 3 && !moleculeTest && (
        <div className="chonp-yell-msg poker-view-msg" data-testid="chonp-yell-msg">Yell out CHONP!</div>
      )}
      {isRiverAllIn && !isShowdown && (
        <div className="resolving-showdown-msg" data-testid="resolving-showdown-msg">
          All-in — resolving showdown…
        </div>
      )}
      {realGameToastVisible && (
        <div className="real-game-toast poker-view-msg" data-testid="real-game-msg" role="status">
          The real game starts — 1000 atomcoins redistributed!
        </div>
      )}

      <button
        type="button"
        className="house-rules-btn"
        onClick={() => setHouseRulesOpen(true)}
        data-testid="house-rules-open"
        aria-expanded={houseRulesOpen}
        aria-controls="house-rules-drawer"
      >
        House rules
      </button>

      <div
        id="house-rules-drawer"
        className={`house-rules-drawer ${houseRulesOpen ? 'house-rules-drawer-open' : ''}`}
        data-testid="house-rules-drawer"
        aria-hidden={!houseRulesOpen}
      >
        {houseRulesOpen && (
          <button
            type="button"
            className="house-rules-backdrop"
            onClick={() => setHouseRulesOpen(false)}
            aria-label="Close house rules"
            data-testid="house-rules-backdrop"
          />
        )}
        <div className="house-rules-panel">
          <div className="house-rules-header">
            <h2 className="house-rules-title">House rules</h2>
            <button
              type="button"
              className="house-rules-close"
              onClick={() => setHouseRulesOpen(false)}
              aria-label="Close"
              data-testid="house-rules-close"
            >
              ×
            </button>
          </div>
          <div className="house-rules-tabs" role="tablist">
            {(['rules', 'molecules', 'community']).map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={houseRulesTab === tab}
                className={`house-rules-tab ${houseRulesTab === tab ? 'active' : ''}`}
                onClick={() => setHouseRulesTab(tab)}
                data-testid={`house-rules-tab-${tab}`}
              >
                {tab === 'rules' ? 'Rules' : tab === 'molecules' ? 'Molecules' : 'Community'}
              </button>
            ))}
          </div>
          <div className="house-rules-body">
            <div className="house-rules-tab-panel" hidden={houseRulesTab !== 'rules'}>
              <div className="rules-panel" data-testid="rules-panel">
                <section className="rules-section">
                  <h3 className="rules-section-title">The deck</h3>
                  <p>One card per element (118 unique symbols).</p>
                </section>
                <section className="rules-section">
                  <h3 className="rules-section-title">Molecule hands</h3>
                  <p>
                    A molecule hand means you have those element cards on the table — subscripts are chemistry shorthand only
                    (H₂O = H + O, CO₂ = C + O; not O₂ or N₂, which need duplicate cards).
                  </p>
                </section>
                <section className="rules-section">
                  <h3 className="rules-section-title">Ranking</h3>
                  <p>{moleculeRankingLabel()}. Tutorial hands 1–3 show NaCl, H₂O, then CHONP.</p>
                </section>
                <section className="rules-section">
                  <h3 className="rules-section-title">All-in</h3>
                  <p>
                    If you or a bot goes all-in, that player cannot fold and stays in until showdown; others must call
                    (or go all-in) to stay in or fold. When everyone still in is all-in, no further bets — remaining
                    community cards are dealt, then showdown.
                  </p>
                </section>
                {gameNumber >= 4 && (
                  <section className="rules-section">
                    <h3 className="rules-section-title">Bust</h3>
                    <p>Once a player has 0 atomcoins after a hand, they lose and the game is over.</p>
                  </section>
                )}
              </div>
            </div>
            <div className="house-rules-tab-panel" hidden={houseRulesTab !== 'molecules'}>
              <div className="known-molecules-panel" data-testid="known-molecules-panel">
                <p className="known-molecules-intro">
                  <strong>Known molecules</strong>
                  <span className="known-molecules-deck-hint"> (one card per element):</span>
                </p>
                <div className="known-molecules-plaque-grid">
                  {Object.values(KNOWN_MOLECULES).map((mol) => (
                    <a
                      key={mol.id}
                      href={mol.wikiUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="known-molecule-plaque known-molecule-link"
                      data-testid={`known-molecule-${mol.id}`}
                      title={knownMoleculeLinkTitle(mol)}
                    >
                      <span className="known-molecule-plaque-label">{mol.label}</span>
                      <span className="known-molecule-plaque-hint">{mol.cardHint}</span>
                      <span className="known-molecule-plaque-name">{mol.name}</span>
                    </a>
                  ))}
                </div>
                <a
                  href={MOLECULES_WIKI_INDEX}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="known-molecule-index-link"
                  data-testid="molecules-wiki-index"
                >
                  Lists of molecules (Wikipedia)
                </a>
              </div>
            </div>
            <div className="house-rules-tab-panel" hidden={houseRulesTab !== 'community'}>
              {showCommunityHierarchy ? (
                <div className="community-hierarchy" data-testid="community-hierarchy">
                  <h3 className="community-hierarchy-title">Community hierarchy</h3>
                  <p className="community-hierarchy-hint">
                    Propose hands on GitHub; the community votes with reactions. The hierarchy evolves as science and play experience grow.
                  </p>
                  <p className="community-hierarchy-life-first" data-testid="life-first-reminder">
                    Life-first: do not argue destruction makes a hand better — argue life, energy, or scientific value.
                  </p>
                  <p className="rules-github-hint">
                    Want to change the hierarchy? Propose on GitHub — community votes with reactions.
                  </p>
                  {!isShowdown && !houseRulesOpen && (
                    <p className="community-hierarchy-wait" data-testid="community-hierarchy-wait">
                      Tap House rules to open this panel and submit between hands.
                    </p>
                  )}
                  <input
                    type="text"
                    placeholder="Your name (optional)"
                    value={hierarchyName}
                    onChange={(e) => setHierarchyName(e.target.value)}
                    className="player-hierarchy-input"
                    data-testid="hierarchy-name-input"
                  />
                  <div className="community-hierarchy-actions">
                    {hierarchyHandUrl ? (
                      <a
                        href={hierarchyHandUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-hierarchy"
                        data-testid="submit-hand-hierarchy"
                      >
                        Submit hand to Hierarchy
                      </a>
                    ) : (
                      <span className="community-hierarchy-err" data-testid="hierarchy-name-error">{hierarchyNameValid.error}</span>
                    )}
                    {hierarchyNewRuleUrl && (
                      <a
                        href={hierarchyNewRuleUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary btn-hierarchy-secondary"
                        data-testid="propose-new-rule"
                      >
                        Propose new rule
                      </a>
                    )}
                    <a
                      href={githubIssuesUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary btn-hierarchy-secondary"
                      data-testid="view-github-proposals"
                    >
                      View proposals on GitHub
                    </a>
                  </div>
                </div>
              ) : (
                <p className="community-hierarchy-unavailable">
                  Community proposals unlock in Game 4 after the tutorial.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="poker-table-wrap">
        <div className="poker-table">
          <div className="table-center">
            <div className="total-pot">
              Total Pot {pot}
              {pots.length > 1 && (
                <span className="side-pots" data-testid="side-pots">
                  {' '}
                  ({pots.map((p, i) => `${i === 0 ? 'Main' : 'Side'} ${p.amount}`).join(' · ')})
                </span>
              )}
            </div>
            <div className="community-cards">
              {communityCards.map((card, i) => (
                <Card key={card.id || i} element={card} moleculeCombo={yourCombo} />
              ))}
            </div>
          </div>
          <div className="table-seats">
            {players?.map((player, i) => {
              const displayName = i === humanIndex ? 'You' : (playerNames?.[i] ?? (isMultiplayer ? `Player ${i}` : `Bot ${i}`));
              return renderSeat(player, i, displayName, i === dealerIndex);
            })}
          </div>
        </div>
      </div>
      {isShowdown && winnerName && winnerReasonLabel && (
        <div className="showdown-winner-block" data-testid="showdown-winner-block">
          <div className={`winner-announce ${gameNumber === 3 && winnerReason === 'chonp' ? 'winner-announce-chonp' : ''}`} data-testid="winner-announce">
            {gameNumber === 3 && winnerReason === 'chonp' ? (
              <>CHONP wins! (atoms of DNA — proof of life) Winner: {winnerName} — flashing</>
            ) : isSplitPot ? (
              <>Winners: {winnerName} (split pot — {winnerReasonLabel})!</>
            ) : (
              <>Winner: {winnerName} ({winnerReasonLabel})!</>
            )}
          </div>
          {moleculeTest && isShowdown && (
            <p
              className={moleculeTestPassed ? 'molecule-test-pass' : 'molecule-test-fail'}
              data-testid="molecule-test-result"
            >
              {moleculeTestPassed
                ? `PASS — ${catalogTarget?.label} cards present (${catalogTarget?.cardHint})`
                : `FAIL — expected ${catalogTarget?.label} (${catalogTarget?.cardHint})`}
            </p>
          )}
          <p className="showdown-next-hint">
            {moleculeTestComplete
              ? 'Click below to return home.'
              : isGameOver
                ? 'Game over — click New Game to play again.'
                : moleculeTest
                  ? `Click below for molecule ${Math.min((moleculeTestIndex ?? 0) + 1, MOLECULE_CATALOG_COUNT)} of ${MOLECULE_CATALOG_COUNT}.`
                  : 'Click the button below to play the next hand.'}
          </p>
          {isGameOver && gameNumber >= 4 && (
            <p className="session-over-msg" data-testid="session-over-msg">
              {you?.chips === 0
                ? 'You are out of atomcoins.'
                : `${winnerName || 'You'} win${winnerName && winnerName !== 'You' ? 's' : ''} the game!`}
            </p>
          )}
          {showMoleculeScoreboard && (
            <div className="molecule-scoreboard" data-testid="molecule-scoreboard">
              <p className="molecule-scoreboard-hint">
                You won with {moleculeLabel(winnerReason)}! Add your name to the scoreboard.
              </p>
              {scoreboardSubmitted ? (
                <p className="molecule-scoreboard-done" data-testid="molecule-scoreboard-submitted">Submitted!</p>
              ) : (
                <div className="molecule-scoreboard-form">
                  <input
                    type="text"
                    placeholder="Your name for scoreboard"
                    value={scoreboardName}
                    onChange={(e) => setScoreboardName(e.target.value)}
                    className="player-hierarchy-input"
                    data-testid="molecule-scoreboard-name"
                    disabled={scoreboardSubmitting}
                  />
                  <button
                    type="button"
                    className="btn-primary btn-scoreboard-submit"
                    onClick={handleScoreboardSubmit}
                    disabled={scoreboardSubmitting}
                    data-testid="molecule-scoreboard-submit"
                  >
                    {scoreboardSubmitting ? 'Submitting…' : 'Submit'}
                  </button>
                </div>
              )}
              {scoreboardError && (
                <p className="molecule-scoreboard-err" data-testid="molecule-scoreboard-error">{scoreboardError}</p>
              )}
              <a href="/scoreboard.html" className="btn-secondary btn-view-scoreboard" data-testid="view-scoreboard-link">
                View scoreboard
              </a>
            </div>
          )}
          <div className="showdown-cta">
            {onNextHand ? (
              <button type="button" className="btn-primary btn-showdown-next" onClick={onNextHand} data-testid="showdown-next-btn">
                {moleculeTestComplete
                  ? 'Back to home'
                  : moleculeTest
                    ? ((moleculeTestIndex ?? 0) >= MOLECULE_CATALOG_COUNT ? 'Finish test' : `Next molecule (${(moleculeTestIndex ?? 0) + 1}/${MOLECULE_CATALOG_COUNT})`)
                    : (isGameOver ? 'New Game' : 'Next Hand')}
              </button>
            ) : (
              <span className="waiting-msg" data-testid="showdown-next-btn">Waiting for host to deal next hand…</span>
            )}
          </div>
        </div>
      )}
      {tutorial && isShowdown && gameNumber === 1 && winnerName && (
        <div className="tutorial-instruction" data-testid="tutorial-instruction-1">
          <strong>Tutorial Game 1 complete!</strong> NaCl (sodium chloride) — Na + Cl — is a top molecule hand. The winner took the pot. Click <strong>Next Hand</strong> for Game 2 — H₂O (H + O).
        </div>
      )}
      {tutorial && isShowdown && gameNumber === 2 && winnerName && (
        <div className="tutorial-instruction" data-testid="tutorial-instruction-2">
          <strong>Tutorial Game 2 complete!</strong> H₂O (water) — H + O — is the <strong>second-best</strong> molecule hand. Click <strong>Next Hand</strong> for Game 3 — CHONP (C + H + O + N + P, the best hand).
        </div>
      )}
      {tutorial && isShowdown && gameNumber === 3 && winnerName && (
        <div className="tutorial-instruction" data-testid="tutorial-instruction-3">
          <strong>Tutorial Game 3 complete!</strong> CHONP — C + H + O + N + P — are the atoms of DNA. Best to fourth-best: {moleculeRankingLabel()}. Click <strong>Next Hand</strong> to start the real game with 1000 chips each.
        </div>
      )}
      <div className="your-hand-bar">
        <span className="your-hand-label">Your Hand:</span>
        <div className="your-hand-cards">
          {you?.holeCards?.map((card, i) => (
            <Card key={card.id || i} element={card} moleculeCombo={yourCombo} />
          ))}
        </div>
        {lastAction && (
          <span className="last-action-msg" data-testid="last-action-msg">
            {lastAction.playerIndex === humanIndex ? 'You' : (playerNames?.[lastAction.playerIndex] ?? (isMultiplayer ? `Player ${lastAction.playerIndex}` : `Bot ${lastAction.playerIndex}`))}
            {lastAction.action === 'all-in' ? ' (all-in — no action)' : ` ${lastAction.action}${lastAction.amount != null ? ` ${lastAction.amount}` : ''}`}
          </span>
        )}
        {isYourTurn && youHaveWinningMolecule && (
          <div className="sure-to-win-msg" data-testid="sure-to-win-msg">
            You have {winningMoleculeLabel} — you&apos;re sure to win this hand! Consider going all in.
          </div>
        )}
        {lastAction?.timedOut && (
          <span className="timeout-toast" data-testid="timeout-toast">
            {(lastAction.playerIndex === humanIndex ? 'You' : (playerNames?.[lastAction.playerIndex] ?? (isMultiplayer ? `Player ${lastAction.playerIndex}` : `Bot ${lastAction.playerIndex}`)))}
            {' '}
            {lastAction.action === 'check' ? 'checked' : 'folded'}
            {' '}
            (time)
          </span>
        )}
        {currentTurnPlayer && (
          <div className="current-turn-tracker" data-testid="current-turn-tracker">
            <strong>Current turn:</strong> {currentTurnPlayer}
            {currentTurnIsAllIn
              ? ' (all-in — no action)'
              : isYourTurn
                ? ` — check, bet, call or fold (${turnSecondsRemaining ?? TURN_TIMEOUT_SECONDS}s)`
                : turnSecondsRemaining != null
                  ? ` — ${turnSecondsRemaining}s or auto-${getTimeoutAction(gameState, currentPlayerIndex)}`
                  : ' — checking…'}
          </div>
        )}
        <div className="action-bar">
          {isShowdown && onNextHand && (
            <button type="button" className="btn-primary" onClick={onNextHand}>
              {isGameOver ? 'New Game' : 'Next Hand'}
            </button>
          )}
          {isYourTurn && (
            <>
              {turnSecondsRemaining != null && (
                <span className="turn-countdown" data-testid="turn-countdown">
                  {Math.floor(turnSecondsRemaining / 60)}:{(turnSecondsRemaining % 60).toString().padStart(2, '0')}
                  {' '}
                  or {getTimeoutAction(gameState, humanIndex)}
                </span>
              )}
              <span className="to-call">To call: {toCall}</span>
              {toCall <= 0 && (
                <button type="button" className="btn-check" onClick={() => onPlayerAction('check')}>Check</button>
              )}
              {toCall > 0 && (
                <button type="button" className="btn-check" onClick={() => onPlayerAction('call')}>Call {Math.min(toCall, you.chips)}</button>
              )}
              {toCall <= 0 && (
                <button type="button" className="btn-check" onClick={() => onPlayerAction('bet', minOpenBet)}>Bet {minOpenBet}</button>
              )}
              {toCall > 0 && (
                <button type="button" className="btn-check" onClick={() => onPlayerAction('raise', minRaiseTo)}>Raise to {minRaiseTo}</button>
              )}
              {you.chips > 0 && (
                <button type="button" className="btn-allin" onClick={() => onPlayerAction(toCall > 0 ? 'raise' : 'bet', (roundBets[humanIndex] || 0) + you.chips)}>
                  All in ({you.chips})
                </button>
              )}
              <button type="button" className="btn-fold" onClick={() => onPlayerAction('fold')}>Fold</button>
            </>
          )}
          {!isYourTurn && !isShowdown && isBotTurn && !isMultiplayer && (
            <span className="waiting-msg" data-testid="bot-thinking-msg">
              Bot thinking…
              {turnSecondsRemaining != null ? ` (${turnSecondsRemaining}s)` : ''}
            </span>
          )}
          {!isYourTurn && !isShowdown && isMultiplayer && currentTurnPlayer && !isBotTurn && !isBotTurnAllIn && (
            <span className="waiting-msg" data-testid="waiting-for-player-msg">
              Waiting for {currentTurnPlayer}
              {turnSecondsRemaining != null ? `… (${turnSecondsRemaining}s or auto-${getTimeoutAction(gameState, currentPlayerIndex)})` : '…'}
            </span>
          )}
          {!isShowdown && youAllIn && (
            <span className="allin-msg" data-testid="allin-msg">All-in — you stay in until showdown. No action needed.</span>
          )}
        </div>
      </div>
    </div>
  );
}
