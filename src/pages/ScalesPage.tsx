import { useState } from "react";
import { SCALES } from "../data/scales";
import { noteToPc, spellChordTones } from "../data/theory";
import { playMidiNotes } from "../audio/audioEngine";
import { Fretboard } from "../components/fretboard/Fretboard";
import { PageIntro } from "../components/PageIntro";

const ROOT_OPTIONS = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
];

/** 音階依難易度分組：新手照組別由上往下學 */
const SCALE_TIERS: { label: string; badge: string; ids: string[] }[] = [
  {
    label: "入門",
    badge: "bg-emerald-500/15 text-emerald-300",
    ids: ["minor-pentatonic", "major-pentatonic"],
  },
  {
    label: "核心",
    badge: "bg-sky-500/15 text-sky-300",
    ids: ["major", "natural-minor"],
  },
  {
    label: "進階",
    badge: "bg-amber-500/15 text-amber-300",
    ids: ["blues", "harmonic-minor"],
  },
  {
    label: "挑戰",
    badge: "bg-rose-500/15 text-rose-300",
    ids: ["dorian", "mixolydian"],
  },
];

/**
 * 音階教學：選根音與音階，在全指板上高亮音階音，
 * 可切換級數/音名顯示、點音試聽、播放整條音階。
 */
export function ScalesPage() {
  const [root, setRoot] = useState("A");
  const [scaleId, setScaleId] = useState("minor-pentatonic");
  const [showDegrees, setShowDegrees] = useState(true);
  const [position, setPosition] = useState<number | null>(null);

  const scale = SCALES.find((s) => s.id === scaleId)!;
  const rootPc = noteToPc(root);
  const tones = spellChordTones(root, scale.intervals);

  // 把位：以第六弦上的每個把位錨點音為起點，第 1 把位從根音出發、
  // 依琴格順序沿指板往上排列（音階指型每 12 格循環一次）
  const anchorIntervals = scale.positionAnchors ?? scale.intervals;
  const anchors = anchorIntervals
    .map((s) => ({ interval: s, fret: (rootPc + s - 4 + 12) % 12 }))
    .sort((a, b) => a.fret - b.fret);
  const rootIdx = anchors.findIndex((a) => a.interval === 0);
  const positions = anchors.map(
    (_, i) => anchors[(rootIdx + i) % anchors.length],
  );

  const activePos = position !== null ? positions[position] : null;
  const fretWindow = activePos
    ? { from: Math.max(0, activePos.fret - 1), to: activePos.fret + 3 }
    : null;

  const selectScale = (id: string) => {
    setScaleId(id);
    setPosition(null);
  };

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
      <PageIntro
        storageKey="scales"
        phase="階段 2 · 指板導航"
        what="把音階畫在整片指板上：看它由哪些音組成、每個把位長什麼樣、搖滾情境怎麼用。音階選單已按難易度分組，照順序學。"
        lessons={[
          {
            level: "入門",
            title: "第一條音階：小調五聲",
            learn:
              "用預設的 A＋小調五聲音階，按「♪ 播放音階」聽整條，切到「把位 1」只看第 5–8 格那段指型。",
            guitar:
              "在第 5–8 格跟彈第 1 把位，上行下行各三次，邊彈邊唱級數「1、♭3、4、5、♭7」。",
          },
          {
            level: "入門",
            title: "參考原點：大調音階",
            learn:
              "切到大調音階聽「Do Re Mi」——其他音階的 ♭3、♭7 都是相對它而言，先把它的聲音刻進耳朵。",
            guitar:
              "從第五弦第 3 格的 C 出發彈一個八度的 C 大調，邊彈邊唱音名 C-D-E-F-G-A-B-C。",
          },
          {
            level: "進階",
            title: "把位（Box）串接",
            learn:
              "回到小調五聲，用把位按鈕 1→2→3 逐段檢視：相鄰把位共用一半的音，這就是它們咬合的方式。",
            guitar:
              "第 1 把位彈到第一弦最高音，沿第一弦滑 3 格接第 2 把位往回下行——體驗滑音換把位。",
          },
          {
            level: "進階",
            title: "藍調音與調式的一音之差",
            learn:
              "切藍調音階看青色的 ♭5 藍調音；再比較自然小調與 Dorian——只差 ♭6 還原成 6。",
            guitar:
              "在小調五聲裡把 ♭5 當滑音經過（如第六弦 6 格滑 7 格）；彈 A 自然小調再把所有 F 改成 F#，聽 Dorian 的洋氣。",
          },
          {
            level: "挑戰",
            title: "和聲小調的拉力",
            learn: "切和聲小調：自然小調把 ♭7 升回 7，就為了讓 V7→Im 有回家的力量。",
            guitar:
              "彈 Am–E7–Am 循環，在 E7 那小節把所有 G 換成 G#——聽「回家」的力量瞬間變強。",
            chords: ["Am", "E7"],
          },
        ]}
        notes={[
          "右上可切換顯示「級數」或「音名」；級數＝該音與根音的音程關係",
          "想背「每弦精確按哪幾個音」的標準指型，到「指型把位」頁",
        ]}
      />

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

      {/* 音階選擇（依難易度分組） */}
      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-300">
          音階（照難易度由上往下學）
        </h3>
        <div className="flex flex-col gap-2">
          {SCALE_TIERS.map((tier) => (
            <div key={tier.label} className="flex flex-wrap items-center gap-2">
              <span
                className={`w-12 shrink-0 rounded-full px-2 py-0.5 text-center text-[11px] font-semibold ${tier.badge}`}
              >
                {tier.label}
              </span>
              {tier.ids.map((id) => {
                const s = SCALES.find((x) => x.id === id)!;
                return (
                  <button
                    key={s.id}
                    onClick={() => selectScale(s.id)}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                      scaleId === s.id
                        ? "bg-amber-500 text-slate-950"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {s.name}
                  </button>
                );
              })}
            </div>
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
        {/* 把位選擇 */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">把位：</span>
          <button
            onClick={() => setPosition(null)}
            className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
              position === null
                ? "bg-amber-500 text-slate-950"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            全部
          </button>
          {positions.map((p, i) => (
            <button
              key={p.interval}
              onClick={() => setPosition(i)}
              className={`w-9 rounded-lg py-1 text-xs font-semibold transition-colors ${
                position === i
                  ? "bg-amber-500 text-slate-950"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {i + 1}
            </button>
          ))}
          {activePos && fretWindow && (
            <span className="text-xs text-slate-500">
              第 {position! + 1} 把位：
              {activePos.fret === 0
                ? "開放把位（0–3 格）"
                : `第 ${fretWindow.from}–${fretWindow.to} 格`}
            </span>
          )}
        </div>

        <Fretboard
          rootPc={rootPc}
          intervals={scale.intervals}
          degrees={scale.degrees}
          showDegrees={showDegrees}
          fretWindow={fretWindow}
        />
        <p className="mt-2 text-xs text-slate-500">
          <span className="text-amber-400">●</span> 根音
          {scale.degrees.includes("♭5") && (
            <>
              　<span className="text-cyan-400">●</span> 藍調音（♭5）
            </>
          )}
          　點任一音可試聽。把位（Box）＝把音階切成一段段好記的指型：第 1
          把位從第六弦根音出發，其餘依琴格順序沿指板往上排；選定把位後，把位外的音會變暗。
          想看「每弦精確按哪幾個音」的標準指型（五聲 box、一弦三音），到「指型把位」頁。
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
