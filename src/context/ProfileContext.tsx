"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { Profile } from "@/types";
import { db } from "@/db/database";

interface ProfileContextType {
  activeProfile: Profile | null;
  setActiveProfile: (profile: Profile | null) => void;
  loading: boolean;
}

const ProfileContext = createContext<ProfileContextType>({
  activeProfile: null,
  setActiveProfile: () => {},
  loading: true,
});

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [activeProfile, setActiveProfileState] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedId = localStorage.getItem("activeProfileId");
    if (savedId) {
      db.profiles
        .get(Number(savedId))
        .then((profile) => {
          if (profile) setActiveProfileState(profile);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      // Use a microtask to avoid synchronous setState in effect
      Promise.resolve().then(() => setLoading(false));
    }
  }, []);

  const setActiveProfile = (profile: Profile | null) => {
    setActiveProfileState(profile);
    if (profile?.id) {
      localStorage.setItem("activeProfileId", String(profile.id));
    } else {
      localStorage.removeItem("activeProfileId");
    }
  };

  return (
    <ProfileContext.Provider value={{ activeProfile, setActiveProfile, loading }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
