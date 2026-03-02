"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GradientBlob } from "@/components/ui/GradientBlob";
import { PageWrapper } from "@/components/ui/PageWrapper";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useWordLists, useWordsForList, useCustomWordLists, usePresetWordLists } from "@/db/hooks";
import { db } from "@/db/database";
import { generateAndCacheAudio, deleteAudioIfOrphaned, deleteAudioForWords } from "@/lib/audio/audio-cache";

function WordListEditor({ listId, onClose }: { listId: number; onClose: () => void }) {
  const words = useWordsForList(listId);
  const allLists = useWordLists();
  const list = allLists.find((l) => l.id === listId);
  const [newWord, setNewWord] = useState("");

  const [generating, setGenerating] = useState(false);

  const addWord = async () => {
    const text = newWord.trim().toLowerCase();
    if (!text) return;
    await db.words.add({ wordListId: listId, text, difficulty: 1 });
    setNewWord("");
    // Generate audio in background — don't block the UI
    setGenerating(true);
    generateAndCacheAudio(text).finally(() => setGenerating(false));
  };

  const removeWord = async (wordId: number) => {
    const word = await db.words.get(wordId);
    await db.words.delete(wordId);
    if (word) {
      deleteAudioIfOrphaned(word.text);
    }
  };

  const deleteList = async () => {
    if (confirm("Delete this word list and all its words?")) {
      const wordsToDelete = await db.words.where("wordListId").equals(listId).toArray();
      await db.words.where("wordListId").equals(listId).delete();
      await db.wordLists.delete(listId);
      // Clean up orphaned audio in background
      deleteAudioForWords(wordsToDelete);
      onClose();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">{list?.name ?? "Word List"}</h3>
        {!list?.isPreset && (
          <Button variant="danger" size="sm" onClick={deleteList}>
            Delete List
          </Button>
        )}
      </div>

      {!list?.isPreset && (
        <div className="space-y-1">
          <div className="flex gap-2">
            <input
              type="text"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addWord()}
              placeholder="Add a word..."
              className="flex-1 px-4 py-2 rounded-xl border-2 border-gray-200 font-semibold focus:border-blue outline-none"
            />
            <Button size="sm" onClick={addWord} disabled={!newWord.trim()}>
              Add
            </Button>
          </div>
          {generating && (
            <p className="text-xs text-muted animate-pulse">Generating audio...</p>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
        {words.map((word) => (
          <span
            key={word.id}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-full text-sm font-semibold"
          >
            {word.text}
            {!list?.isPreset && (
              <button
                onClick={() => removeWord(word.id!)}
                className="ml-1 text-gray-400 hover:text-coral font-bold"
              >
                &times;
              </button>
            )}
          </span>
        ))}
        {words.length === 0 && (
          <p className="text-muted text-sm">No words yet. Add some above!</p>
        )}
      </div>
    </div>
  );
}

export default function WordsPage() {
  const router = useRouter();
  const presetLists = usePresetWordLists();
  const customLists = useCustomWordLists();
  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListAgeMin, setNewListAgeMin] = useState(5);
  const [newListAgeMax, setNewListAgeMax] = useState(10);

  const createList = async () => {
    if (!newListName.trim()) return;
    const id = await db.wordLists.add({
      name: newListName.trim(),
      isPreset: false,
      ageMin: newListAgeMin,
      ageMax: newListAgeMax,
      createdAt: new Date(),
    });
    setNewListName("");
    setShowCreate(false);
    setSelectedListId(id as number);
  };

  return (
    <>
      <GradientBlob variant="parent" />
      <PageWrapper>
        <div className="flex flex-col items-center gap-6 w-full max-w-2xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/parent")}
            className="self-start text-muted"
          >
            &larr; Back
          </Button>

          <h1 className="text-4xl font-black text-foreground">Word Lists</h1>

          <div className="flex gap-3 self-end">
            <Button size="sm" onClick={() => setShowCreate(true)}>
              + New List
            </Button>
          </div>

          {selectedListId ? (
            <Card className="w-full">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedListId(null)}
                className="mb-2 text-muted"
              >
                &larr; All Lists
              </Button>
              <WordListEditor listId={selectedListId} onClose={() => setSelectedListId(null)} />
            </Card>
          ) : (
            <>
              {customLists.length > 0 && (
                <Card className="w-full">
                  <h3 className="text-lg font-bold mb-3">Your Lists</h3>
                  <div className="space-y-2">
                    {customLists.map((list) => (
                      <button
                        key={list.id}
                        onClick={() => setSelectedListId(list.id!)}
                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
                      >
                        <span className="font-semibold">{list.name}</span>
                        <span className="text-sm text-muted">Ages {list.ageMin}-{list.ageMax}</span>
                      </button>
                    ))}
                  </div>
                </Card>
              )}

              <Card className="w-full">
                <h3 className="text-lg font-bold mb-3">Preset Lists (NZ/UK Curriculum)</h3>
                <div className="space-y-2">
                  {presetLists.map((list) => (
                    <button
                      key={list.id}
                      onClick={() => setSelectedListId(list.id!)}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
                    >
                      <span className="font-semibold">{list.name}</span>
                      <span className="text-sm text-muted">Ages {list.ageMin}-{list.ageMax}</span>
                    </button>
                  ))}
                </div>
              </Card>
            </>
          )}
        </div>

        <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Word List">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-1">List Name</label>
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="e.g. Week 5 Words"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 font-semibold focus:border-blue outline-none"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-1">Min Age</label>
                <input
                  type="number"
                  min={4}
                  max={12}
                  value={newListAgeMin}
                  onChange={(e) => setNewListAgeMin(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 font-semibold focus:border-blue outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Max Age</label>
                <input
                  type="number"
                  min={4}
                  max={12}
                  value={newListAgeMax}
                  onChange={(e) => setNewListAgeMax(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 font-semibold focus:border-blue outline-none"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button onClick={createList} disabled={!newListName.trim()}>
                Create
              </Button>
            </div>
          </div>
        </Modal>
      </PageWrapper>
    </>
  );
}
