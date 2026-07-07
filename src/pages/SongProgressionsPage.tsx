import { useEffect, useRef, useState } from "react";
import type { Genre, Progression } from "../data/progressions";
import { PROGRESSIONS } from "../data/progressions";
import { findShapeForName } from "../data/chordLookup";
import { playChord } from "../audio/audioEngine";
import { ChordDiagram } from "../components/fretboard/ChordDiagram";

const GENRE_LABELS: Record<Genre, string> = {
  rock: "經典搖滾",
  blues: "藍調",
  punk: "龐克",
  "pop-rock": "流行搖滾",
  metal: "金屬",
};

/**
 * 歌曲進行：經典搖滾和弦進行資料庫，
 * 可依 BPM 循環播放、跟著亮起的小節換和弦。
 */
export function SongProgressionsPage() {
  const [selected, setSelected] = useState<Progression>(PROGRESSIONS[0]);
  const [playingBar, setPlayingBar] = useState<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const activeRef = useRef(false);

  const stop = () => {
    activeRef.current = false;
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setPlayingBar(null);
  };

  const play = () => {
    stop();
    activeRef.current = true;
    const barMs = (4 * 60 * 1000) / selected.bpm;
    let bar = 0;
    const tick = () => {
      const index = bar % selected.chords.length;
      const shape = findShapeForName(selected.chords[index]);
      setPlayingBar(index);
      playChord(shape, "strum");
      // 第三拍補一刷，比較有律動感
      window.setTimeout(() => {
        if (activeRef.current) playChord(shape, "strum");
      }, barMs / 2);
      bar++;
    };
    tick();
    timerRef.current = window.setInterval(tick, barMs);
  };

  const selectProgression = (p: Progression) => {
    stop();
    setSelected(p);
  };

  // 離開頁面時停止播放
  useEffect(() => stop, []);

  const isPlaying = playingBar !== null;
  const uniqueChords = [...new Set(selected.chords)];

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
              {p.romanNumerals.slice(0, 4).join(" – ")}
              {p.romanNumerals.length > 4 && " …"}
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
              {selected.key} 調 · {selected.bpm} BPM
            </span>
          </div>
          <p className="mb-4 text-sm leading-relaxed text-slate-300">
            {selected.description}
          </p>

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
              一小節一個和弦，循環播放
            </span>
          </div>

          {/* 小節時間軸 */}
          <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {selected.chords.map((chord, i) => (
              <div
                key={i}
                className={`rounded-lg border px-3 py-2 text-center transition-colors ${
                  playingBar === i
                    ? "border-amber-500 bg-amber-500/15"
                    : "border-slate-800 bg-slate-950/50"
                }`}
              >
                <p className="font-mono text-[10px] text-slate-500">
                  {selected.romanNumerals[i]}
                </p>
                <p
                  className={`font-bold ${
                    playingBar === i ? "text-amber-300" : "text-slate-200"
                  }`}
                >
                  {chord}
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
                playingBar !== null && selected.chords[playingBar] === chord;
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
