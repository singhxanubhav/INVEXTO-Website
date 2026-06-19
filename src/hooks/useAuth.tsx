"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { apiGet, apiPost } from "@/src/lib/api";
import type { User, ApiResponse } from "@/src/types";

interface RegisterData {
  name: string;
  email: string;
  password: string;
  upiId?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<ApiResponse<User>>;
  register: (data: RegisterData) => Promise<ApiResponse<{email?: string, bypassedOtp?: boolean, pendingToken?: string}>>;
  verifyOtp: (pendingToken: string, otp: string) => Promise<ApiResponse<User>>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    apiGet<User>("/api/auth/me").then((res) => {
      if (res.success && res.data) {
        setUser(res.data);
      }
      setLoading(false);
    });
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await apiPost<User>("/api/auth/login", { email, password });
      if (res.success && res.data) {
        setUser(res.data);
        router.push("/stocks");
      }
      return res;
    },
    [router]
  );

  const register = useCallback(
    async (data: RegisterData) => {
      const res = await apiPost<{email?: string, bypassedOtp?: boolean, pendingToken?: string}>("/api/auth/register", data);
      if (res.success && res.data?.bypassedOtp) {
        apiGet<User>("/api/auth/me").then((meRes) => {
          if (meRes.success && meRes.data) {
            setUser(meRes.data);
          }
        });
        router.push("/stocks");
      }
      return res;
    },
    [router]
  );

  const verifyOtp = useCallback(
    async (pendingToken: string, otp: string) => {
      const res = await apiPost<User>("/api/auth/verify-otp", { pendingToken, otp });
      if (res.success && res.data) {
        setUser(res.data);
        router.push("/stocks");
      }
      return res;
    },
    [router]
  );

  const logout = useCallback(async () => {
    await apiPost("/api/auth/logout", {});
    setUser(null);
    router.push("/");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, verifyOtp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
