import { useMemo, useState } from "react";
import { CHORDS } from "../data/chords";
import type { ChordShape } from "../types/music";
import { QUALITY_LABELS } from "../types/music";
import { CHORD_FORMULAS, intervalOf, parseRoot, spellChordTones } from "../data/theory";
import { playChord } from "../audio/audioEngine";
import { ChordDiagram } from "../components/fretboard/ChordDiagram";
import { ChordFamilySection } from "../components/theory/ChordFamilySection";
import { PageIntro } from "../components/PageIntro";

type FilterId =
  | "all"
  | "major"
  | "minor"
  | "power"
  | "seventh"
  | "sus"
  | "barre";

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "major", label: "大三和弦" },
  { id: "minor", label: "小三和弦" },
  { id: "power", label: "強力和弦" },
  { id: "seventh", label: "七和弦" },
  { id: "sus", label: "掛留和弦" },
  { id: "barre", label: "封閉和弦" },
];

function matchesFilter(chord: ChordShape, filter: FilterId): boolean {
  switch (filter) {
    case "all":
      return true;
    case "seventh":
      return ["dominant7", "major7", "minor7"].includes(chord.quality);
    case "sus":
      return chord.quality === "sus2" || chord.quality === "sus4";
    case "barre":
      return chord.positionType === "barre";
    default:
      return chord.quality === filter;
  }
}

const POSITION_LABELS: Record<ChordShape["positionType"], string> = {
  open: "開放把位",
  barre: "封閉和弦",
  movable: "可移動手型",
};

export function ChordLibraryPage() {
  const [filter, setFilter] = useState<FilterId>("all");
  const [selected, setSelected] = useState<ChordShape>(CHORDS[0]);

  const visibleChords = useMemo(
    () => CHORDS.filter((c) => matchesFilter(c, filter)),
    [filter],
  );

  const root = parseRoot(selected.chordName);
  const formula = CHORD_FORMULAS[selected.quality];
  const tones = spellChordTones(root, formula.intervals);

  const selectAndPlay = (chord: ChordShape) => {
    setSelected(chord);
    playChord(chord, "strum");
  };

  return (
    <div className="flex flex-col gap-6">
      <PageIntro
        storageKey="chords"
        phase="階段 1 · 和弦地基"
        what="所有和弦的字典：每個和弦的按法、組成音，以及怎麼從基本和弦變化出各種親戚。"
        lessons={[
          {
            level: "入門",
            title: "認識三和弦的長相",
            learn:
              "篩選「大三和弦」，逐一點 E、A、D、G、C 五張卡片：右側會顯示組成音——級數永遠是 1·3·5，只是音名跟著根音跑。",
            guitar:
              "跟著按 E→A→D 三個開放和弦，每個先刷一下、再一弦一弦分解，聽出「六條弦其實只有三個音在輪班」。",
          },
          {
            level: "入門",
            title: "大與小只差半音",
            learn:
              "切到「小三和弦」，比較 Em/Am/Dm 和 E/A/D：右側組成音只有 3 變 ♭3 一個差別。",
            guitar:
              "彈 E→Em（第三弦食指放開）、A→Am（第二弦 2 格→1 格），來回聽明亮↔憂鬱——只動一根手指。",
          },
          {
            level: "進階",
            title: "沒有 3 音與換掉 3 音",
            learn:
              "看「強力和弦」（只剩 1·5，沒有大小之分）與「掛留和弦」（3 被換成 2 或 4 的懸浮感）。",
            guitar:
              "彈 D→Dsus4→D→Dsus2→D（小指在第一弦勾放）；再彈 E5 只撥六五四弦，配手掌悶音下撥。",
          },
          {
            level: "進階",
            title: "七和弦的三種色彩",
            learn:
              "篩選「七和弦」，比較同根音的 7／maj7／m7：差別全在疊上去的那個七度是大是小。",
            guitar:
              "彈 C（x32010）→Cmaj7（放開食指）→C7（小指按第三弦 3 格），一分鐘聽完三種七度色彩。",
          },
          {
            level: "挑戰",
            title: "和弦變化教室總整理",
            learn:
              "捲到頁面下方的「和弦變化教室」，切到「同把位對照」模式——13 種和弦停在同一把位，只有變動的音（琥珀色點）會移動。",
            guitar:
              "用 A 型手型在第 3 格連續按 C→Cm→C7→Cmaj7，親手感受每個變化其實只差一根手指。",
          },
        ]}
        notes={[
          "新手先熟 E、A、D、G、C 五個開放和弦，其他都是它們的變化",
          "右側面板的「怎麼變化／什麼時候用」是每個和弦的身世與用途",
        ]}
      />

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* 左側：篩選 + 和弦卡片格 */}
        <div className="flex-1">
        <div className="mb-4 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                filter === f.id
                  ? "bg-amber-500 text-slate-950"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {visibleChords.map((chord) => (
            <button
              key={chord.id}
              onClick={() => selectAndPlay(chord)}
              className={`group flex flex-col items-center rounded-xl border p-3 transition-colors ${
                selected.id === chord.id
                  ? "border-amber-500 bg-slate-800/80"
                  : "border-slate-800 bg-slate-900 hover:border-slate-600"
              }`}
            >
              <span className="mb-1 text-lg font-bold text-slate-100">
                {chord.chordName}
              </span>
              <span className="mb-2 text-xs text-slate-400">
                {QUALITY_LABELS[chord.quality]}
              </span>
              <ChordDiagram shape={chord} width={110} />
            </button>
          ))}
        </div>

        {visibleChords.length === 0 && (
          <p className="mt-8 text-center text-slate-400">此分類目前沒有和弦。</p>
        )}

        <ChordFamilySection root={root} currentQuality={selected.quality} />
      </div>

      {/* 右側：選中和弦詳細資訊 */}
      <aside className="w-full shrink-0 lg:w-80">
        <div className="sticky top-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="mb-1 flex items-baseline gap-3">
            <h2 className="text-3xl font-extrabold text-amber-400">
              {selected.chordName}
            </h2>
            <span className="text-sm text-slate-400">
              {QUALITY_LABELS[selected.quality]}
            </span>
          </div>
          <p className="mb-4 text-xs text-slate-500">
            {POSITION_LABELS[selected.positionType]}
          </p>

          <div className="mb-4 flex justify-center">
            <ChordDiagram shape={selected} width={200} />
          </div>

          <div className="mb-4">
            <h3 className="mb-1 text-sm font-semibold text-slate-300">
              組成音與音程
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {formula.intervals.map((s, i) => (
                <span
                  key={s}
                  className="flex flex-col items-center rounded-md bg-slate-800 px-2 py-1"
                >
                  <span className="text-[10px] leading-tight text-slate-400">
                    {intervalOf(s).name}
                  </span>
                  <span className="font-mono text-sm font-semibold text-amber-300">
                    {tones[i]}
                  </span>
                </span>
              ))}
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              {selected.chordName} ＝ {formula.buildText}
            </p>
          </div>

          <div className="mb-4 space-y-2 rounded-lg bg-slate-800/60 p-3 text-xs leading-relaxed text-slate-400">
            <p>
              <span className="mr-1 font-semibold text-amber-300">怎麼變化</span>
              {formula.changeText}
            </p>
            <p>
              <span className="mr-1 font-semibold text-sky-300">什麼時候用</span>
              {formula.whenToUse}
            </p>
          </div>

          {selected.note && (
            <p className="mb-4 rounded-lg bg-slate-800/60 p-3 text-sm leading-relaxed text-slate-300">
              {selected.note}
            </p>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => playChord(selected, "strum")}
              className="flex-1 rounded-lg bg-amber-500 py-2 font-semibold text-slate-950 transition-colors hover:bg-amber-400"
            >
              ♪ 刷弦
            </button>
            <button
              onClick={() => playChord(selected, "arpeggio")}
              className="flex-1 rounded-lg bg-slate-700 py-2 font-semibold text-slate-100 transition-colors hover:bg-slate-600"
            >
              ♪ 分解
            </button>
          </div>

          <p className="mt-3 text-center text-xs text-slate-500">
            手指編號：1 食指 · 2 中指 · 3 無名指 · 4 小指
          </p>
        </div>
        </aside>
      </div>
    </div>
  );
}
