import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { getUnclaimedVendorByEmail, getVendorByUserId, updateVendor } from '../db/supabase/vendors';
import { createUserProfile, getUserByAuthId } from '../db/supabase/users';
import { supabase } from '../db/supabaseClient';
import type { User, Vendor } from '../db/types';

export interface AuthActionResult {
  error: string | null;
  /** True when Supabase requires email confirmation before a session exists. */
  needsConfirmation?: boolean;
  user: User | null;
  vendor: Vendor | null;
}

interface AuthContextValue {
  loading: boolean;
  session: Session | null;
  appUser: User | null;
  vendor: Vendor | null;
  isStaff: boolean;
  signUp: (input: { name: string; email: string; password: string }) => Promise<AuthActionResult>;
  signIn: (email: string, password: string) => Promise<AuthActionResult>;
  signOut: () => Promise<void>;
  /** Adopts a just-saved vendor profile into context without a refetch. */
  applyVendor: (vendor: Vendor) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Loads (or lazily creates) the `users` profile row for a signed-in
 * Supabase Auth account, then resolves their linked vendor - auto-claiming
 * a pre-existing vendor profile with a matching, not-yet-linked email if
 * one exists, so a vendor who self-served before real auth existed doesn't
 * end up with a second, empty profile.
 */
async function loadAppUser(
  authUserId: string,
  fallbackEmail: string,
  fallbackName?: string
): Promise<{ appUser: User; vendor: Vendor | null }> {
  let appUser = await getUserByAuthId(authUserId);
  if (!appUser) {
    appUser = await createUserProfile({
      authUserId,
      name: fallbackName || fallbackEmail,
      email: fallbackEmail,
      role: 'member',
    });
  }

  let vendor = await getVendorByUserId(appUser.id);
  if (!vendor && appUser.email) {
    const unclaimed = await getUnclaimedVendorByEmail(appUser.email);
    if (unclaimed) {
      vendor = await updateVendor(unclaimed.id, { userId: appUser.id });
    }
  }

  return { appUser, vendor };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [appUser, setAppUser] = useState<User | null>(null);
  const [vendor, setVendor] = useState<Vendor | null>(null);

  useEffect(() => {
    let active = true;

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (!active) return;
        setSession(data.session);
        if (data.session) {
          const result = await loadAppUser(
            data.session.user.id,
            data.session.user.email ?? '',
            data.session.user.user_metadata?.name
          );
          if (!active) return;
          setAppUser(result.appUser);
          setVendor(result.vendor);
        }
      })
      .catch((err) => {
        // A stale/invalid session shouldn't be able to wedge the whole
        // app on its loading screen forever - log it and fall back to
        // signed-out rather than hanging indefinitely.
        console.error('Failed to restore session:', err);
        if (active) setSession(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (!newSession) {
        setAppUser(null);
        setVendor(null);
      }
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback<AuthContextValue['signUp']>(async ({ name, email, password }) => {
    // The name goes into auth user_metadata (not just passed to
    // createUserProfile below) because when email confirmation is
    // required there's no session yet - the `users` row can't be
    // inserted until the account is confirmed and actually signed in
    // (an unauthenticated insert has no auth.uid() for RLS to check
    // against). It's picked back up from metadata in loadAppUser at
    // that first sign-in.
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) {
      return { error: error.message, user: null, vendor: null };
    }
    if (!data.user) {
      return { error: 'Something went wrong creating your account.', user: null, vendor: null };
    }

    if (!data.session) {
      return { error: null, needsConfirmation: true, user: null, vendor: null };
    }

    try {
      const newUser = await createUserProfile({ authUserId: data.user.id, name, email, role: 'member' });
      setAppUser(newUser);
      setVendor(null);
      return { error: null, user: newUser, vendor: null };
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : 'Something went wrong creating your profile.',
        user: null,
        vendor: null,
      };
    }
  }, []);

  const signIn = useCallback<AuthContextValue['signIn']>(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) {
      return { error: error?.message ?? 'Sign in failed.', user: null, vendor: null };
    }
    try {
      const result = await loadAppUser(
        data.session.user.id,
        data.session.user.email ?? email,
        data.session.user.user_metadata?.name
      );
      setAppUser(result.appUser);
      setVendor(result.vendor);
      return { error: null, user: result.appUser, vendor: result.vendor };
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : 'Signed in, but something went wrong loading your profile.',
        user: null,
        vendor: null,
      };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      // Signing out after account deletion hits a session whose user no
      // longer exists server-side - that's expected, not a real failure,
      // and local state should clear either way.
      console.error('Sign out request failed:', err);
    } finally {
      setSession(null);
      setAppUser(null);
      setVendor(null);
    }
  }, []);

  const applyVendor = useCallback((next: Vendor) => {
    setVendor(next);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      loading,
      session,
      appUser,
      vendor,
      isStaff: appUser?.role === 'staff',
      signUp,
      signIn,
      signOut,
      applyVendor,
    }),
    [loading, session, appUser, vendor, signUp, signIn, signOut, applyVendor]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
