import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { getMe, login, register } from './api';
import type { User } from './types';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (payload: { email: string; password: string }) => Promise<void>;
  signUp: (payload: { name: string; email: string; password: string }) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function saveSession(token: string, user: User) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    if (!stored) return null;
    try {
      return JSON.parse(stored) as User;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState<boolean>(() => !!localStorage.getItem('token'));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }

    getMe()
      .then(({ user: me }) => {
        setUser(me);
        localStorage.setItem('user', JSON.stringify(me));
      })
      .catch(() => {
        clearSession();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      error,
      async signIn(payload) {
        setError(null);
        const response = await login(payload).catch((err: Error) => {
          setError(err.message);
          throw err;
        });
        saveSession(response.token, response.user);
        setUser(response.user);
      },
      async signUp(payload) {
        setError(null);
        const response = await register(payload).catch((err: Error) => {
          setError(err.message);
          throw err;
        });
        saveSession(response.token, response.user);
        setUser(response.user);
      },
      signOut() {
        clearSession();
        setUser(null);
      },
    }),
    [error, loading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
