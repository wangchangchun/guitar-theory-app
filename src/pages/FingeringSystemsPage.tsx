import { useState } from "react";
import { SCALES } from "../data/scales";
import { buildPattern } from "../data/patterns";
import { noteToPc, spellChordTones } from "../data/theory";
import { Fretboard } from "../components/fretboard/Fretboard";
import { getAudioTime, noteAt } from "../audio/audioEngine";

const ROOT_OPTIONS = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
];

const scaleOf = (id: string) => SCALES.find((s) => s.id === id)!;

function playPattern(midis: number[]) {
  const start = getAudioTime() + 0.1;
  midis.forEach((m, i) => noteAt(m, start + i * 0.17, 0.25));
}

/**
 * 指型把位：吉他指板的兩大指型系統——
 * 五聲把位（每弦 2 音 × 5 個把位）與一弦三音 3NPS（每弦 3 音 × 7 個把位）。
 * 指型由演算法即時產生：第 k 把位從第六弦第 k 個音階音出發、每弦取固定顆數上行。
 */
export function FingeringSystemsPage() {
  const [root, setRoot] = useState("A");
  const [pentScaleId, setPentScaleId] = useState("minor-pentatonic");
  const [pentBox, setPentBox] = useState(0);
  const [npsScaleId, setNpsScaleId] = useState("major");
  const [npsPos, setNpsPos] = useState(0);

  const rootPc = noteToPc(root);

  const pentScale = scaleOf(pentScaleId);
  const pentPattern = buildPattern(
    rootPc, pentScale.intervals, pentScale.degrees, pentBox, 2,
  );
  const pentTones = spellChordTones(root, pentScale.intervals);
  const pentStart = pentTones[pentBox];

  const npsScale = scaleOf(npsScaleId);
  const npsPattern = buildPattern(
    rootPc, npsScale.intervals, npsScale.degrees, npsPos, 3,
  );
  const npsTones = spellChordTones(root, npsScale.intervals);
  const npsStart = npsTones[npsPos];

  const fretCountFor = (maxFret: number) => Math.max(15, maxFret);

  const positionButtons = (
    count: number,
    active: number,
    onPick: (i: number) => void,
  ) => (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs font-semibold text-slate-400">把位：</span>
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          onClick={() => onPick(i)}
          className={`w-9 rounded-lg py-1 text-xs font-semibold transition-colors ${
            active === i
              ? "bg-amber-500 text-slate-950"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          {i + 1}
        </button>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      {/* 教學說明 */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <p className="mb-2 text-sm leading-relaxed text-slate-300">
          同一個音在指板上會出現很多次，直接背整片指板太難——所以吉他手把音階切成
          <span className="mx-1 text-amber-300">「每弦固定幾個音」的形狀（把位／指型）</span>
          來記。兩大系統：
          <span className="mx-1 font-semibold text-amber-300">五聲把位</span>
          每弦 2 音、共 5 個把位；
          <span className="mx-1 font-semibold text-sky-300">一弦三音（3NPS）</span>
          每弦 3 音、共 7 個把位。
        </p>
        <ul className="grid gap-x-6 gap-y-1 text-xs leading-relaxed text-slate-400 sm:grid-cols-2">
          <li>・共同規則：第 N 把位就從第六弦的「音階第 N 個音」出發</li>
          <li>・相鄰把位共用一半的音——沿一條弦滑一格就無縫換把位</li>
          <li>・五聲 box 好背好彈，是即興的地基；第 1 把位與 E 手型封閉和弦重疊</li>
          <li>・3NPS 每弦音數固定 → 撥序與捶勾規律，速彈／legato 的標配</li>
        </ul>
      </div>

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

      {/* 五聲把位 */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">
            🎯 五聲把位：<span className="text-amber-400">{root} {pentScale.name}</span>
            <span className="ml-2 text-sm font-normal text-slate-400">
              每弦 2 音 × 5 個把位
            </span>
          </h2>
          <div className="flex items-center gap-2">
            <div className="flex overflow-hidden rounded-lg border border-slate-700 text-xs">
              <button
                onClick={() => { setPentScaleId("minor-pentatonic"); setPentBox(0); }}
                className={`px-3 py-1.5 font-medium ${
                  pentScaleId === "minor-pentatonic"
                    ? "bg-slate-700 text-amber-300"
                    : "text-slate-400"
                }`}
              >
                小調五聲
              </button>
              <button
                onClick={() => { setPentScaleId("major-pentatonic"); setPentBox(0); }}
                className={`px-3 py-1.5 font-medium ${
                  pentScaleId === "major-pentatonic"
                    ? "bg-slate-700 text-amber-300"
                    : "text-slate-400"
                }`}
              >
                大調五聲
              </button>
            </div>
            <button
              onClick={() => playPattern(pentPattern.map((n) => n.midi))}
              className="rounded-lg bg-amber-500 px-4 py-1.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-400"
            >
              ▶ 播放把位
            </button>
          </div>
        </div>

        <div className="mb-3">{positionButtons(5, pentBox, setPentBox)}</div>

        <Fretboard
          rootPc={rootPc}
          intervals={pentScale.intervals}
          degrees={pentScale.degrees}
          showDegrees
          pattern={pentPattern}
          fretCount={fretCountFor(Math.max(...pentPattern.map((n) => n.fret)))}
        />
        <p className="mt-2 text-xs leading-relaxed text-slate-500">
          第 {pentBox + 1} 把位從第六弦的音階第 {pentBox + 1} 個音
          <span className="mx-1 font-mono text-amber-300">{pentStart}</span>
          出發（{root} {pentScale.name}＝{pentTones.join("·")}）。變暗的點是同一音階的其他音——
          看得出把位跟把位怎麼互相咬合。
          {pentScaleId === "minor-pentatonic" && pentBox === 0 && (
            <>
              　💡 第 1 把位跟第六弦根音的 E 手型封閉和弦重疊：和弦按著不動，solo 音就在手邊。
            </>
          )}
        </p>
      </div>

      {/* 一弦三音 */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">
            ⚡ 一弦三音（3NPS）：
            <span className="text-sky-300">{root} {npsScale.name}</span>
            <span className="ml-2 text-sm font-normal text-slate-400">
              每弦 3 音 × 7 個把位
            </span>
          </h2>
          <div className="flex items-center gap-2">
            <div className="flex overflow-hidden rounded-lg border border-slate-700 text-xs">
              <button
                onClick={() => { setNpsScaleId("major"); setNpsPos(0); }}
                className={`px-3 py-1.5 font-medium ${
                  npsScaleId === "major" ? "bg-slate-700 text-amber-300" : "text-slate-400"
                }`}
              >
                大調
              </button>
              <button
                onClick={() => { setNpsScaleId("natural-minor"); setNpsPos(0); }}
                className={`px-3 py-1.5 font-medium ${
                  npsScaleId === "natural-minor"
                    ? "bg-slate-700 text-amber-300"
                    : "text-slate-400"
                }`}
              >
                自然小調
              </button>
            </div>
            <button
              onClick={() => playPattern(npsPattern.map((n) => n.midi))}
              className="rounded-lg bg-amber-500 px-4 py-1.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-400"
            >
              ▶ 播放把位
            </button>
          </div>
        </div>

        <div className="mb-3">{positionButtons(7, npsPos, setNpsPos)}</div>

        <Fretboard
          rootPc={rootPc}
          intervals={npsScale.intervals}
          degrees={npsScale.degrees}
          showDegrees
          pattern={npsPattern}
          fretCount={fretCountFor(Math.max(...npsPattern.map((n) => n.fret)))}
        />
        <p className="mt-2 text-xs leading-relaxed text-slate-500">
          第 {npsPos + 1} 把位從第六弦的音階第 {npsPos + 1} 個音
          <span className="mx-1 font-mono text-sky-300">{npsStart}</span>
          出發（{root} {npsScale.name}＝{npsTones.join("·")}）。
          每弦固定 3 音，換弦點與撥序完全規律——交替撥弦或捶勾（legato）
          的動作在每條弦上都一樣，因此是速彈樂手的預設系統；代價是常需要跨 5–6 格的手指伸展。
        </p>
      </div>

      {/* 兩系統比較 */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <h3 className="mb-2 text-sm font-semibold text-slate-300">怎麼選？</h3>
        <ul className="grid gap-x-6 gap-y-1 text-xs leading-relaxed text-slate-400 sm:grid-cols-2">
          <li>
            ・<span className="text-amber-300">五聲 box</span>
            ：藍調／搖滾即興的預設。音少不出錯、推弦揉弦空間大，先把 5 個把位串起來。
          </li>
          <li>
            ・<span className="text-sky-300">3NPS</span>
            ：七聲音階（大調／小調／調式）的高速公路。跑句、模進、legato 首選。
          </li>
          <li>・兩套用的是同一組音——差別只在「每弦切幾個音」，不是不同的樂理。</li>
          <li>
            ・實戰常混用：骨架用五聲 box，經過句借 3NPS 的規律指型衝上去再回來。
          </li>
        </ul>
      </div>
    </div>
  );
}
