import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { subscribeToAuth, signInAsGuest } from './authService.js';
import { upsertUserFromAuth, finalizeSubscriber, fetchSubscriberCount } from './userProfile.js';
import { isGuest, isSubscriber, SUBSCRIBER_GOAL } from './authHelpers.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async (authUser) => {
    if (!authUser) {
      setProfile(null);
      return null;
    }
    let p = await upsertUserFromAuth(authUser);
    p = await finalizeSubscriber(authUser, p);
    setProfile(p);
    return p;
  }, []);

  const reloadAuth = useCallback(async () => {
    const authUser = user;
    if (!authUser) return;
    await authUser.reload();
    await refreshProfile(authUser);
  }, [user, refreshProfile]);

  useEffect(() => {
    let cancelled = false;
    const timeoutId = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 8000);

    const unsub = subscribeToAuth(async (authUser) => {
      setUser(authUser);
      try {
        if (authUser) {
          await refreshProfile(authUser);
        } else {
          setProfile(null);
        }
      } catch {
        setProfile(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      unsub();
    };
  }, [refreshProfile]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const count = await fetchSubscriberCount();
        if (!cancelled) setSubscriberCount(count);
      } catch {
        if (!cancelled) setSubscriberCount(0);
      }
    })();
    return () => { cancelled = true; };
  }, [profile?.isSubscriber]);

  const ensureGuest = useCallback(async () => {
    if (user) return user;
    const guest = await signInAsGuest();
    setUser(guest);
    return guest;
  }, [user]);

  const value = useMemo(() => ({
    user,
    profile,
    loading,
    subscriberCount,
    subscriberGoal: SUBSCRIBER_GOAL,
    isGuest: isGuest(user),
    isSubscriber: isSubscriber(profile),
    coinBalance: profile?.coinBalance ?? 0,
    displayName: profile?.displayName ?? (user?.isAnonymous ? 'Guest' : 'Player'),
    refreshProfile: () => refreshProfile(user),
    reloadAuth,
    ensureGuest,
    setProfile,
    setSubscriberCount,
  }), [user, profile, loading, subscriberCount, refreshProfile, reloadAuth, ensureGuest]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
