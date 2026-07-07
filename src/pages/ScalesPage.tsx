import { useState } from "react";
import { SCALES } from "../data/scales";
import { noteToPc, spellChordTones } from "../data/theory";
import { playMidiNotes } from "../audio/audioEngine";
import { Fretboard } from "../components/fretboard/Fretboard";

const ROOT_OPTIONS = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
];

/**
 * 音階教學：選根音與音階，在全指板上高亮音階音，
 * 可切換級數/音名顯示、點音試聽、播放整條音階。
 */
export function ScalesPage() {
  const [root, setRoot] = useState("A");
  const [scaleId, setScaleId] = useState("minor-pentatonic");
  const [showDegrees, setShowDegrees] = useState(true);

  const scale = SCALES.find((s) => s.id === scaleId)!;
  const rootPc = noteToPc(root);
  const tones = spellChordTones(root, scale.intervals);

  const playScale = () => {
    // 從低音把位的根音往上彈一個八度
    const rootMidi = 40 + ((rootPc - 4 + 12) % 12);
    playMidiNotes(
      [...scale.intervals, 12].map((s) => rootMidi + s),
      "arpeggio",
    );
  };

  return (
    <div className="flex flex-col gap-5">
      {/* 根音選擇 */}
      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-300">根音</h3>
        <div className="flex flex-wrap gap-1.5">
          {ROOT_OPTIONS.map((r) => (
            <button
              key={r}
              onClick={() => setRoot(r)}
              className={`w-10 rounded-lg py-1.5 font-mono text-sm font-semibold transition-colors ${
                root === r
                  ? "bg-amber-500 text-slate-950"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* 音階選擇 */}
      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-300">音階</h3>
        <div className="flex flex-wrap gap-2">
          {SCALES.map((s) => (
            <button
              key={s.id}
              onClick={() => setScaleId(s.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                scaleId === s.id
                  ? "bg-amber-500 text-slate-950"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* 指板 */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">
            <span className="text-amber-400">{root}</span> {scale.name}
          </h2>
          <div className="flex items-center gap-2">
            <div className="flex overflow-hidden rounded-lg border border-slate-700 text-xs">
              <button
                onClick={() => setShowDegrees(true)}
                className={`px-3 py-1.5 font-medium ${
                  showDegrees ? "bg-slate-700 text-amber-300" : "text-slate-400"
                }`}
              >
                級數
              </button>
              <button
                onClick={() => setShowDegrees(false)}
                className={`px-3 py-1.5 font-medium ${
                  !showDegrees ? "bg-slate-700 text-amber-300" : "text-slate-400"
                }`}
              >
                音名
              </button>
            </div>
            <button
              onClick={playScale}
              className="rounded-lg bg-amber-500 px-4 py-1.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-400"
            >
              ♪ 播放音階
            </button>
          </div>
        </div>
        <Fretboard
          rootPc={rootPc}
          intervals={scale.intervals}
          degrees={scale.degrees}
          showDegrees={showDegrees}
        />
        <p className="mt-2 text-xs text-slate-500">
          <span className="text-amber-400">●</span> 根音
          {scale.degrees.includes("♭5") && (
            <>
              　<span className="text-cyan-400">●</span> 藍調音（♭5）
            </>
          )}
          　點任一音可試聽。
        </p>
      </div>

      {/* 音階說明 */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="mb-3">
          <h3 className="mb-2 text-sm font-semibold text-slate-300">音階組成</h3>
          <div className="flex flex-wrap gap-1.5">
            {scale.intervals.map((s, i) => (
              <span
                key={s}
                className={`flex w-11 flex-col items-center rounded-md px-1 py-1 ${
                  i === 0
                    ? "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/50"
                    : scale.degrees[i] === "♭5"
                      ? "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/50"
                      : "bg-slate-800 text-slate-300"
                }`}
              >
                <span className="text-[10px] leading-none opacity-70">
                  {scale.degrees[i]}
                </span>
                <span className="font-mono text-sm font-semibold">{tones[i]}</span>
              </span>
            ))}
          </div>
        </div>
        <p className="mb-2 text-sm leading-relaxed text-slate-300">
          {scale.description}
        </p>
        <p className="text-sm leading-relaxed text-slate-400">
          🎸 <span className="font-semibold text-slate-300">怎麼用：</span>
          {scale.usage}
        </p>
      </div>
    </div>
  );
}
