import React from 'react';

const SECTIONS = [
  {
    id: 'win',
    title: 'Win it',
    body: 'Verified subscribers play Periodic Table Poker and earn in-game prize coins every time they win a hand or take the whole session.',
  },
  {
    id: 'build',
    title: 'Build it',
    body: 'Coin totals climb the public coin scoreboard as the community grows. When we reach 10,000 verified subscribers, the prize token launches.',
  },
  {
    id: 'prove',
    title: 'Prove it',
    body: 'Champions will eventually receive permanent on-chain trophies — a public record of who won, locked forever.',
  },
  {
    id: 'join',
    title: 'How to join',
    body: 'Sign in with Google or verify your email, then play and start earning prize coins.',
  },
  {
    id: 'guest',
    title: 'Guest play',
    body: 'Anyone can still play solo or online as a guest without subscribing. Guests do not earn prize coins.',
  },
];

export function ConceptPage() {
  return (
    <div className="app concept-page" data-testid="concept-page">
      <header>
        <h1>Periodic Table Poker</h1>
        <p className="tagline">Prize coins — win, build, prove</p>
      </header>
      <main className="concept-main">
        <h2 className="concept-title">How prize coins work</h2>
        <p className="concept-lead">
          A simple competition layer on top of the game — earn coins now, launch the token at 10,000 subscribers.
        </p>

        <div className="concept-sections">
          {SECTIONS.map((section) => (
            <section key={section.id} className="concept-section" data-testid={`concept-${section.id}`}>
              <h3>{section.title}</h3>
              <p>{section.body}</p>
            </section>
          ))}
        </div>

        <nav className="concept-links" aria-label="Related pages">
          <a href="/profile.html" className="btn-secondary">Your profile</a>
          <a href="/rankings.html" className="btn-secondary">Rankings</a>
          <a href="/ledger.html" className="btn-secondary">Public ledger</a>
          <a href="/coins.html" className="btn-primary">Coin scoreboard</a>
          <a href="/" className="btn-secondary">Back to game</a>
        </nav>
      </main>
    </div>
  );
}
