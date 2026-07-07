import { useEffect, useRef, useState } from "react";
import type { Genre, Progression } from "../data/progressions";
import { PROGRESSIONS } from "../data/progressions";
import { findShapeForName } from "../data/chordLookup";
import { noteToPc, parseRoot, transposeChordName } from "../data/theory";
import { chordMidiNotes } from "../types/music";
import {
  getAudioTime,
  hatAt,
  kickAt,
  noteAt,
  playChord,
  snareAt,
  strumChordAt,
} from "../audio/audioEngine";
import { ChordDiagram } from "../components/fretboard/ChordDiagram";

const GENRE_LABELS: Record<Genre, string> = {
  jpop: "日系流行",
  rock: "經典搖滾",
  blues: "藍調",
  punk: "龐克",
  "pop-rock": "流行搖滾",
  metal: "金屬",
};

/** 移調器的 12 個調（實務常用拼法） */
const KEY_OPTIONS = [
  "C", "D♭", "D", "E♭", "E", "F", "F#", "G", "A♭", "A", "B♭", "B",
];
const useFlatsForKey = (key: string) => key.includes("♭") || key === "F";

type RhythmId = "long" | "eight" | "sixteen" | "arp";

interface StrumEvent {
  /** 在 step 內的拍點位置（0 = 第一拍） */
  t: number;
  gain: number;
  dir: "down" | "up";
}

const EIGHT_STRUMS: StrumEvent[] = Array.from({ length: 8 }, (_, k) => ({
  t: k * 0.5,
  gain: k % 2 === 0 ? 0.3 : 0.18,
  dir: "down",
}));

// 16 Beat：每 2 拍一組「下 下 上 ・上 下 上」的十六分刷法
const SIXTEEN_HALF: StrumEvent[] = [
  { t: 0, gain: 0.3, dir: "down" },
  { t: 0.5, gain: 0.18, dir: "down" },
  { t: 0.75, gain: 0.14, dir: "up" },
  { t: 1.25, gain: 0.14, dir: "up" },
  { t: 1.5, gain: 0.2, dir: "down" },
  { t: 1.75, gain: 0.14, dir: "up" },
];

const STRUM_PATTERNS: Record<Exclude<RhythmId, "arp">, StrumEvent[]> = {
  long: [
    { t: 0, gain: 0.3, dir: "down" },
    { t: 2, gain: 0.22, dir: "down" },
  ],
  eight: EIGHT_STRUMS,
  sixteen: [...SIXTEEN_HALF, ...SIXTEEN_HALF.map((e) => ({ ...e, t: e.t + 2 }))],
};

const RHYTHM_OPTIONS: { id: RhythmId; label: string }[] = [
  { id: "long", label: "長音" },
  { id: "eight", label: "8 Beat" },
  { id: "sixteen", label: "16 Beat" },
  { id: "arp", label: "琶音" },
];

/** 琶音順序：低→高→回到中間，循環 */
const arpeggioSequence = (tones: number[]) =>
  tones.length > 2 ? [...tones, ...tones.slice(1, -1).reverse()] : tones;

/** 色彩模式：把進行裡的純三和弦換成色彩和弦（教材練習 3-1） */
type ColorMode = "plain" | "seventh" | "add9";

const COLOR_OPTIONS: { id: ColorMode; label: string }[] = [
  { id: "plain", label: "原版" },
  { id: "seventh", label: "七和弦版" },
  { id: "add9", label: "add9 版" },
];

function colorize(chord: string, numeral: string, mode: ColorMode): string {
  if (mode === "plain" || chord.includes("/")) return chord;
  const root = parseRoot(chord);
  const suffix = chord.slice(root.length);
  if (suffix === "") {
    // V 級大三和弦升級成屬七，其餘大三和弦配 M7 / add9
    if (mode === "seventh") {
      return /^V(?!I)/.test(numeral) ? root + "7" : root + "maj7";
    }
    return root + "add9";
  }
  if (suffix === "m" && mode === "seventh") return root + "m7";
  return chord;
}

/**
 * 歌曲進行：日系＋歐美經典和弦進行資料庫，
 * 附 12 調移調器與節奏引擎（8/16 Beat、琶音、合成鼓組 backbeat）。
 */
export function SongProgressionsPage() {
  const [selected, setSelected] = useState<Progression>(PROGRESSIONS[0]);
  const [keyName, setKeyName] = useState(PROGRESSIONS[0].keyRoot);
  const [bpm, setBpm] = useState(PROGRESSIONS[0].bpm);
  const [rhythm, setRhythm] = useState<RhythmId>("eight");
  const [drumsOn, setDrumsOn] = useState(true);
  const [colorMode, setColorMode] = useState<ColorMode>("plain");
  const [modulate, setModulate] = useState(false);
  const [playingStep, setPlayingStep] = useState<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const activeRef = useRef(false);

  // 移調＋色彩處理後的 steps（delta = 0 時保留原名，才能用到資料庫的開放和弦按法）
  const delta = (noteToPc(keyName) - noteToPc(selected.keyRoot) + 12) % 12;
  const useFlats = useFlatsForKey(keyName);
  const steps = selected.steps.map((s) => ({
    ...s,
    chord: colorize(
      delta === 0 ? s.chord : transposeChordName(s.chord, delta, useFlats),
      s.numeral,
      colorMode,
    ),
  }));
  const uniqueChords = [...new Set(steps.map((s) => s.chord))];

  const stop = () => {
    activeRef.current = false;
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setPlayingStep(null);
  };

  const play = () => {
    stop();
    activeRef.current = true;
    const beatSec = 60 / bpm;
    const baseSteps = selected.steps;
    const baseDelta = delta;
    const baseKeyPc = noteToPc(keyName);
    let shift = 0; // 転調模式：每循環一輪升半音
    let idx = 0;
    let when = getAudioTime() + 0.12;

    const scheduleStep = () => {
      if (!activeRef.current) return;
      const i = idx % baseSteps.length;
      if (i === 0 && idx > 0 && modulate) {
        shift++;
        setKeyName(KEY_OPTIONS[(baseKeyPc + shift) % 12]);
      }
      const totalDelta = (baseDelta + shift) % 12;
      const flats = useFlatsForKey(KEY_OPTIONS[(baseKeyPc + shift) % 12]);
      const raw = baseSteps[i];
      const chordName = colorize(
        totalDelta === 0
          ? raw.chord
          : transposeChordName(raw.chord, totalDelta, flats),
        raw.numeral,
        colorMode,
      );
      const step = { ...raw, chord: chordName };
      const beats = step.beats ?? 4;
      const shape = findShapeForName(step.chord);
      setPlayingStep(i);

      if (rhythm === "arp") {
        const seq = arpeggioSequence(chordMidiNotes(shape));
        const count = beats * 2; // 八分音符
        for (let k = 0; k < count; k++) {
          noteAt(seq[k % seq.length], when + k * beatSec * 0.5, 0.22);
        }
      } else {
        for (const ev of STRUM_PATTERNS[rhythm]) {
          if (ev.t < beats) strumChordAt(shape, when + ev.t * beatSec, ev.gain, ev.dir);
        }
      }

      if (drumsOn) {
        for (let b = 0; b < beats; b += 2) kickAt(when + b * beatSec);
        for (let b = 1; b < beats; b += 2) snareAt(when + b * beatSec);
        const hatStep = rhythm === "sixteen" ? 0.25 : rhythm === "eight" ? 0.5 : 1;
        for (let t = 0; t < beats; t += hatStep) {
          hatAt(when + t * beatSec, t % 1 === 0 ? 0.11 : 0.06);
        }
      }

      const durMs = beats * beatSec * 1000;
      when += beats * beatSec;
      idx++;
      timerRef.current = window.setTimeout(scheduleStep, durMs);
    };
    scheduleStep();
  };

  const selectProgression = (p: Progression) => {
    stop();
    setSelected(p);
    setKeyName(p.keyRoot);
    setBpm(p.bpm);
  };

  // 離開頁面時停止播放
  useEffect(() => stop, []);

  const isPlaying = playingStep !== null;

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* 左側：進行清單 */}
      <div className="flex w-full shrink-0 flex-col gap-2 lg:w-72">
        {PROGRESSIONS.map((p) => (
          <button
            key={p.id}
            onClick={() => selectProgression(p)}
            className={`rounded-xl border p-3 text-left transition-colors ${
              selected.id === p.id
                ? "border-amber-500 bg-slate-800/80"
                : "border-slate-800 bg-slate-900 hover:border-slate-600"
            }`}
          >
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="font-bold text-slate-100">{p.title}</span>
              <span className="shrink-0 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
                {GENRE_LABELS[p.genre]}
              </span>
            </div>
            <p className="font-mono text-xs text-slate-400">
              {p.steps.slice(0, 4).map((s) => s.numeral).join(" – ")}
              {p.steps.length > 4 && " …"}
            </p>
          </button>
        ))}
      </div>

      {/* 右側：進行詳細 */}
      <div className="flex-1">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="mb-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="text-2xl font-extrabold text-amber-400">
              {selected.title}
            </h2>
            <span className="text-sm text-slate-400">
              {keyName}
              {selected.keyQuality === "minor" ? "m" : ""} 調 · {bpm} BPM
            </span>
          </div>
          <p className="mb-4 text-sm leading-relaxed text-slate-300">
            {selected.description}
          </p>

          {/* 移調器 */}
          <div className="mb-3">
            <span className="mb-1.5 block text-xs font-semibold text-slate-400">
              Key（移調練習：先在原調練熟，再移到別的調）
            </span>
            <div className="flex flex-wrap gap-1.5">
              {KEY_OPTIONS.map((k) => (
                <button
                  key={k}
                  onClick={() => {
                    stop();
                    setKeyName(k);
                  }}
                  className={`w-10 rounded-lg py-1 font-mono text-sm font-semibold transition-colors ${
                    keyName === k
                      ? "bg-amber-500 text-slate-950"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>

          {/* 節奏控制 */}
          <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex gap-1.5">
              {RHYTHM_OPTIONS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    stop();
                    setRhythm(r.id);
                  }}
                  className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                    rhythm === r.id
                      ? "bg-amber-500 text-slate-950"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                stop();
                setDrumsOn(!drumsOn);
              }}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                drumsOn
                  ? "bg-slate-700 text-amber-300"
                  : "bg-slate-800 text-slate-500"
              }`}
            >
              🥁 鼓組 {drumsOn ? "開" : "關"}
            </button>
            <button
              onClick={() => {
                stop();
                setModulate(!modulate);
              }}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                modulate
                  ? "bg-slate-700 text-amber-300"
                  : "bg-slate-800 text-slate-500"
              }`}
              title="最後副歌升 Key 的経典手法：每循環一輪全體升半音"
            >
              転調↑ {modulate ? "開" : "關"}
            </button>
            <label className="flex items-center gap-2 text-xs text-slate-400">
              BPM
              <input
                type="range"
                min={60}
                max={200}
                value={bpm}
                onChange={(e) => {
                  stop();
                  setBpm(Number(e.target.value));
                }}
                className="w-32 accent-amber-500"
              />
              <span className="w-8 font-mono text-slate-300">{bpm}</span>
            </label>
          </div>

          {/* 色彩和弦切換（教材練習 3-1） */}
          <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="text-xs font-semibold text-slate-400">色彩：</span>
            <div className="flex gap-1.5">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    stop();
                    setColorMode(c.id);
                  }}
                  className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                    colorMode === c.id
                      ? "bg-amber-500 text-slate-950"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-500">
              把三和弦換成 M7／add9 聽顏色差：M7 都會微苦、add9 明亮現代（V 級升級成屬七）。
            </span>
          </div>

          <div className="mb-5 flex items-center gap-3">
            <button
              onClick={isPlaying ? stop : play}
              className={`rounded-lg px-8 py-2 font-semibold transition-colors ${
                isPlaying
                  ? "bg-rose-500 text-white hover:bg-rose-400"
                  : "bg-amber-500 text-slate-950 hover:bg-amber-400"
              }`}
            >
              {isPlaying ? "⏹ 停止" : "▶ 播放"}
            </button>
            <span className="text-xs text-slate-500">
              Backbeat：小鼓固定在 2、4 拍；転調開啟時每循環一輪升半音。
            </span>
          </div>

          {/* 小節時間軸 */}
          <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {steps.map((step, i) => (
              <div
                key={i}
                className={`rounded-lg border px-3 py-2 text-center transition-colors ${
                  playingStep === i
                    ? "border-amber-500 bg-amber-500/15"
                    : "border-slate-800 bg-slate-950/50"
                }`}
              >
                <p className="font-mono text-[10px] text-slate-500">
                  {step.numeral}
                  {step.beats && step.beats !== 4 ? ` · ${step.beats}拍` : ""}
                </p>
                <p
                  className={`font-bold ${
                    playingStep === i ? "text-amber-300" : "text-slate-200"
                  }`}
                >
                  {step.chord}
                </p>
              </div>
            ))}
          </div>

          {/* 用到的和弦按法 */}
          <h3 className="mb-2 text-sm font-semibold text-slate-300">
            用到的和弦（點擊試聽）
          </h3>
          <div className="mb-5 flex flex-wrap gap-3">
            {uniqueChords.map((chord) => {
              const shape = findShapeForName(chord);
              const activeChord =
                playingStep !== null && steps[playingStep].chord === chord;
              return (
                <button
                  key={chord}
                  onClick={() => playChord(shape, "strum")}
                  className={`flex flex-col items-center rounded-xl border p-2 transition-colors ${
                    activeChord
                      ? "border-amber-500 bg-amber-500/10"
                      : "border-slate-800 bg-slate-950/50 hover:border-slate-600"
                  }`}
                >
                  <span className="mb-1 text-sm font-bold text-slate-100">
                    {chord}
                  </span>
                  <ChordDiagram shape={shape} width={96} />
                </button>
              );
            })}
          </div>

          <div className="rounded-lg bg-slate-800/60 p-4">
            <p className="mb-1 text-sm leading-relaxed text-slate-300">
              🎸 <span className="font-semibold">Solo 建議：</span>
              {selected.soloTip}
            </p>
            {selected.examples && (
              <p className="text-sm leading-relaxed text-slate-400">
                🎵 <span className="font-semibold text-slate-300">代表曲風：</span>
                {selected.examples}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
