"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/context/ProfileContext";

export default function PlayLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { activeProfile, loading } = useProfile();

  useEffect(() => {
    if (!loading && !activeProfile) {
      router.push("/");
    }
  }, [loading, activeProfile, router]);

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!activeProfile) return null;

  return <>{children}</>;
}
