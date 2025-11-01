import React, { useEffect, useState } from 'react';
import { AuthContext } from './AuthContext';
import type { AuthContextType } from './AuthContext';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { auth } from '../config/firebase';
import type { User } from '../types';


interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code ?? 'auth/unknown-error';
      throw new Error(
        {
          'auth/invalid-email': 'Invalid email format.',
          'auth/user-disabled': 'This account has been disabled.',
          'auth/user-not-found': 'No account found with this email.',
          'auth/wrong-password': 'Incorrect password. Please try again.',
          'auth/too-many-requests': 'Too many attempts. Try again later.',
          'auth/network-request-failed': 'Network error. Check your connection.',
          'auth/unknown-error': 'An error occurred. Please try again.'
        }[code] || 'An error occurred. Please try again.'
      );
    }
  };

  const register = async (email: string, password: string, displayName?: string): Promise<void> => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) {
        try {
          await updateProfile(cred.user, { displayName });
          // Ensure UI reflects the display name immediately
          setCurrentUser({
            uid: cred.user.uid,
            email: cred.user.email || '',
            displayName
          });
        } catch (e) {
          // If profile update fails, still allow registration but surface a friendly error
          console.warn('Failed to set displayName:', e);
        }
      }
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code ?? 'auth/unknown-error';
      throw new Error(
        {
          'auth/email-already-in-use': 'Email is already in use.',
          'auth/invalid-email': 'Invalid email format.',
          'auth/operation-not-allowed': 'Email/password accounts are disabled.',
          'auth/weak-password': 'Password is too weak. Use a stronger one.',
          'auth/network-request-failed': 'Network error. Check your connection.',
          'auth/too-many-requests': 'Too many attempts. Try again later.',
          'auth/unknown-error': 'An error occurred. Please try again.'
        }[code] || 'An error occurred. Please try again.'
      );
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch {
      throw new Error('Erreur lors de la déconnexion');
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code ?? 'auth/unknown-error';
      throw new Error(
        {
          'auth/invalid-email': 'Invalid email format.',
          'auth/user-not-found': 'No account found with this email.',
          'auth/too-many-requests': 'Too many attempts. Try again later.',
          'auth/network-request-failed': 'Network error. Check your connection.',
          'auth/unknown-error': 'An error occurred. Please try again.'
        }[code] || 'An error occurred. Please try again.'
      );
    }
  };



  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const user: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || undefined
        };
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    loading,
    login,
    register,
    logout,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
// Remove unused helper to fix TypeScript errors