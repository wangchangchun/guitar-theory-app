import { useEffect, useState } from "react";
import type { PracticeUnit, Question } from "../data/practice";
import {
  FINAL_UNIT,
  MASTERY_RATIO,
  PRACTICE_UNITS,
  UNIT_PHASE_GROUPS,
} from "../data/practice";
import type { ProgressMap } from "../data/progress";
import { isMastered, loadProgress, saveProgress } from "../data/progress";
import { useNav } from "../nav";
import { playMidiNotes } from "../audio/audioEngine";
import { ChordStrip } from "../components/ChordStrip";

/**
 * 樂理練習：把觀念拆成單元逐一驗收，每單元記錄最佳成績，
 * 答對率達 80% 標記為「精通」；全部單元精通後解鎖綜合測驗。
 * 支援從學習路線頁深連結直接開始某個單元。
 */

function resultMessage(unit: PracticeUnit, score: number, total: number): string {
  const ratio = score / total;
  if (unit.id === "final") {
    if (ratio === 1) return "滿分通關！樂理之魂已覺醒，快回指板上驗證吧 🤘";
    if (ratio >= MASTERY_RATIO) return "綜合測驗過關！哪題猶豫了，就回那個單元再磨一下。";
    return "混在一起就亂了？回到出錯的單元各練一輪，再來挑戰。";
  }
  if (ratio === 1) return "滿分精通！這個觀念完全內化了 🎉";
  if (ratio >= MASTERY_RATIO) return "達到 80% 精通標準！想拚滿分可以再來一輪。";
  if (ratio >= 0.5) return "有基礎了，但還沒到 80%——看看下面的解說，再練一輪就能精通。";
  return "別急，先讀每題的解說搞懂原理，這個單元多練幾輪一定會通。";
}

export function PracticePage() {
  const [progress, setProgress] = useState<ProgressMap>(loadProgress);
  const [unit, setUnit] = useState<PracticeUnit | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const masteredCount = PRACTICE_UNITS.filter((u) =>
    isMastered(progress[u.id]),
  ).length;
  const finalUnlocked = masteredCount === PRACTICE_UNITS.length;

  const startUnit = (u: PracticeUnit) => {
    setUnit(u);
    setQuestions(u.build());
    setIndex(0);
    setChosen(null);
    setScore(0);
    setDone(false);
  };

  // 從學習路線頁深連結：自動開始指定單元
  const { pendingUnitId, consumePendingUnit } = useNav();
  useEffect(() => {
    if (!pendingUnitId) return;
    const target = PRACTICE_UNITS.find((u) => u.id === pendingUnitId);
    if (target) startUnit(target);
    consumePendingUnit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingUnitId]);

  const backToMenu = () => setUnit(null);

  const finishRound = (finalScore: number) => {
    if (!unit) return;
    const prev = progress[unit.id];
    const next: ProgressMap = {
      ...progress,
      [unit.id]: {
        best: Math.max(prev?.best ?? 0, finalScore),
        total: questions.length,
        attempts: (prev?.attempts ?? 0) + 1,
      },
    };
    setProgress(next);
    saveProgress(next);
    setDone(true);
  };

  // ── 單元選單 ──────────────────────────────
  if (!unit) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="mb-5 rounded-2xl border border-line-200 bg-paper-100 p-5">
          <p className="text-sm leading-relaxed text-ink-700">
            練習分成{" "}
            <span className="font-bold text-navy-700">
              {PRACTICE_UNITS.length} 個單元
            </span>
            ，每個單元只驗收一個觀念。單輪答對率達
            <span className="mx-1 font-bold text-olive-700">80%</span>
            即標記為精通 ✓；全部精通後解鎖
            <span className="mx-1 font-bold text-navy-700">綜合測驗</span>
            ——確保每個觀念都被確實學到，而不是靠混合題矇混過關。
          </p>
          <p className="mt-2 text-xs text-ink-500">
            進度：{masteredCount} / {PRACTICE_UNITS.length} 個單元已精通
          </p>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-paper-300">
            <div
              className="h-full bg-olive-700 transition-all"
              style={{
                width: `${(masteredCount / PRACTICE_UNITS.length) * 100}%`,
              }}
            />
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {UNIT_PHASE_GROUPS.map((group) => {
            const units = group.ids.map(
              (id) => PRACTICE_UNITS.find((u) => u.id === id)!,
            );
            const groupMastered = units.filter((u) =>
              isMastered(progress[u.id]),
            ).length;
            return (
              <div key={group.title}>
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <h3 className="text-sm font-bold text-ink-700">
                    {group.title}
                  </h3>
                  <span className="font-mono text-xs text-ink-500">
                    {groupMastered}/{units.length} 精通
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {units.map((u) => {
                    const no = PRACTICE_UNITS.indexOf(u) + 1;
                    const p = progress[u.id];
                    const mastered = isMastered(p);
                    return (
                      <button
                        key={u.id}
                        onClick={() => startUnit(u)}
                        className={`rounded-xl border p-4 text-left transition-colors ${
                          mastered
                            ? "border-olive-700/60 bg-olive-700/30 hover:border-olive-700"
                            : "border-line-200 bg-paper-100 hover:border-line-300"
                        }`}
                      >
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <span className="font-bold text-ink-900">
                            {u.emoji} 單元 {no}｜{u.title}
                          </span>
                          {mastered ? (
                            <span className="shrink-0 rounded-full bg-olive-700/30 px-2 py-0.5 text-[10px] font-semibold text-olive-700">
                              ✓ 已精通
                            </span>
                          ) : p ? (
                            <span className="shrink-0 rounded-full bg-paper-300 px-2 py-0.5 text-[10px] text-ink-600">
                              練習中
                            </span>
                          ) : (
                            <span className="shrink-0 rounded-full bg-paper-300 px-2 py-0.5 text-[10px] text-ink-500">
                              未挑戰
                            </span>
                          )}
                        </div>
                        <p className="mb-2 text-xs leading-relaxed text-ink-600">
                          {u.tagline}
                        </p>
                        <ul className="mb-2 space-y-0.5">
                          {u.goals.map((g) => (
                            <li
                              key={g}
                              className="text-[11px] leading-relaxed text-ink-500"
                            >
                              ・{g}
                            </li>
                          ))}
                        </ul>
                        <p className="mb-1 text-[11px] text-navy-700/70">
                          🎸 附 {u.drills.length} 個上琴應用練習
                        </p>
                        {p && (
                          <p className="text-[11px] font-mono text-ink-500">
                            最佳成績 {p.best}/{p.total}・已挑戰 {p.attempts} 輪
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* 綜合測驗卡片 */}
          <button
            onClick={() => finalUnlocked && startUnit(FINAL_UNIT)}
            disabled={!finalUnlocked}
            className={`rounded-xl border p-4 text-left transition-colors sm:col-span-2 ${
              finalUnlocked
                ? "border-navy-700/70 bg-navy-700/10 hover:border-navy-700"
                : "cursor-not-allowed border-line-200 bg-paper-100/50"
            }`}
          >
            <div className="mb-1 flex items-center justify-between gap-2">
              <span
                className={`font-bold ${
                  finalUnlocked ? "text-navy-700" : "text-ink-500"
                }`}
              >
                {finalUnlocked ? "🏆" : "🔒"} {FINAL_UNIT.title}
              </span>
              {isMastered(progress[FINAL_UNIT.id]) && (
                <span className="shrink-0 rounded-full bg-olive-700/30 px-2 py-0.5 text-[10px] font-semibold text-olive-700">
                  ✓ 已通關
                </span>
              )}
            </div>
            <p
              className={`text-xs leading-relaxed ${
                finalUnlocked ? "text-ink-700" : "text-ink-500"
              }`}
            >
              {finalUnlocked
                ? FINAL_UNIT.tagline
                : `再精通 ${PRACTICE_UNITS.length - masteredCount} 個單元即可解鎖——每個觀念都確實學到，綜合測驗才有意義。`}
            </p>
            {progress[FINAL_UNIT.id] && finalUnlocked && (
              <p className="mt-2 text-[11px] font-mono text-ink-500">
                最佳成績 {progress[FINAL_UNIT.id].best}/
                {progress[FINAL_UNIT.id].total}
              </p>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ── 測驗中 ───────────────────────────────
  const q = questions[index];
  const isLast = index === questions.length - 1;
  const answered = chosen !== null;

  const choose = (i: number) => {
    if (answered) return;
    setChosen(i);
    if (i === q.answerIndex) setScore((s) => s + 1);
  };

  const next = () => {
    if (isLast) {
      finishRound(score);
      return;
    }
    setIndex(index + 1);
    setChosen(null);
  };

  if (done) {
    const mastered = score / questions.length >= MASTERY_RATIO;
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-line-200 bg-paper-100 p-10 text-center">
        <p className="mb-2 text-sm text-ink-600">
          {unit.emoji} {unit.title}・本輪成績
        </p>
        <p className="mb-2 text-5xl font-extrabold text-navy-700">
          {score}{" "}
          <span className="text-2xl text-ink-500">/ {questions.length}</span>
        </p>
        {mastered && (
          <p className="mb-2 text-sm font-semibold text-olive-700">
            ✓ 達到精通標準（{Math.round(MASTERY_RATIO * 100)}%）
          </p>
        )}
        <p className="mb-6 text-ink-700">
          {resultMessage(unit, score, questions.length)}
        </p>

        {unit.drills.length > 0 && (
          <div className="mb-8 rounded-xl bg-paper-300/60 p-4 text-left">
            <p className="mb-3 text-sm font-bold text-navy-700">
              🎸 上琴應用：把這個觀念搬到指板上
            </p>
            <ol className="space-y-3">
              {unit.drills.map((d, i) => (
                <li key={d.title} className="text-sm">
                  <span className="font-semibold text-ink-900">
                    {i + 1}. {d.title}
                  </span>
                  <p className="mt-0.5 text-xs leading-relaxed text-ink-600">
                    {d.how}
                  </p>
                  {d.chords && <ChordStrip chords={d.chords} width={62} />}
                </li>
              ))}
            </ol>
          </div>
        )}

        <div className="flex justify-center gap-3">
          <button
            onClick={() => startUnit(unit)}
            className="rounded-lg bg-navy-700 px-6 py-2.5 font-semibold text-white transition-colors hover:bg-navy-600"
          >
            再練一輪
          </button>
          <button
            onClick={backToMenu}
            className="rounded-lg bg-paper-400 px-6 py-2.5 font-semibold text-ink-900 transition-colors hover:bg-paper-400"
          >
            回單元列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* 單元標題與進度列 */}
      <div className="mb-2 flex items-baseline justify-between text-sm text-ink-600">
        <button
          onClick={backToMenu}
          className="text-ink-600 transition-colors hover:text-navy-700"
        >
          ← 單元列表
        </button>
        <span className="font-semibold text-ink-700">
          {unit.emoji} {unit.title}
        </span>
        <span>
          第 {index + 1} / {questions.length} 題・得分{" "}
          <span className="font-bold text-navy-700">{score}</span>
        </span>
      </div>
      <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-paper-300">
        <div
          className="h-full bg-navy-700 transition-all"
          style={{
            width: `${((index + (answered ? 1 : 0)) / questions.length) * 100}%`,
          }}
        />
      </div>

      <div className="rounded-2xl border border-line-200 bg-paper-100 p-6">
        <h2 className="mb-5 text-lg font-bold leading-relaxed text-ink-900">
          {q.prompt}
        </h2>

        <div className="grid gap-2 sm:grid-cols-2">
          {q.options.map((opt, i) => {
            let style = "bg-paper-300 text-ink-900 hover:bg-paper-400";
            if (answered) {
              if (i === q.answerIndex) {
                style = "bg-olive-700/80 text-white ring-1 ring-olive-700";
              } else if (i === chosen) {
                style = "bg-blood-700/80 text-white ring-1 ring-blood-700";
              } else {
                style = "bg-paper-300/50 text-ink-500";
              }
            }
            return (
              <button
                key={i}
                onClick={() => choose(i)}
                disabled={answered}
                className={`rounded-lg px-4 py-3 text-left font-mono text-sm font-semibold transition-colors ${style}`}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {answered && (
          <div className="mt-5 rounded-lg bg-paper-300/60 p-4">
            <p className="mb-1 font-semibold">
              {chosen === q.answerIndex ? (
                <span className="text-olive-700">✅ 答對了！</span>
              ) : (
                <span className="text-blood-700">
                  ❌ 正確答案是 {q.options[q.answerIndex]}
                </span>
              )}
            </p>
            <p className="text-sm leading-relaxed text-ink-700">{q.explanation}</p>
            <div className="mt-3 flex items-center justify-between gap-3">
              {q.soundMidis ? (
                <button
                  onClick={() => playMidiNotes(q.soundMidis!, q.soundStyle)}
                  className="rounded-lg bg-paper-400 px-4 py-1.5 text-sm font-medium text-ink-900 transition-colors hover:bg-paper-400"
                >
                  ♪ 聽聽 {q.soundLabel}
                </button>
              ) : (
                <span />
              )}
              <button
                onClick={next}
                className="rounded-lg bg-navy-700 px-6 py-1.5 font-semibold text-white transition-colors hover:bg-navy-600"
              >
                {isLast ? "看成績" : "下一題 →"}
              </button>
            </div>
          </div>
        )}
      </div>

      {unit.drills.length > 0 && (
        <details className="mt-4 rounded-xl border border-line-200 bg-paper-100 px-4 py-3">
          <summary className="cursor-pointer text-sm font-semibold text-navy-700">
            🎸 上琴應用練習（{unit.drills.length} 個）——答完題拿起吉他做
          </summary>
          <ol className="mt-3 space-y-3">
            {unit.drills.map((d, i) => (
              <li key={d.title} className="text-sm">
                <span className="font-semibold text-ink-900">
                  {i + 1}. {d.title}
                </span>
                <p className="mt-0.5 text-xs leading-relaxed text-ink-600">
                  {d.how}
                </p>
                {d.chords && <ChordStrip chords={d.chords} width={62} />}
              </li>
            ))}
          </ol>
        </details>
      )}

      <p className="mt-4 text-center text-xs text-ink-500">{unit.tagline}</p>
    </div>
  );
}
