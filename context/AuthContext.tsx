'use client';

import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '@/src/lib/firebase';
import { AppUser, toAppUser } from '@/types/user';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';

type AuthContextType = {
  user: FirebaseUser | null;
  appUser: AppUser | null;
  loading: boolean;

  // ✅ NEW
  quizCompleted: boolean;
  quizLoading: boolean;

  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

async function saveUserToFirestore(appUser: AppUser) {
  const userRef = doc(db, 'users', appUser.uid);

  await setDoc(
    userRef,
    {
      profile: {
        email: appUser.email,
        displayName: appUser.displayName,
        photoURL: appUser.photoURL,
        emailVerified: appUser.emailVerified,
      },
      lastLoginAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ NEW
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizLoading, setQuizLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setAppUser(null);
        setQuizCompleted(false);
        setQuizLoading(false);
        setLoading(false);
        return;
      }

      const appUser = toAppUser(firebaseUser);
      setUser(firebaseUser);
      setAppUser(appUser);

      saveUserToFirestore(appUser).catch(console.error);

      // 🔥 Fetch quiz completion ONCE
      try {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        const data = userDoc.data();
        setQuizCompleted(!!data?.chronotype);
      } catch (err) {
        console.error('Quiz check failed:', err);
        setQuizCompleted(false);
      } finally {
        setQuizLoading(false);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        appUser,
        loading,
        quizCompleted,
        quizLoading,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
