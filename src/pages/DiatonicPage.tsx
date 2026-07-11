import { useState } from "react";
import { MAJOR_DEGREES, MINOR_DEGREES } from "../data/diatonic";
import { CHORD_FORMULAS, noteToPc, pcToName, spellChordTones } from "../data/theory";
import { findChordShape } from "../data/chordLookup";
import { playChord } from "../audio/audioEngine";
import { ChordDiagram } from "../components/fretboard/ChordDiagram";
import { PageIntro } from "../components/PageIntro";

const KEY_OPTIONS = [
  "C", "D♭", "D", "E♭", "E", "F", "F#", "G", "A♭", "A", "B♭", "B",
];
const useFlatsForKey = (key: string) => key.includes("♭") || key === "F";

const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];
const MINOR_SCALE = [0, 2, 3, 5, 7, 8, 10];

/**
 * 調性字典：任一調的 I~VII 級順階三和弦／七和弦，
 * 附按法與試聽——「這張表是你之後所有分析的字典」。
 */
export function DiatonicPage() {
  const [keyName, setKeyName] = useState("C");
  const [mode, setMode] = useState<"major" | "minor">("major");

  const degrees = mode === "major" ? MAJOR_DEGREES : MINOR_DEGREES;
  const keyPc = noteToPc(keyName);
  const useFlats = useFlatsForKey(keyName);
  const scaleNotes = (mode === "major" ? MAJOR_SCALE : MINOR_SCALE).map((s) =>
    pcToName(keyPc + s, useFlats),
  );

  return (
    <div className="flex flex-col gap-5">
      <PageIntro
        storageKey="diatonic"
        phase="階段 4 · 調性與和聲功能"
        what="每個調都有七個「順階和弦」：把音階每個音當根音、隔音疊三度蓋出來。這張表是之後所有進行分析的字典。"
        lessons={[
          {
            level: "入門",
            title: "C 大調的七個居民",
            learn:
              "用預設的 C 大調，從 I 到 VII 逐列點三和弦試聽——順階和弦就是這個調「自己人」的全部名單。",
            guitar:
              "彈順階爬梯 C–Dm–Em–F–G–Am–Bdim–C，邊彈邊唸「一、二m、三m、四、五、六m、七減」。",
          },
          {
            level: "進階",
            title: "功能角色：家、離家、回家",
            learn:
              "讀每列右側的角色說明：I 是家、IV 離家、V 最想回家——和弦進行就是在這三種引力間移動。",
            guitar:
              "彈 C–F–G–C（I–IV–V–I）數次，刻意在 G 停一拍感受「懸著想回家」，再落回 C。",
          },
          {
            level: "進階",
            title: "七和弦版：加上色彩",
            learn: "改點每列的七和弦：同樣的功能，多疊一個七度就多一層都會感。",
            guitar:
              "彈順階七和弦 Cmaj7–Dm7–Em7–Fmaj7–G7–Am7，跟三和弦版本比色彩。",
          },
          {
            level: "挑戰",
            title: "換調驗證＋自然小調",
            learn:
              "切到 G 大調：級數排列一模一樣、只是根音跟著跑；再切「自然小調」看另一張順階表。",
            guitar:
              "把 I–IV–V–I 搬到 G 大調彈（G–C–D–G）——和弦全變了、感覺完全一樣，這就是級數思考。",
          },
        ]}
        notes={[
          "目標：看到級數 IVM7、V7 能一秒反射出是哪個和弦",
          "大調順階七和弦永遠是 IM7・IIm7・IIIm7・IVM7・V7・VIm7・VIIm7♭5",
        ]}
      />

      {/* 調與模式選擇 */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-300">調</h3>
          <div className="flex flex-wrap gap-1.5">
            {KEY_OPTIONS.map((k) => (
              <button
                key={k}
                onClick={() => setKeyName(k)}
                className={`w-10 rounded-lg py-1.5 font-mono text-sm font-semibold transition-colors ${
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
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-300">調性</h3>
          <div className="flex overflow-hidden rounded-lg border border-slate-700 text-sm">
            <button
              onClick={() => setMode("major")}
              className={`px-4 py-1.5 font-medium ${
                mode === "major" ? "bg-slate-700 text-amber-300" : "text-slate-400"
              }`}
            >
              大調
            </button>
            <button
              onClick={() => setMode("minor")}
              className={`px-4 py-1.5 font-medium ${
                mode === "minor" ? "bg-slate-700 text-amber-300" : "text-slate-400"
              }`}
            >
              自然小調
            </button>
          </div>
        </div>
        <p className="text-xs text-slate-500">
          調內音：
          {scaleNotes.map((n) => (
            <span key={n} className="ml-1 font-mono text-slate-300">
              {n}
            </span>
          ))}
        </p>
      </div>

      {/* 順階和弦表 */}
      <div className="divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-900">
        {degrees.map((d) => {
          const rootName = pcToName(keyPc + d.semitones, useFlats);
          const triadName = rootName + CHORD_FORMULAS[d.triadQuality].suffix;
          const seventhName = rootName + CHORD_FORMULAS[d.seventhQuality].suffix;
          const seventhShape = findChordShape(rootName, d.seventhQuality);
          const seventhTones = spellChordTones(
            rootName,
            CHORD_FORMULAS[d.seventhQuality].intervals,
          );
          return (
            <div
              key={d.seventhNumeral}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3"
            >
              <div className="w-24">
                <p className="font-mono text-lg font-bold text-amber-400">
                  {d.seventhNumeral}
                </p>
                <p className="font-mono text-xs text-slate-500">{d.triadNumeral}</p>
              </div>

              <button
                onClick={() =>
                  playChord(findChordShape(rootName, d.triadQuality), "strum")
                }
                className="w-20 rounded-lg bg-slate-800 py-1.5 text-sm font-bold text-slate-200 transition-colors hover:bg-slate-700"
                title="三和弦試聽"
              >
                ♪ {triadName}
              </button>

              <button
                onClick={() => playChord(seventhShape, "strum")}
                className="w-24 rounded-lg bg-slate-800 py-1.5 text-sm font-bold text-amber-300 transition-colors hover:bg-slate-700"
                title="七和弦試聽"
              >
                ♪ {seventhName}
              </button>

              <button
                onClick={() => playChord(seventhShape, "arpeggio")}
                className="shrink-0 rounded-lg transition-colors hover:bg-slate-800/60"
                title={`${seventhName} 按法，點擊分解試聽`}
              >
                <ChordDiagram shape={seventhShape} width={84} />
              </button>

              <div className="min-w-48 flex-1">
                <p className="mb-0.5 font-mono text-xs text-slate-400">
                  {seventhTones.join(" · ")}
                </p>
                <p className="text-xs leading-relaxed text-slate-400">{d.role}</p>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs leading-relaxed text-slate-500">
        練習：把這張表在 24 個大小調各過一遍（教材練習
        1-1）——大調的順階七和弦永遠是
        <span className="mx-1 font-mono">
          IM7・IIm7・IIIm7・IVM7・V7・VIm7・VIIm7♭5
        </span>
        的排列，只是根音跟著調跑。V7 是調內唯一的屬七和弦，聽到屬七就想回 I。
      </p>
    </div>
  );
}
