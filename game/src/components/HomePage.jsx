import React from 'react';

export function HomePage({
  isLocalTest,
  localTestBanner,
  onPlaySolo,
  onPlayOnline,
  onMoleculeTest,
  onSubscribe = () => {},
  githubRepo,
  subscriberCount = 0,
  subscriberGoal = 10000,
  isSubscriber = false,
  coinBalance = 0,
}) {
  const progressPct = Math.min(100, Math.round((subscriberCount / subscriberGoal) * 100));

  return (
    <div className="app app-home">
      {isLocalTest && localTestBanner}
      <div className="home-hero" data-testid="home-hero">
        <div className="home-hero-scene" aria-hidden="true">
          <img
            className="home-hero-club"
            src="/club-dogs-poker.png"
            alt=""
            decoding="async"
          />
          <div className="home-hero-periodic-frame">
            <img
              src="/periodic-table-wall.png"
              alt="Periodic table of the elements, framed on the club wall"
              decoding="async"
            />
          </div>
        </div>
        <div className="home-hero-vignette" aria-hidden="true" />
        <div className="home-hero-content">
          <header className="home-header">
            <p className="home-eyebrow">The gentleman&apos;s club</p>
            <h1>Periodic Table Poker</h1>
            <p className="tagline home-tagline">
              Texas Hold&apos;em with 118 element cards — win all the chips
            </p>
          </header>

          <div className="home-subscriber-progress" data-testid="subscriber-progress">
            <p className="home-subscriber-label">
              {subscriberCount.toLocaleString()} / {subscriberGoal.toLocaleString()} verified subscribers
            </p>
            <div className="home-subscriber-bar" role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}>
              <div className="home-subscriber-fill" style={{ width: `${progressPct}%` }} />
            </div>
            {isSubscriber && (
              <p className="home-coin-balance" data-testid="home-coin-balance">
                Your prize coins: <strong>{coinBalance}</strong>
              </p>
            )}
          </div>

          <nav className="home-nav" aria-label="Main navigation">
            <div className="home-nav-primary">
              <button type="button" className="btn-primary btn-home-play" onClick={onPlaySolo}>
                Play Solo
              </button>
              <button type="button" className="btn-secondary btn-home-play" onClick={onPlayOnline}>
                Play Online
              </button>
            </div>
            <div className="home-nav-secondary">
              {!isSubscriber && (
                <button
                  type="button"
                  className="btn-primary btn-subscribe-home"
                  onClick={onSubscribe}
                  data-testid="subscribe-home-btn"
                >
                  Subscribe &amp; earn coins
                </button>
              )}
              <a
                href="/rankings.html"
                className="btn-secondary"
                data-testid="rankings-link-home"
              >
                Rankings
              </a>
              <a
                href="/ledger.html"
                className="btn-secondary"
                data-testid="ledger-link-home"
              >
                Public ledger
              </a>
              <a
                href="/profile.html"
                className="btn-secondary"
                data-testid="profile-link-home"
              >
                Profile
              </a>
              <a
                href="/concept.html"
                className="btn-secondary"
                data-testid="concept-link-home"
              >
                How prize coins work
              </a>
              <a
                href="/coins.html"
                className="btn-secondary"
                data-testid="coin-scoreboard-home"
              >
                Coin scoreboard
              </a>
              <a
                href="/scoreboard.html"
                className="btn-secondary btn-view-scoreboard-home"
                data-testid="view-scoreboard-home"
              >
                Molecule scoreboard
              </a>
              <a
                href={`https://github.com/${githubRepo}/issues`}
                className="btn-secondary btn-community-github"
                data-testid="community-rules-github-home"
                target="_blank"
                rel="noopener noreferrer"
              >
                Community rules (GitHub)
              </a>
            </div>
            {isLocalTest && (
              <button
                type="button"
                className="btn-secondary btn-molecule-test btn-home-dev"
                onClick={onMoleculeTest}
                data-testid="start-molecule-test"
              >
                Test all 50 molecules
              </button>
            )}
          </nav>
        </div>
      </div>
    </div>
  );
}
