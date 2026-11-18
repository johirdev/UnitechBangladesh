"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { get, post } from "@/lib/api";
import type { User } from "@/lib/types";

type Ctx = {
  user: User | null;
  loading: boolean;
  refresh: () => Promise<User | null>;
  setUser: (u: User | null) => void;
  logout: () => Promise<void>;
};

const AuthCtx = createContext<Ctx>({ user: null, loading: true, refresh: async () => null, setUser: () => {}, logout: async () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const r = await get<User>("/auth/me");
      setUser(r.data);
      return r.data;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await post("/auth/logout").catch(() => {});
    setUser(null);
    window.location.href = "/";
  }, []);

  return <AuthCtx.Provider value={{ user, loading, refresh, setUser, logout }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);

/** যেকোনো স্টাফের কোনো পারমিশন আছে কিনা */
export const can = (u: User | null, perm?: string) =>
  !!u && (u.role === "superadmin" || u.role === "ceo" || (u.role === "admin" && (!perm || u.permissions.includes(perm))));
