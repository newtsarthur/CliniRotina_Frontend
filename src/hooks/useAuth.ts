import { useState, useEffect } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { withTimeout } from "@/lib/asyncTimeout";

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  user_type: "doctor" | "patient" | null;
  phone: string | null;
  cpf: string | null;
  birth_date: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  doctor_id: string | null;
  avatar_url: string | null;
  notifications_enabled: boolean | null;
}

export function useAuth() {
  // Synchronous initialization from cache to prevent page flashes
  const cachedUser = (() => {
    try {
      const u = localStorage.getItem("sb_cached_user");
      return u ? JSON.parse(u) as User : null;
    } catch {
      return null;
    }
  })();

  const cachedProfile = (() => {
    try {
      const p = localStorage.getItem("sb_cached_profile");
      return p ? JSON.parse(p) as Profile : null;
    } catch {
      return null;
    }
  })();

  // Initialize session with a mock structure if we have a cached user,
  // preventing ProtectedRoute from redirecting to login on mount.
  const [session, setSession] = useState<Session | null>(() => {
    if (cachedUser) {
      return {
        access_token: "",
        token_type: "bearer",
        expires_in: 3600,
        refresh_token: "",
        user: cachedUser,
      } as Session;
    }
    return null;
  });

  const [user, setUser] = useState<User | null>(cachedUser);
  const [profile, setProfile] = useState<Profile | null>(cachedProfile);
  const [loading, setLoading] = useState(!cachedProfile); // Only show loading skeleton if we have no cache

  useEffect(() => {
    const loadProfile = async (userId: string) => {
      try {
        const { data } = await withTimeout(
          supabase
            .from("profiles")
            .select("id,email,full_name,user_type,phone,cpf,birth_date,address,city,state,zip_code,doctor_id,avatar_url,notifications_enabled")
            .eq("id", userId)
            .maybeSingle(),
          30000,
          "carregamento do perfil"
        );

        if (data) {
          const loaded = data as Profile;
          localStorage.setItem("sb_cached_profile", JSON.stringify(loaded));
          return loaded;
        }
        return null;
      } catch {
        return null;
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        const u = session?.user ?? null;
        setUser(u);
        
        if (u) {
          localStorage.setItem("sb_cached_user", JSON.stringify(u));
          loadProfile(u.id).then((loadedProfile) => {
            if (loadedProfile) {
              setProfile(loadedProfile);
            }
            setLoading(false);
          });
        } else {
          setProfile(null);
          localStorage.removeItem("sb_cached_user");
          localStorage.removeItem("sb_cached_profile");
          setLoading(false);
        }
      }
    );

    // Initial session load check
    withTimeout(supabase.auth.getSession(), 30000, "sessão inicial").then(({ data: { session } }) => {
      setSession(session);
      const u = session?.user ?? null;
      setUser(u);
      
      if (u) {
        localStorage.setItem("sb_cached_user", JSON.stringify(u));
        loadProfile(u.id).then((loadedProfile) => {
          if (loadedProfile) {
            setProfile(loadedProfile);
          }
          setLoading(false);
        });
      } else {
        setProfile(null);
        localStorage.removeItem("sb_cached_user");
        localStorage.removeItem("sb_cached_profile");
        setLoading(false);
      }
    }).catch(() => {
      setSession(null);
      setUser(null);
      setProfile(null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("userType");
    localStorage.removeItem("sb_cached_user");
    localStorage.removeItem("sb_cached_profile");
  };

  return { session, user, profile, loading, signOut };
}
