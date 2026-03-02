"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GradientBlob } from "@/components/ui/GradientBlob";
import { PageWrapper } from "@/components/ui/PageWrapper";
import { Button } from "@/components/ui/Button";
import { DifficultyPicker } from "@/components/words/WordListSelector";
import { SpellingSession } from "@/components/spelling/SpellingSession";
import { useProfile } from "@/context/ProfileContext";
import { usePresetWordLists, useCustomWordLists } from "@/db/hooks";

interface Selection {
  wordListIds: number[];
  difficulty?: number;
}

export default function SpellingPage() {
  const router = useRouter();
  const { activeProfile } = useProfile();
  const presetLists = usePresetWordLists(activeProfile?.age);
  const customLists = useCustomWordLists();
  const [selection, setSelection] = useState<Selection | null>(null);

  if (!activeProfile) return null;

  const presetListIds = presetLists.map((l) => l.id!);

  return (
    <>
      <GradientBlob variant="spelling" />
      <PageWrapper>
        <div className="flex flex-col items-center gap-6 w-full max-w-2xl mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (selection) setSelection(null);
              else router.push("/play");
            }}
            className="self-start text-muted"
          >
            &larr; {selection ? "Choose Level" : "Back"}
          </Button>

          <h1 className="text-4xl font-black text-foreground">
            {selection ? "Spelling Practice" : "Choose Words"}
          </h1>

          {selection ? (
            <SpellingSession
              profileId={activeProfile.id!}
              wordListIds={selection.wordListIds}
              difficulty={selection.difficulty}
              onFinish={() => setSelection(null)}
            />
          ) : (
            <DifficultyPicker
              presetListIds={presetListIds}
              customLists={customLists}
              onSelectDifficulty={(difficulty, listIds) =>
                setSelection({ wordListIds: listIds, difficulty })
              }
              onSelectCustom={(listId) =>
                setSelection({ wordListIds: [listId] })
              }
            />
          )}
        </div>
      </PageWrapper>
    </>
  );
}
