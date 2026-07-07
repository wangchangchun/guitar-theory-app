import { useState } from "react";
import type { ChordQuality } from "../types/music";
import { QUALITY_LABELS } from "../types/music";
import {
  CHORD_FORMULAS,
  FORMULA_LIST,
  INTERVALS,
  intervalOf,
  spellChordTones,
  theoryChordMidis,
} from "../data/theory";
import { playMidiNotes } from "../audio/audioEngine";

/**
 * 樂理練習：隨機出題測驗和弦組成音、音程、和弦變化，
 * 確保「和弦變化教室」教的觀念真的有吸收。
 */

interface Question {
  prompt: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  soundMidis?: number[];
  soundLabel?: string;
}

const ROOTS = ["C", "D", "E", "F", "G", "A", "B"] as const;

function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: readonly T[], n: number): T[] {
  return shuffle(arr).slice(0, n);
}

function withOptions(correct: string, distractors: string[]) {
  const options = shuffle([correct, ...distractors]);
  return { options, answerIndex: options.indexOf(correct) };
}

/** 題型一：說出和弦的組成音 */
function genTonesQuestion(): Question {
  const root = pick(ROOTS);
  const f = pick(FORMULA_LIST);
  const name = root + f.suffix;
  const tones = spellChordTones(root, f.intervals);
  const distractors = pickN(
    FORMULA_LIST.filter((x) => x.quality !== f.quality),
    3,
  ).map((x) => spellChordTones(root, x.intervals).join(" · "));
  const degrees = f.intervals.map((s) => intervalOf(s).degree).join("·");
  return {
    prompt: `${name}（${QUALITY_LABELS[f.quality]}）的組成音是？`,
    ...withOptions(tones.join(" · "), distractors),
    explanation: `${name} ＝ ${f.buildText}，級數 ${degrees}，也就是 ${tones.join("·")}。`,
    soundMidis: theoryChordMidis(root, f.intervals),
    soundLabel: name,
  };
}

/** 題型二：辨認音程 */
function genIntervalQuestion(): Question {
  const root = pick(ROOTS);
  const candidates = INTERVALS.filter((i) => i.semitones !== 0);
  const iv = pick(candidates);
  const target = spellChordTones(root, [iv.semitones])[0];
  const distractors = pickN(
    candidates.filter((x) => x.semitones !== iv.semitones),
    3,
  ).map((x) => x.name);
  return {
    prompt: `從 ${root} 往上到 ${target}（相距 ${iv.semitones} 個半音）是什麼音程？`,
    ...withOptions(iv.name, distractors),
    explanation:
      `${iv.semitones} 個半音是${iv.name}。速記：大二度 2、小三度 3、大三度 4、` +
      `完全四度 5、完全五度 7、小七度 10、大七度 11 個半音。`,
  };
}

/** 題型三：和弦變化（C 怎麼變成 Cm / C7 / Csus4…） */
function genTransformQuestion(): Question {
  const root = pick(ROOTS);
  const maj = spellChordTones(root, CHORD_FORMULAS.major.intervals);
  const kinds: ChordQuality[] = [
    "minor", "sus2", "sus4", "dominant7", "major7", "minor7", "power",
  ];
  const kind = pick(kinds);
  const f = CHORD_FORMULAS[kind];
  const resultName = root + f.suffix;
  const resultTones = spellChordTones(root, f.intervals);

  let prompt: string;
  let distractors: string[];
  switch (kind) {
    case "minor":
      prompt = `${root} 和弦（${maj.join("·")}）的大三度 ${maj[1]} 降半音，會變成什麼和弦？`;
      distractors = [`${root}sus2`, `${root}7`, `${root}5`];
      break;
    case "sus2":
      prompt = `把 ${root} 和弦的三度音 ${maj[1]} 換成大二度，會變成什麼和弦？`;
      distractors = [`${root}m`, `${root}sus4`, `${root}5`];
      break;
    case "sus4":
      prompt = `把 ${root} 和弦的三度音 ${maj[1]} 往上半音換成完全四度，會變成什麼和弦？`;
      distractors = [`${root}sus2`, `${root}m`, `${root}maj7`];
      break;
    case "dominant7":
      prompt = `在 ${root} 和弦（1·3·5）上再疊一個小七度，會變成什麼和弦？`;
      distractors = [`${root}maj7`, `${root}m7`, `${root}sus4`];
      break;
    case "major7":
      prompt = `在 ${root} 和弦（1·3·5）上再疊一個大七度，會變成什麼和弦？`;
      distractors = [`${root}7`, `${root}m7`, `${root}m`];
      break;
    case "minor7":
      prompt = `在 ${root}m 和弦（1·♭3·5）上再疊一個小七度，會變成什麼和弦？`;
      distractors = [`${root}7`, `${root}maj7`, `${root}sus2`];
      break;
    case "power":
      prompt = `拿掉 ${root} 和弦的三度音、只留下 1 和 5，會變成什麼和弦？`;
      distractors = [`${root}sus2`, `${root}m`, `${root}sus4`];
      break;
    default:
      throw new Error(`未支援的變化題型：${kind}`);
  }

  return {
    prompt,
    ...withOptions(resultName, distractors),
    explanation: `${resultName} ＝ ${f.buildText}（${resultTones.join("·")}）。${f.changeText}`,
    soundMidis: theoryChordMidis(root, f.intervals),
    soundLabel: resultName,
  };
}

/** 題型四：由組成音反推和弦 */
function genIdentifyQuestion(): Question {
  const root = pick(ROOTS);
  const f = pick(FORMULA_LIST);
  const name = root + f.suffix;
  const tones = spellChordTones(root, f.intervals);
  const distractors = pickN(
    FORMULA_LIST.filter((x) => x.quality !== f.quality),
    3,
  ).map((x) => root + x.suffix);
  return {
    prompt: `組成音 ${tones.join(" · ")} 疊出來的是什麼和弦？`,
    ...withOptions(name, distractors),
    explanation: `${name}（${QUALITY_LABELS[f.quality]}）＝ ${f.buildText}。`,
    soundMidis: theoryChordMidis(root, f.intervals),
    soundLabel: name,
  };
}

function buildRound(): Question[] {
  const gens = [
    genTonesQuestion, genTonesQuestion,
    genIntervalQuestion, genIntervalQuestion,
    genTransformQuestion, genTransformQuestion,
    genIdentifyQuestion, genIdentifyQuestion,
  ];
  const questions: Question[] = [];
  for (const gen of shuffle(gens)) {
    let q = gen();
    let guard = 0;
    while (questions.some((x) => x.prompt === q.prompt) && guard++ < 10) {
      q = gen();
    }
    questions.push(q);
  }
  return questions;
}

function scoreMessage(score: number, total: number): string {
  const ratio = score / total;
  if (ratio === 1) return "滿分！樂理之魂已覺醒，快回指板上驗證吧 🤘";
  if (ratio >= 0.75) return "很穩！剩下的盲點回「和弦變化教室」補一下就完美了。";
  if (ratio >= 0.5) return "有基礎了！多注意三度音與七度音的差別。";
  return "沒關係，回和弦圖鑑看看每個和弦的音程結構，再來挑戰！";
}

export function PracticePage() {
  const [questions, setQuestions] = useState<Question[]>(buildRound);
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

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
      setDone(true);
      return;
    }
    setIndex(index + 1);
    setChosen(null);
  };

  const restart = () => {
    setQuestions(buildRound());
    setIndex(0);
    setChosen(null);
    setScore(0);
    setDone(false);
  };

  if (done) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">
        <p className="mb-2 text-sm text-slate-400">本輪成績</p>
        <p className="mb-4 text-5xl font-extrabold text-amber-400">
          {score} <span className="text-2xl text-slate-500">/ {questions.length}</span>
        </p>
        <p className="mb-8 text-slate-300">{scoreMessage(score, questions.length)}</p>
        <button
          onClick={restart}
          className="rounded-lg bg-amber-500 px-8 py-2.5 font-semibold text-slate-950 transition-colors hover:bg-amber-400"
        >
          再來一輪
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* 進度列 */}
      <div className="mb-2 flex items-baseline justify-between text-sm text-slate-400">
        <span>
          第 {index + 1} / {questions.length} 題
        </span>
        <span>
          目前得分 <span className="font-bold text-amber-400">{score}</span>
        </span>
      </div>
      <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full bg-amber-500 transition-all"
          style={{ width: `${((index + (answered ? 1 : 0)) / questions.length) * 100}%` }}
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
                  onClick={() => playMidiNotes(q.soundMidis!)}
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

      <p className="mt-4 text-center text-xs text-slate-500">
        題目涵蓋：和弦組成音 · 音程辨認 · 和弦變化 · 聽組成音認和弦
      </p>
    </div>
  );
}
