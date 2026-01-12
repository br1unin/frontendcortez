import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { apiFetch } from "../api/client";

type AuthContextValue = {
  token: string | null;
  isAuthed: boolean;
  isAdmin: boolean;
  user: UserProfile | null;
  profileLoading: boolean;
  refreshProfile: () => Promise<void>;
  login: (token: string) => void;
  logout: () => void;
};

type TokenInfo = {
  isAdmin: boolean;
  exp?: number;
};

type UserProfile = {
  email: string;
  name: string;
  lastname: string;
  country: string;
  province: string;
  locality: string;
  street: string;
  postal_code: string;
  extra_info: string;
};

const TOKEN_KEY = "auth_token";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function parseToken(token: string | null): TokenInfo {
  if (!token) return { isAdmin: false };
  try {
    const payload = token.split(".")[1];
    let normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    while (normalized.length % 4) normalized += "=";
    const json = atob(normalized);
    const data = JSON.parse(json);
    const exp = typeof data.exp === "number" ? data.exp : undefined;
    return { isAdmin: Boolean(data.is_admin), exp };
  } catch {
    return { isAdmin: false };
  }
}

function isExpired(exp: number | undefined) {
  return typeof exp === "number" && exp * 1000 <= Date.now();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    const info = parseToken(stored);
    if (stored && isExpired(info.exp)) {
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
    return stored;
  });
  const [user, setUser] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const refreshProfile = useCallback(async () => {
    if (!token) {
      setUser(null);
      setProfileLoading(false);
      return;
    }
    setProfileLoading(true);
    try {
      const me = await apiFetch<UserProfile>("/auth/me");
      setUser(me || null);
    } catch {
      setUser(null);
    } finally {
      setProfileLoading(false);
    }
  }, [token]);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== TOKEN_KEY) return;
      const nextToken = e.newValue;
      const info = parseToken(nextToken);
      if (nextToken && isExpired(info.exp)) {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        return;
      }
      setToken(nextToken);
    }

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!token) return;
    const info = parseToken(token);
    if (!info.exp) return;

    const ms = info.exp * 1000 - Date.now();
    if (ms <= 0) {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      return;
    }

    const id = window.setTimeout(() => {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
    }, ms);

    return () => window.clearTimeout(id);
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      if (!token) {
        setUser(null);
        setProfileLoading(false);
        return;
      }
      setProfileLoading(true);
      try {
        const me = await apiFetch<UserProfile>("/auth/me");
        if (!cancelled) setUser(me || null);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    }
    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const value = useMemo<AuthContextValue>(() => {
    const info = parseToken(token);
    return {
      token,
      isAuthed: Boolean(token),
      isAdmin: info.isAdmin,
      user,
      profileLoading,
      refreshProfile,
      login: (nextToken) => {
        localStorage.setItem(TOKEN_KEY, nextToken);
        setToken(nextToken);
      },
      logout: () => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
      },
    };
  }, [token, user, profileLoading, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
