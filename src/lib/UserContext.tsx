"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { User, Role, getPermissions } from "./auth";

interface UserContextType {
  user: User | null;
  loading: boolean;
  permissions: ReturnType<typeof getPermissions>;
  logout: () => void;
  refresh: () => void;
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    // Redirigir a login si no está autenticado (excepto en /login)
    if (!loading && !user && pathname !== "/login") {
      router.push("/login");
    }
  }, [loading, user, pathname, router]);

  const logout = async () => {
    await fetch("/api/auth/logout");
    setUser(null);
    router.push("/login");
  };

  const permissions = getPermissions(user?.role || "VISOR");

  return (
    <UserContext.Provider value={{ user, loading, permissions, logout, refresh: fetchUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
