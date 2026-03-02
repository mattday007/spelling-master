"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { GradientBlob } from "@/components/ui/GradientBlob";
import { PageWrapper } from "@/components/ui/PageWrapper";
import { Button } from "@/components/ui/Button";
import { useProfile } from "@/context/ProfileContext";
import { AVATARS } from "@/types";

export default function PlayModePage() {
  const router = useRouter();
  const { activeProfile, setActiveProfile } = useProfile();

  if (!activeProfile) return null;

  const avatar = AVATARS.find((a) => a.id === activeProfile.avatarId) ?? AVATARS[0];

  return (
    <>
      <GradientBlob variant="home" />
      <PageWrapper>
        <div className="flex flex-col items-center gap-8 w-full max-w-lg mt-8">
          <div className="flex items-center gap-3">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-3xl shadow"
              style={{
                background: `linear-gradient(135deg, ${avatar.color}40, ${avatar.color}15)`,
              }}
            >
              {avatar.emoji}
            </div>
            <div>
              <h2 className="text-xl font-bold">{activeProfile.name}</h2>
              <button
                onClick={() => {
                  setActiveProfile(null);
                  router.push("/");
                }}
                className="text-sm text-muted hover:text-foreground transition-colors"
              >
                Switch Profile
              </button>
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-foreground text-center">
            What shall we practise?
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full mt-4">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => router.push("/play/spelling")}
              className="glass-card p-8 text-center space-y-4 hover:shadow-2xl transition-shadow no-select"
            >
              <div className="text-6xl">✏️</div>
              <h3 className="text-2xl font-black text-foreground">Spelling</h3>
              <p className="text-muted font-semibold">
                Hear a word, then write it!
              </p>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => router.push("/play/pronunciation")}
              className="glass-card p-8 text-center space-y-4 hover:shadow-2xl transition-shadow no-select"
            >
              <div className="text-6xl">🗣️</div>
              <h3 className="text-2xl font-black text-foreground">Pronunciation</h3>
              <p className="text-muted font-semibold">
                See a word, then say it!
              </p>
            </motion.button>
          </div>

          <div className="flex gap-4 mt-8">
            <Button
              variant="secondary"
              onClick={() => router.push("/progress")}
            >
              My Progress
            </Button>
            <Button
              variant="ghost"
              onClick={() => router.push("/")}
              className="text-muted"
            >
              Home
            </Button>
          </div>
        </div>
      </PageWrapper>
    </>
  );
}
