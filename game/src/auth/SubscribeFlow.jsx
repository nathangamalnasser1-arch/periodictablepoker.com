import React, { useState, useEffect } from 'react';
import {
  signInWithGoogle,
  registerWithEmail,
  signInWithEmail,
  resendVerificationEmail,
  refreshEmailVerification,
  formatAuthError,
} from './authService.js';
import { hasVerifiedIdentity, subscriberProgressStep } from './authHelpers.js';
import { useAuth } from './useAuth.jsx';

const STEPS = {
  IDENTITY: 'identity',
  EMAIL_VERIFY: 'email-verify',
  COMPLETE: 'complete',
};

function goCompleteOrVerify(authUser, profile, setStep) {
  if (profile?.isSubscriber || hasVerifiedIdentity(authUser)) {
    setStep(STEPS.COMPLETE);
  } else {
    setStep(STEPS.EMAIL_VERIFY);
  }
}

export function SubscribeFlow({ open, onClose }) {
  const { user, profile, setProfile, setSubscriberCount } = useAuth();
  const [step, setStep] = useState(STEPS.IDENTITY);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('register');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    const progress = subscriberProgressStep(user, profile);
    if (progress === 'complete') setStep(STEPS.COMPLETE);
    else if (progress === 'email-verify') setStep(STEPS.EMAIL_VERIFY);
    else setStep(STEPS.IDENTITY);
  }, [open, user, profile]);

  const handleGoogle = async () => {
    setBusy(true);
    setError(null);
    try {
      const { user: authUser, profile: p } = await signInWithGoogle();
      setProfile(p);
      if (p?.subscriberNumber) {
        setSubscriberCount((c) => Math.max(c, p.subscriberNumber));
      }
      goCompleteOrVerify(authUser, p, setStep);
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = mode === 'register'
        ? await registerWithEmail(email.trim(), password)
        : await signInWithEmail(email.trim(), password);
      setProfile(result.profile);
      if (result.profile?.subscriberNumber) {
        setSubscriberCount((c) => Math.max(c, result.profile.subscriberNumber));
      }
      goCompleteOrVerify(result.user, result.profile, setStep);
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleCheckEmail = async () => {
    setBusy(true);
    setError(null);
    try {
      const { user: authUser, profile: p } = await refreshEmailVerification(user);
      setProfile(p);
      if (p?.subscriberNumber) {
        setSubscriberCount((c) => Math.max(c, p.subscriberNumber));
      }
      if (hasVerifiedIdentity(authUser) || p?.isSubscriber) {
        setStep(STEPS.COMPLETE);
      } else {
        setError('Email not verified yet. Check your inbox.');
      }
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleResendEmail = async () => {
    setBusy(true);
    setError(null);
    try {
      await resendVerificationEmail(user);
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div className="subscribe-overlay" data-testid="subscribe-flow" role="dialog" aria-modal="true">
      <div className="subscribe-modal">
        <button type="button" className="subscribe-close" onClick={onClose} aria-label="Close">×</button>
        <h2 className="subscribe-title">Subscribe &amp; earn prize coins</h2>
        <p className="subscribe-sub">
          Sign in with Google or verified email, then win coins in every game.
        </p>

        {step === STEPS.IDENTITY && (
          <div className="subscribe-step" data-testid="subscribe-step-identity">
            <button type="button" className="btn-primary subscribe-google" onClick={handleGoogle} disabled={busy}>
              Continue with Google
            </button>
            <div className="subscribe-divider">or email</div>
            <form onSubmit={handleEmailSubmit}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="player-hierarchy-input"
                data-testid="subscribe-email"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="player-hierarchy-input"
                data-testid="subscribe-password"
              />
              <button type="submit" className="btn-secondary" disabled={busy}>
                {mode === 'register' ? 'Create account' : 'Sign in with email'}
              </button>
            </form>
            <button
              type="button"
              className="subscribe-toggle-mode"
              onClick={() => setMode(mode === 'register' ? 'signin' : 'register')}
            >
              {mode === 'register' ? 'Already have an account? Sign in' : 'Need an account? Register'}
            </button>
          </div>
        )}

        {step === STEPS.EMAIL_VERIFY && (
          <div className="subscribe-step" data-testid="subscribe-step-email-verify">
            <p>We sent a verification link to <strong>{user?.email}</strong>. Open it, then click below.</p>
            <button type="button" className="btn-primary" onClick={handleCheckEmail} disabled={busy}>
              I verified my email
            </button>
            <button type="button" className="btn-secondary" onClick={handleResendEmail} disabled={busy}>
              Resend email
            </button>
          </div>
        )}

        {step === STEPS.COMPLETE && (
          <div className="subscribe-step subscribe-complete" data-testid="subscribe-step-complete">
            <p>You&apos;re subscribed! Prize coins will be added when you win hands and sessions.</p>
            <button type="button" className="btn-primary" onClick={onClose}>
              Start playing
            </button>
          </div>
        )}

        {error && <p className="subscribe-error" data-testid="subscribe-error">{error}</p>}
        <p className="subscribe-guest-note">
          <button type="button" className="subscribe-dismiss" onClick={onClose}>
            Continue as guest
          </button>
        </p>
      </div>
    </div>
  );
}

export { STEPS as SUBSCRIBE_STEPS };
