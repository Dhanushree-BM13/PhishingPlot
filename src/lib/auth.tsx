import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabaseUrl, supabaseAnonKey } from "./supabase";

interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  expires_in?: number;
  user: { id: string; email?: string };
}

interface AuthContextValue {
  session: AuthSession | null;
  ready: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
}

const STORAGE_KEY = "phishpilot-auth-session";
const AuthContext = createContext<AuthContextValue | null>(null);

function readSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) return null;
  try {
    return JSON.parse(saved) as AuthSession;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function saveSession(session: AuthSession | null) {
  if (typeof window === "undefined") return;
  if (session) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  else window.localStorage.removeItem(STORAGE_KEY);
}

async function authRequest(path: string, payload: Record<string, string>, token?: string) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase authentication is not configured.");
  }
  const response = await fetch(`${supabaseUrl}/auth/v1/${path}`, {
    method: "POST",
    headers: {
      apikey: supabaseAnonKey,
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const body = (await response.json()) as
    AuthSession | { msg?: string; message?: string; error_description?: string };
  if (!response.ok) {
    const error = body as { msg?: string; message?: string; error_description?: string };
    throw new Error(
      error.message ??
        error.msg ??
        error.error_description ??
        `Authentication failed (${response.status}).`,
    );
  }
  return body as AuthSession;
}

async function logoutRequest(token: string) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase authentication is not configured.");
  }
  const response = await fetch(`${supabaseUrl}/auth/v1/logout`, {
    method: "POST",
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error(`Sign out failed (${response.status}).`);
  }
}

async function refreshSession(session: AuthSession): Promise<AuthSession> {
  const refreshed = await authRequest("token?grant_type=refresh_token", {
    refresh_token: session.refresh_token,
  });
  refreshed.expires_at = Math.floor(Date.now() / 1000) + (refreshed.expires_in ?? 3600);
  saveSession(refreshed);
  return refreshed;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const existing = readSession();
    if (!existing) {
      setReady(true);
      return () => {
        active = false;
      };
    }

    const initialize = async () => {
      try {
        const current =
          existing.expires_at && existing.expires_at < Date.now() / 1000 + 60
            ? await refreshSession(existing)
            : existing;
        if (active) setSession(current);
      } catch (sessionError) {
        saveSession(null);
        if (active)
          setError(sessionError instanceof Error ? sessionError.message : "Session expired.");
      } finally {
        if (active) setReady(true);
      }
    };
    void initialize();
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      ready,
      error,
      async signIn(email, password) {
        const next = await authRequest("token?grant_type=password", { email, password });
        next.expires_at = Math.floor(Date.now() / 1000) + (next.expires_in ?? 3600);
        saveSession(next);
        setSession(next);
        setError(null);
      },
      async signUp(email, password) {
        const next = await authRequest("signup", { email, password });
        if (!next.access_token) return false;
        next.expires_at = Math.floor(Date.now() / 1000) + (next.expires_in ?? 3600);
        saveSession(next);
        setSession(next);
        setError(null);
        return true;
      },
      async signOut() {
        const current = session;
        if (current) {
          await logoutRequest(current.access_token);
        }
        saveSession(null);
        setSession(null);
      },
    }),
    [error, ready, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider.");
  return context;
}

export async function getAccessToken() {
  const session = readSession();
  if (!session) return null;
  if (session.expires_at && session.expires_at < Date.now() / 1000 + 60) {
    const refreshed = await refreshSession(session);
    return refreshed.access_token;
  }
  return session.access_token;
}
