"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: "user" | "trader" | "admin";
  subscription_tier: "free" | "analyzer" | "copier" | "pro" | "provider";
  subscription_active: boolean;
  referral_code: string | null;
  phone: string | null;
  onboarding_completed: boolean;
  trading_experience: string | null;
  trading_goal: string | null;
  created_at: string;
}

interface UserContextValue {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  tier: string;
  isLoggedIn: boolean;
  isPaying: boolean;
  onboardingDone: boolean;
  refetch: () => Promise<void>;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  loading: true,
  error: null,
  tier: "free",
  isLoggedIn: false,
  isPaying: false,
  onboardingDone: false,
  refetch: async () => {},
});

const PAYING_TIERS = ["analyzer", "copier", "pro", "provider"];

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        setUser(null);
        return;
      }
      const data = await res.json();
      setUser(data.user);
    } catch {
      setError("Verbindungsfehler");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const tier = user?.subscription_tier ?? "free";
  const isLoggedIn = !!user;
  const isPaying = PAYING_TIERS.includes(tier);
  const onboardingDone = user?.onboarding_completed ?? false;

  return (
    <UserContext.Provider
      value={{ user, loading, error, tier, isLoggedIn, isPaying, onboardingDone, refetch: fetchUser }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
