import type { ChordQuality } from "../../types/music";
import { QUALITY_LABELS } from "../../types/music";
import {
  FORMULA_LIST,
  intervalOf,
  spellChordTones,
  theoryChordMidis,
} from "../../data/theory";
import { playMidiNotes } from "../../audio/audioEngine";

/** 大三和弦的音程集合，用來標記「哪個音被動過了」 */
const MAJOR_INTERVALS = new Set([0, 4, 7]);

interface Props {
  root: string;
  currentQuality: ChordQuality;
}

/**
 * 和弦變化教室：以選中和弦的根音為基準，
 * 展示同一個根音如何變化出 8 種和弦（m / 5 / sus / 7 / maj7 / m7）。
 */
export function ChordFamilySection({ root, currentQuality }: Props) {
  return (
    <section className="mt-8">
      <h2 className="mb-2 text-lg font-bold text-slate-100">
        🎓 和弦變化教室：<span className="text-amber-400">{root} 家族</span>
      </h2>
      <p className="mb-4 text-sm leading-relaxed text-slate-400">
        和弦是從根音出發、按「級數」往上疊音蓋出來的：大三和弦的公式是
        <span className="mx-1 font-mono text-amber-300">1 · 3 · 5</span>。
        只要動其中一個音、或再疊一個音，就會變出下面這些親戚——
        <span className="text-amber-300">黃色</span>
        標記就是與大三和弦不同的地方。點和弦名可以試聽比較。
      </p>

      <div className="divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-900">
        {FORMULA_LIST.map((f) => {
          const name = root + f.suffix;
          const tones = spellChordTones(root, f.intervals);
          const active = f.quality === currentQuality;
          return (
            <div
              key={f.quality}
              className={`flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 ${
                active ? "bg-amber-500/10" : ""
              }`}
            >
              <button
                onClick={() => playMidiNotes(theoryChordMidis(root, f.intervals))}
                className="flex w-28 flex-col items-center rounded-lg bg-slate-800 px-2 py-1.5 transition-colors hover:bg-slate-700"
                title="點擊試聽"
              >
                <span className="font-bold text-amber-300">♪ {name}</span>
                <span className="text-[10px] text-slate-500">
                  {QUALITY_LABELS[f.quality]}
                </span>
              </button>

              <div className="flex gap-1.5">
                {f.intervals.map((s, i) => {
                  const iv = intervalOf(s);
                  const changed = !MAJOR_INTERVALS.has(s);
                  return (
                    <span
                      key={s}
                      className={`flex w-11 flex-col items-center rounded-md px-1 py-1 ${
                        changed
                          ? "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/50"
                          : "bg-slate-800 text-slate-300"
                      }`}
                      title={iv.name}
                    >
                      <span className="text-[10px] leading-none opacity-70">
                        {iv.degree}
                      </span>
                      <span className="font-mono text-sm font-semibold">
                        {tones[i]}
                      </span>
                    </span>
                  );
                })}
              </div>

              <p className="min-w-48 flex-1 text-xs leading-relaxed text-slate-400">
                {f.changeText}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
