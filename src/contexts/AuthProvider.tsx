import React, { useEffect, useRef, useState } from 'react';
import { AuthContext } from './AuthContext';
import type { AuthContextType } from './AuthContext';
import type { User } from '../types';
import { auth, logAuthEventSafe } from '../config/firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth';
import { APP_CONFIG } from '../config/app';
import { saveUserLoginMetadata } from '../utils/firebase';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const logoutTimerRef = useRef<number | null>(null);

  const login = async (email: string, password: string, remember: boolean): Promise<void> => {
    try {
      await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const fbUser = cred.user;
      const mapped: User = {
        uid: fbUser.uid,
        email: fbUser.email || email,
        displayName: fbUser.displayName || undefined,
      };
      setCurrentUser(mapped);
      // record login metadata
      await saveUserLoginMetadata(mapped.uid, { email: mapped.email });
      logAuthEventSafe('login_success', { uid: mapped.uid });
      // schedule optional session timeout
      scheduleSessionTimeout();
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || 'auth/unknown-error';
      const msg = mapAuthErrorToMessage(code);
      logAuthEventSafe('login_error', { code });
      throw new Error(msg);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
    } finally {
      setCurrentUser(null);
      clearSessionTimeout();
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        const mapped: User = {
          uid: fbUser.uid,
          email: fbUser.email || '',
          displayName: fbUser.displayName || undefined,
        };
        setCurrentUser(mapped);
        scheduleSessionTimeout();
      } else {
        setCurrentUser(null);
        clearSessionTimeout();
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const scheduleSessionTimeout = () => {
    clearSessionTimeout();
    const minutes = (APP_CONFIG as any)?.auth?.sessionTimeoutMinutes as number | undefined;
    if (minutes && minutes > 0) {
      const ms = minutes * 60 * 1000;
      logoutTimerRef.current = window.setTimeout(() => {
        logout();
      }, ms);
    }
  };

  const clearSessionTimeout = () => {
    if (logoutTimerRef.current) {
      window.clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
  };

  const mapAuthErrorToMessage = (code: string) => {
    switch (code) {
      case 'auth/invalid-email':
        return 'Invalid email address.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Incorrect email or password.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Check your connection and retry.';
      default:
        return 'Login failed. Please try again.';
    }
  };

  const value: AuthContextType = {
    currentUser,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
          <div className="text-center">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full" aria-label="loading" />
            <div className="mt-3 text-sm text-gray-600 dark:text-gray-300">Initializing session…</div>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export default AuthProvider;