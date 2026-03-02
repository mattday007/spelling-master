"use client";

import { useProfile } from "@/context/ProfileContext";

export function useActiveProfile() {
  return useProfile();
}
