import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/useAuth.jsx';
import { SubscribeFlow } from '../auth/SubscribeFlow.jsx';
import { signOutUser } from '../auth/authService.js';
import { updateUserDisplayName } from '../auth/userProfile.js';
import { SUBSCRIBER_GOAL } from '../auth/authHelpers.js';
import {
  profileStatusLabel,
  formatProfileProviders,
  formatProfileDate,
  canEditProfile,
  validateDisplayName,
} from './profileDisplay.js';
import { moleculeLabel } from '../scoreboard/scoreboard.js';
import { formatBestHandLabel } from '../rankings/rankings.js';

function ProfileField({ label, value, testId }) {
  return (
    <div className="profile-field" data-testid={testId}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export function ProfilePage() {
  const auth = useAuth();
  const { user, profile, loading, isGuest, isSubscriber, coinBalance, subscriberGoal } = auth;
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    setNameDraft(profile?.displayName ?? '');
  }, [profile?.displayName]);

  const handleSaveName = async (e) => {
    e.preventDefault();
    const validated = validateDisplayName(nameDraft);
    if (!validated.ok) {
      setSaveError(validated.error);
      return;
    }
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      const updated = await updateUserDisplayName(user.uid, validated.value);
      auth.setProfile(updated);
      setSaved(true);
    } catch (err) {
      setSaveError(err?.message ?? String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOutUser();
      window.location.href = '/';
    } catch {
      setSigningOut(false);
    }
  };

  return (
    <div className="app profile-page" data-testid="profile-page">
      <header>
        <h1>Periodic Table Poker</h1>
        <p className="tagline">Your profile</p>
      </header>
      <main className="profile-main">
        <h2 className="profile-title">Profile</h2>

        {loading && (
          <p className="profile-loading" data-testid="profile-loading">Loading…</p>
        )}

        {!loading && !user && (
          <div className="profile-card" data-testid="profile-signed-out">
            <p>You are not signed in. Subscribe with Google or email to earn prize coins.</p>
            <button type="button" className="btn-primary" onClick={() => setSubscribeOpen(true)}>
              Subscribe &amp; earn coins
            </button>
          </div>
        )}

        {!loading && user && isGuest && (
          <div className="profile-card" data-testid="profile-guest">
            <p>You are playing as a <strong>guest</strong>. Subscribe to save your progress and earn prize coins.</p>
            <button type="button" className="btn-primary" onClick={() => setSubscribeOpen(true)}>
              Subscribe &amp; earn coins
            </button>
          </div>
        )}

        {!loading && user && !isGuest && (
          <div className="profile-card" data-testid="profile-details">
            <dl className="profile-fields">
              <ProfileField
                label="Status"
                value={profileStatusLabel(user, profile)}
                testId="profile-status"
              />
              <ProfileField
                label="Display name"
                value={profile?.displayName ?? '—'}
                testId="profile-display-name"
              />
              <ProfileField
                label="Email"
                value={profile?.email ?? user.email ?? '—'}
                testId="profile-email"
              />
              <ProfileField
                label="Sign-in method"
                value={formatProfileProviders(profile?.authProviders ?? user.providerData?.map((p) => p.providerId))}
                testId="profile-providers"
              />
              {isSubscriber && (
                <>
                  <ProfileField
                    label="Subscriber #"
                    value={profile?.subscriberNumber != null ? `#${profile.subscriberNumber}` : '—'}
                    testId="profile-subscriber-number"
                  />
                  <ProfileField
                    label="Prize coins"
                    value={String(coinBalance)}
                    testId="profile-coin-balance"
                  />
                  <ProfileField
                    label="Games played"
                    value={String(profile?.gamesPlayed ?? 0)}
                    testId="profile-games-played"
                  />
                  <ProfileField
                    label="Games won"
                    value={String(profile?.gamesWon ?? 0)}
                    testId="profile-games-won"
                  />
                  <ProfileField
                    label="Hands played"
                    value={String(profile?.handsPlayed ?? 0)}
                    testId="profile-hands-played"
                  />
                  <ProfileField
                    label="Hands won"
                    value={String(profile?.handsWon ?? 0)}
                    testId="profile-hands-won"
                  />
                  <ProfileField
                    label="Best hand"
                    value={formatBestHandLabel(profile?.bestHandWeight, profile?.bestHandReason, moleculeLabel)}
                    testId="profile-best-hand"
                  />
                  <ProfileField
                    label="Highest single win"
                    value={profile?.highestPotWin ? `${profile.highestPotWin} chips` : '—'}
                    testId="profile-highest-win"
                  />
                  <ProfileField
                    label="Subscribed"
                    value={formatProfileDate(profile?.subscribedAt)}
                    testId="profile-subscribed-at"
                  />
                </>
              )}
              {!isSubscriber && (
                <ProfileField
                  label="Prize coins"
                  value="Subscribe to start earning"
                  testId="profile-coins-locked"
                />
              )}
            </dl>

            {!isSubscriber && (
              <p className="profile-hint">
                Verify your email or use Google to become a subscriber ({subscriberGoal.toLocaleString()} goal for token launch).
              </p>
            )}

            {canEditProfile(user, profile) && (
              <form className="profile-name-form" onSubmit={handleSaveName} data-testid="profile-name-form">
                <label htmlFor="profile-name-input">Edit display name</label>
                <input
                  id="profile-name-input"
                  type="text"
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  maxLength={32}
                  className="player-hierarchy-input"
                  data-testid="profile-name-input"
                  disabled={saving}
                />
                <button type="submit" className="btn-secondary" disabled={saving}>
                  {saving ? 'Saving…' : 'Save name'}
                </button>
                {saved && <p className="profile-save-ok" data-testid="profile-save-ok">Saved!</p>}
                {saveError && <p className="profile-save-err" data-testid="profile-save-error">{saveError}</p>}
              </form>
            )}

            <div className="profile-actions">
              {!isSubscriber && (
                <button type="button" className="btn-primary" onClick={() => setSubscribeOpen(true)}>
                  Complete subscription
                </button>
              )}
              <button
                type="button"
                className="btn-secondary"
                onClick={handleSignOut}
                disabled={signingOut}
                data-testid="profile-sign-out"
              >
                {signingOut ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          </div>
        )}

        {!loading && (
        <nav className="profile-links" aria-label="Related pages">
          {isSubscriber && (
            <>
              <a href="/rankings.html" className="btn-secondary">Rankings</a>
              <a href="/ledger.html" className="btn-secondary">Public ledger</a>
              <a href="/coins.html" className="btn-secondary">Coin scoreboard</a>
            </>
          )}
          <a href="/concept.html" className="btn-secondary">How prize coins work</a>
          <a href="/" className="btn-secondary">Back to game</a>
        </nav>
        )}
      </main>

      <SubscribeFlow open={subscribeOpen} onClose={() => setSubscribeOpen(false)} />
    </div>
  );
}
