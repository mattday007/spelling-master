"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { GradientBlob } from "@/components/ui/GradientBlob";
import { PageWrapper } from "@/components/ui/PageWrapper";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { LineChart } from "@/components/ui/LineChart";
import { useProfile } from "@/context/ProfileContext";
import {
  useAttempts,
  useSessions,
  useWordMastery,
  useVocabularySize,
  useTodayAttempts,
} from "@/db/hooks";
import { AVATARS } from "@/types";
import type { MasteryStage } from "@/types";

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function ProgressPage() {
  const router = useRouter();
  const { activeProfile } = useProfile();
  const attempts = useAttempts(activeProfile?.id);
  const sessions = useSessions(activeProfile?.id);
  const mastery = useWordMastery(activeProfile?.id);
  const spellingVocab = useVocabularySize(activeProfile?.id, "spelling");
  const pronVocab = useVocabularySize(activeProfile?.id, "pronunciation");
  const todayAttempts = useTodayAttempts(activeProfile?.id);

  // Vocabulary growth chart data — cumulative known words per day over last 30 days
  const chartSeries = useMemo(() => {
    if (!mastery.length) return [];

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Build date range
    const dates: string[] = [];
    for (let d = new Date(thirtyDaysAgo); d <= now; d.setDate(d.getDate() + 1)) {
      dates.push(formatDate(new Date(d)));
    }

    // For each mode, compute cumulative known count per date
    // A word counts as "known" on a date if it reached stage 3 by that date
    // We approximate using updatedAt for stage-3 records
    const knownByDate = (mode: "spelling" | "pronunciation") => {
      const stage3 = mastery.filter((m) => m.mode === mode && m.stage === 3 && m.lastPassedAt);
      return dates.map((date) => {
        const count = stage3.filter(
          (m) => formatDate(new Date(m.lastPassedAt!)) <= date
        ).length;
        return { date, value: count };
      });
    };

    const spellingData = knownByDate("spelling");
    const pronData = knownByDate("pronunciation");

    const series = [];
    if (spellingData.some((d) => d.value > 0)) {
      series.push({ label: "Spelling", color: "#6C5CE7", data: spellingData });
    }
    if (pronData.some((d) => d.value > 0)) {
      series.push({ label: "Pronunciation", color: "#D946EF", data: pronData });
    }
    return series;
  }, [mastery]);

  // Mastery pipeline counts
  const pipeline = useMemo(() => {
    const counts: Record<string, Record<number, number>> = {
      spelling: { 0: 0, 1: 0, 2: 0, 3: 0 },
      pronunciation: { 0: 0, 1: 0, 2: 0, 3: 0 },
    };
    for (const m of mastery) {
      if (counts[m.mode]) {
        counts[m.mode][m.stage]++;
      }
    }
    return counts;
  }, [mastery]);

  // Words due for review
  const dueWords = useMemo(() => {
    const now = new Date();
    return mastery.filter(
      (m) => m.nextReviewAt && new Date(m.nextReviewAt) <= now && m.stage < 3
    );
  }, [mastery]);

  // Known words (stage 3)
  const knownWords = useMemo(
    () => mastery.filter((m) => m.stage === 3),
    [mastery]
  );

  // Weekly trend
  const weeklyTrend = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const thisWeek = attempts.filter(
      (a) => new Date(a.attemptedAt) >= oneWeekAgo
    );
    const lastWeek = attempts.filter(
      (a) => new Date(a.attemptedAt) >= twoWeeksAgo && new Date(a.attemptedAt) < oneWeekAgo
    );

    const thisAcc = thisWeek.length > 0
      ? thisWeek.filter((a) => a.success).length / thisWeek.length
      : 0;
    const lastAcc = lastWeek.length > 0
      ? lastWeek.filter((a) => a.success).length / lastWeek.length
      : 0;

    if (thisWeek.length === 0) return { label: "No activity", icon: "📊" };
    if (lastWeek.length === 0) return { label: "Great start!", icon: "🚀" };
    if (thisAcc > lastAcc + 0.05) return { label: "Improving", icon: "📈" };
    if (thisAcc < lastAcc - 0.05) return { label: "Needs Practice", icon: "📉" };
    return { label: "Steady", icon: "➡️" };
  }, [attempts]);

  if (!activeProfile) {
    return (
      <>
        <GradientBlob variant="progress" />
        <PageWrapper>
          <p className="text-muted">Please select a profile first.</p>
          <Button onClick={() => router.push("/")}>Go Home</Button>
        </PageWrapper>
      </>
    );
  }

  const avatar = AVATARS.find((a) => a.id === activeProfile.avatarId) ?? AVATARS[0];
  const totalAttempts = attempts.length;
  const correctAttempts = attempts.filter((a) => a.success).length;
  const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;

  // Today's stats
  const todayCount = todayAttempts.length;
  const todayCorrect = todayAttempts.filter((a) => a.success).length;
  const todayAccuracy = todayCount > 0 ? Math.round((todayCorrect / todayCount) * 100) : 0;
  const todaySessions = sessions.filter((s) => {
    const d = new Date(s.startedAt);
    const today = new Date();
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  }).length;

  // Struggling words (>=2 attempts, <50% accuracy)
  const wordStats = new Map<string, { correct: number; total: number }>();
  for (const a of attempts) {
    const stats = wordStats.get(a.wordText) ?? { correct: 0, total: 0 };
    stats.total++;
    if (a.success) stats.correct++;
    wordStats.set(a.wordText, stats);
  }
  const strugglingWords = Array.from(wordStats.entries())
    .filter(([, s]) => s.total >= 2 && s.correct / s.total < 0.5)
    .slice(0, 10);

  const stageLabels: Record<number, { name: string; color: string }> = {
    0: { name: "Need Practice", color: "var(--color-coral)" },
    1: { name: "Learning", color: "var(--color-orange)" },
    2: { name: "Reviewing", color: "var(--color-blue)" },
    3: { name: "Known", color: "var(--color-green)" },
  };

  return (
    <>
      <GradientBlob variant="progress" />
      <PageWrapper>
        <div className="flex flex-col items-center gap-6 w-full max-w-lg mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/play")}
            className="self-start text-muted"
          >
            &larr; Back
          </Button>

          <div className="flex items-center gap-3">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow"
              style={{
                background: `linear-gradient(135deg, ${avatar.color}40, ${avatar.color}15)`,
                border: `3px solid ${avatar.color}`,
              }}
            >
              {avatar.emoji}
            </div>
            <div>
              <h1 className="text-3xl font-black">{activeProfile.name}&apos;s Progress</h1>
            </div>
          </div>

          {totalAttempts === 0 ? (
            <Card className="w-full text-center space-y-4">
              <div className="text-5xl">🌱</div>
              <h2 className="text-2xl font-bold">Just Getting Started!</h2>
              <p className="text-muted">Complete some practice sessions to see your progress here.</p>
              <Button onClick={() => router.push("/play")}>Start Practising</Button>
            </Card>
          ) : (
            <>
              {/* Section 1: Vocabulary Hero Cards */}
              <div className="grid grid-cols-2 gap-4 w-full">
                <Card className="text-center">
                  <motion.p
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-4xl font-black text-purple"
                  >
                    {spellingVocab}
                  </motion.p>
                  <p className="text-sm text-muted font-bold">Spelling Known</p>
                </Card>
                <Card className="text-center">
                  <motion.p
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-4xl font-black text-pink"
                  >
                    {pronVocab}
                  </motion.p>
                  <p className="text-sm text-muted font-bold">Pronunciation Known</p>
                </Card>
              </div>

              {/* Section 2: Vocabulary Growth Chart */}
              {chartSeries.length > 0 && (
                <Card className="w-full space-y-2">
                  <h3 className="text-xl font-bold">Vocabulary Growth</h3>
                  <LineChart series={chartSeries} height={200} />
                </Card>
              )}

              {/* Section 3: Today's Activity */}
              <Card className="w-full">
                <h3 className="text-xl font-bold mb-3">Today</h3>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-2xl font-black text-blue">{todayCount}</p>
                    <p className="text-xs text-muted font-bold">Words</p>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-green">{todayAccuracy}%</p>
                    <p className="text-xs text-muted font-bold">Accuracy</p>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-orange">{todaySessions}</p>
                    <p className="text-xs text-muted font-bold">Sessions</p>
                  </div>
                </div>
              </Card>

              {/* Section 4: Mastery Pipeline */}
              {mastery.length > 0 && (
                <Card className="w-full space-y-4">
                  <h3 className="text-xl font-bold">Mastery Pipeline</h3>
                  {(["spelling", "pronunciation"] as const).map((mode) => {
                    const counts = pipeline[mode];
                    const total = Object.values(counts).reduce((a, b) => a + b, 0);
                    if (total === 0) return null;
                    return (
                      <div key={mode} className="space-y-1.5">
                        <p className="text-sm font-bold capitalize">{mode}</p>
                        <div className="flex rounded-full overflow-hidden h-6">
                          {([0, 1, 2, 3] as MasteryStage[]).map((stage) => {
                            const count = counts[stage];
                            if (count === 0) return null;
                            const pct = (count / total) * 100;
                            return (
                              <div
                                key={stage}
                                className="flex items-center justify-center text-xs font-bold text-white"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor: stageLabels[stage].color,
                                  minWidth: count > 0 ? "24px" : 0,
                                }}
                              >
                                {count}
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                          {([0, 1, 2, 3] as MasteryStage[]).map((stage) => (
                            <span key={stage} className="text-xs text-muted flex items-center gap-1">
                              <span
                                className="inline-block w-2 h-2 rounded-full"
                                style={{ backgroundColor: stageLabels[stage].color }}
                              />
                              {stageLabels[stage].name}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </Card>
              )}

              {/* Section 5: Weekly Trend */}
              <Card className="w-full text-center">
                <p className="text-3xl">{weeklyTrend.icon}</p>
                <p className="text-lg font-bold">{weeklyTrend.label}</p>
                <p className="text-xs text-muted">Compared to last week</p>
              </Card>

              {/* Section 6: Accuracy Bars */}
              <Card className="w-full space-y-4">
                <h3 className="text-xl font-bold">Accuracy</h3>
                <ProgressBar value={accuracy} label="Overall" />

                {(() => {
                  const spelling = attempts.filter((a) => a.mode === "spelling");
                  const spellingAcc = spelling.length > 0
                    ? Math.round((spelling.filter((a) => a.success).length / spelling.length) * 100)
                    : 0;
                  return spelling.length > 0 ? (
                    <ProgressBar value={spellingAcc} label="Spelling" color="var(--color-purple)" />
                  ) : null;
                })()}

                {(() => {
                  const pron = attempts.filter((a) => a.mode === "pronunciation");
                  const pronAcc = pron.length > 0
                    ? Math.round((pron.filter((a) => a.success).length / pron.length) * 100)
                    : 0;
                  return pron.length > 0 ? (
                    <ProgressBar value={pronAcc} label="Pronunciation" color="var(--color-pink)" />
                  ) : null;
                })()}
              </Card>

              {/* Section 7: Words Due for Review */}
              {dueWords.length > 0 && (
                <Card className="w-full">
                  <h3 className="text-xl font-bold mb-3">Due for Review</h3>
                  <p className="text-sm text-muted mb-2">
                    These words are ready to be retested!
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {dueWords.map((m) => (
                      <span
                        key={m.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue/10 text-blue rounded-full text-sm font-bold"
                      >
                        {m.wordText}
                        <span className="text-xs opacity-60">({m.mode === "spelling" ? "S" : "P"})</span>
                      </span>
                    ))}
                  </div>
                </Card>
              )}

              {/* Section 8: Known Words */}
              {knownWords.length > 0 && (
                <Card className="w-full">
                  <h3 className="text-xl font-bold mb-3">Known Words</h3>
                  {(["spelling", "pronunciation"] as const).map((mode) => {
                    const words = knownWords.filter((m) => m.mode === mode);
                    if (words.length === 0) return null;
                    return (
                      <div key={mode} className="mb-3">
                        <p className="text-sm font-bold capitalize text-muted mb-1.5">{mode}</p>
                        <div className="flex flex-wrap gap-2">
                          {words.map((m) => (
                            <motion.span
                              key={m.id}
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-green/10 text-green rounded-full text-sm font-bold"
                            >
                              ⭐ {m.wordText}
                            </motion.span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </Card>
              )}

              {/* Section 9: Struggling Words */}
              {strugglingWords.length > 0 && (
                <Card className="w-full">
                  <h3 className="text-xl font-bold mb-3">Keep Practising</h3>
                  <div className="flex flex-wrap gap-2">
                    {strugglingWords.map(([word, stats]) => (
                      <span
                        key={word}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-coral/10 text-coral rounded-full text-sm font-bold"
                      >
                        {word} ({stats.correct}/{stats.total})
                      </span>
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      </PageWrapper>
    </>
  );
}
