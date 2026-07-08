import { useEffect, useState } from "react";
import type { PracticeUnit, Question } from "../data/practice";
import { FINAL_UNIT, MASTERY_RATIO, PRACTICE_UNITS } from "../data/practice";
import type { ProgressMap } from "../data/progress";
import { isMastered, loadProgress, saveProgress } from "../data/progress";
import { useNav } from "../nav";
import { playMidiNotes } from "../audio/audioEngine";

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
        <div className="mb-5 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm leading-relaxed text-slate-300">
            練習分成{" "}
            <span className="font-bold text-amber-400">
              {PRACTICE_UNITS.length} 個單元
            </span>
            ，每個單元只驗收一個觀念。單輪答對率達
            <span className="mx-1 font-bold text-emerald-400">80%</span>
            即標記為精通 ✓；全部精通後解鎖
            <span className="mx-1 font-bold text-amber-400">綜合測驗</span>
            ——確保每個觀念都被確實學到，而不是靠混合題矇混過關。
          </p>
          <p className="mt-2 text-xs text-slate-500">
            進度：{masteredCount} / {PRACTICE_UNITS.length} 個單元已精通
          </p>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{
                width: `${(masteredCount / PRACTICE_UNITS.length) * 100}%`,
              }}
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {PRACTICE_UNITS.map((u, i) => {
            const p = progress[u.id];
            const mastered = isMastered(p);
            return (
              <button
                key={u.id}
                onClick={() => startUnit(u)}
                className={`rounded-xl border p-4 text-left transition-colors ${
                  mastered
                    ? "border-emerald-600/60 bg-emerald-950/30 hover:border-emerald-500"
                    : "border-slate-800 bg-slate-900 hover:border-slate-600"
                }`}
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-100">
                    {u.emoji} 單元 {i + 1}｜{u.title}
                  </span>
                  {mastered ? (
                    <span className="shrink-0 rounded-full bg-emerald-600/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                      ✓ 已精通
                    </span>
                  ) : p ? (
                    <span className="shrink-0 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
                      練習中
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-500">
                      未挑戰
                    </span>
                  )}
                </div>
                <p className="mb-2 text-xs leading-relaxed text-slate-400">
                  {u.tagline}
                </p>
                <ul className="mb-2 space-y-0.5">
                  {u.goals.map((g) => (
                    <li key={g} className="text-[11px] leading-relaxed text-slate-500">
                      ・{g}
                    </li>
                  ))}
                </ul>
                <p className="mb-1 text-[11px] text-amber-300/70">
                  🎸 附 {u.drills.length} 個上琴應用練習
                </p>
                {p && (
                  <p className="text-[11px] font-mono text-slate-500">
                    最佳成績 {p.best}/{p.total}・已挑戰 {p.attempts} 輪
                  </p>
                )}
              </button>
            );
          })}

          {/* 綜合測驗卡片 */}
          <button
            onClick={() => finalUnlocked && startUnit(FINAL_UNIT)}
            disabled={!finalUnlocked}
            className={`rounded-xl border p-4 text-left transition-colors sm:col-span-2 ${
              finalUnlocked
                ? "border-amber-500/70 bg-amber-500/10 hover:border-amber-400"
                : "cursor-not-allowed border-slate-800 bg-slate-900/50"
            }`}
          >
            <div className="mb-1 flex items-center justify-between gap-2">
              <span
                className={`font-bold ${
                  finalUnlocked ? "text-amber-300" : "text-slate-500"
                }`}
              >
                {finalUnlocked ? "🏆" : "🔒"} {FINAL_UNIT.title}
              </span>
              {isMastered(progress[FINAL_UNIT.id]) && (
                <span className="shrink-0 rounded-full bg-emerald-600/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                  ✓ 已通關
                </span>
              )}
            </div>
            <p
              className={`text-xs leading-relaxed ${
                finalUnlocked ? "text-slate-300" : "text-slate-600"
              }`}
            >
              {finalUnlocked
                ? FINAL_UNIT.tagline
                : `再精通 ${PRACTICE_UNITS.length - masteredCount} 個單元即可解鎖——每個觀念都確實學到，綜合測驗才有意義。`}
            </p>
            {progress[FINAL_UNIT.id] && finalUnlocked && (
              <p className="mt-2 text-[11px] font-mono text-slate-500">
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
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">
        <p className="mb-2 text-sm text-slate-400">
          {unit.emoji} {unit.title}・本輪成績
        </p>
        <p className="mb-2 text-5xl font-extrabold text-amber-400">
          {score}{" "}
          <span className="text-2xl text-slate-500">/ {questions.length}</span>
        </p>
        {mastered && (
          <p className="mb-2 text-sm font-semibold text-emerald-400">
            ✓ 達到精通標準（{Math.round(MASTERY_RATIO * 100)}%）
          </p>
        )}
        <p className="mb-6 text-slate-300">
          {resultMessage(unit, score, questions.length)}
        </p>

        {unit.drills.length > 0 && (
          <div className="mb-8 rounded-xl bg-slate-800/60 p-4 text-left">
            <p className="mb-3 text-sm font-bold text-amber-300">
              🎸 上琴應用：把這個觀念搬到指板上
            </p>
            <ol className="space-y-3">
              {unit.drills.map((d, i) => (
                <li key={d.title} className="text-sm">
                  <span className="font-semibold text-slate-100">
                    {i + 1}. {d.title}
                  </span>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-400">
                    {d.how}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        )}

        <div className="flex justify-center gap-3">
          <button
            onClick={() => startUnit(unit)}
            className="rounded-lg bg-amber-500 px-6 py-2.5 font-semibold text-slate-950 transition-colors hover:bg-amber-400"
          >
            再練一輪
          </button>
          <button
            onClick={backToMenu}
            className="rounded-lg bg-slate-700 px-6 py-2.5 font-semibold text-slate-100 transition-colors hover:bg-slate-600"
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
      <div className="mb-2 flex items-baseline justify-between text-sm text-slate-400">
        <button
          onClick={backToMenu}
          className="text-slate-400 transition-colors hover:text-amber-300"
        >
          ← 單元列表
        </button>
        <span className="font-semibold text-slate-300">
          {unit.emoji} {unit.title}
        </span>
        <span>
          第 {index + 1} / {questions.length} 題・得分{" "}
          <span className="font-bold text-amber-400">{score}</span>
        </span>
      </div>
      <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full bg-amber-500 transition-all"
          style={{
            width: `${((index + (answered ? 1 : 0)) / questions.length) * 100}%`,
          }}
        />
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="mb-5 text-lg font-bold leading-relaxed text-slate-100">
          {q.prompt}
        </h2>

        <div className="grid gap-2 sm:grid-cols-2">
          {q.options.map((opt, i) => {
            let style = "bg-slate-800 text-slate-200 hover:bg-slate-700";
            if (answered) {
              if (i === q.answerIndex) {
                style = "bg-emerald-600/80 text-white ring-1 ring-emerald-400";
              } else if (i === chosen) {
                style = "bg-rose-600/80 text-white ring-1 ring-rose-400";
              } else {
                style = "bg-slate-800/50 text-slate-500";
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
          <div className="mt-5 rounded-lg bg-slate-800/60 p-4">
            <p className="mb-1 font-semibold">
              {chosen === q.answerIndex ? (
                <span className="text-emerald-400">✅ 答對了！</span>
              ) : (
                <span className="text-rose-400">
                  ❌ 正確答案是 {q.options[q.answerIndex]}
                </span>
              )}
            </p>
            <p className="text-sm leading-relaxed text-slate-300">{q.explanation}</p>
            <div className="mt-3 flex items-center justify-between gap-3">
              {q.soundMidis ? (
                <button
                  onClick={() => playMidiNotes(q.soundMidis!, q.soundStyle)}
                  className="rounded-lg bg-slate-700 px-4 py-1.5 text-sm font-medium text-slate-100 transition-colors hover:bg-slate-600"
                >
                  ♪ 聽聽 {q.soundLabel}
                </button>
              ) : (
                <span />
              )}
              <button
                onClick={next}
                className="rounded-lg bg-amber-500 px-6 py-1.5 font-semibold text-slate-950 transition-colors hover:bg-amber-400"
              >
                {isLast ? "看成績" : "下一題 →"}
              </button>
            </div>
          </div>
        )}
      </div>

      {unit.drills.length > 0 && (
        <details className="mt-4 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
          <summary className="cursor-pointer text-sm font-semibold text-amber-300">
            🎸 上琴應用練習（{unit.drills.length} 個）——答完題拿起吉他做
          </summary>
          <ol className="mt-3 space-y-3">
            {unit.drills.map((d, i) => (
              <li key={d.title} className="text-sm">
                <span className="font-semibold text-slate-100">
                  {i + 1}. {d.title}
                </span>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-400">
                  {d.how}
                </p>
              </li>
            ))}
          </ol>
        </details>
      )}

      <p className="mt-4 text-center text-xs text-slate-500">{unit.tagline}</p>
    </div>
  );
}
