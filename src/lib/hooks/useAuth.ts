"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => {
        if (!r.ok) throw new Error("Not authenticated");
        return r.json();
      })
      .then(data => { setUser(data.user); setLoading(false); })
      .catch(() => { router.push("/auth/login"); setLoading(false); });
  }, [router]);

  return { user, loading, isAuthenticated: !!user };
}
