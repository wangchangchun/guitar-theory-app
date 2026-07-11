import { useState } from "react";
import type { ChordQuality } from "../types/music";
import { QUALITY_LABELS, STANDARD_TUNING_MIDI } from "../types/music";
import { cagedPositions } from "../data/caged";
import {
  CHORD_FORMULAS,
  intervalOf,
  noteToPc,
  spellChordTones,
  theoryChordMidis,
} from "../data/theory";
import { Fretboard } from "../components/fretboard/Fretboard";
import { PageIntro } from "../components/PageIntro";
import { getAudioTime, noteAt, playMidiNotes } from "../audio/audioEngine";

const ROOT_OPTIONS = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
];

const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];
const MAJOR_DEGREES_LABELS = ["1", "2", "3", "4", "5", "6", "7"];

const ARP_QUALITIES: ChordQuality[] = [
  "major", "minor", "dominant7", "major7", "minor7",
];

function playAscending(midis: number[]) {
  const start = getAudioTime() + 0.1;
  midis.forEach((m, i) => noteAt(m, start + i * 0.18, 0.25));
}

/**
 * 指板地圖：從「每一格叫什麼名字」到「和弦鋪滿指板」——
 * 指板音名與八度型 → CAGED 五型 → 琶音與和弦內音瞄準。
 */
export function FretboardMapPage() {
  const [root, setRoot] = useState("C");
  const [selForm, setSelForm] = useState<string>("E");
  const [arpQuality, setArpQuality] = useState<ChordQuality>("dominant7");

  const rootPc = noteToPc(root);

  // CAGED
  const positions = cagedPositions(rootPc);
  const activePos = positions.find((p) => p.form.form === selForm);
  const cagedPattern =
    selForm === "all" ? positions.flatMap((p) => p.notes) : activePos!.notes;
  const cagedFretCount = Math.max(15, ...cagedPattern.map((n) => n.fret));
  const playCaged = (notes: { string: number; fret: number }[]) =>
    playMidiNotes(
      [...notes]
        .sort((a, b) => a.string - b.string)
        .map((n) => STANDARD_TUNING_MIDI[n.string] + n.fret),
      "strum",
    );

  // 琶音
  const arpFormula = CHORD_FORMULAS[arpQuality];
  const arpDegrees = arpFormula.intervals.map((s) => intervalOf(s).degree);
  const arpTones = spellChordTones(root, arpFormula.intervals);
  const arpName = root + arpFormula.suffix;
  const hasSeventh = arpFormula.intervals.length >= 4;

  return (
    <div className="flex flex-col gap-5">
      <PageIntro
        storageKey="fretmap"
        phase="階段 2–3 · 指板導航與橋接"
        what="這一頁把指板變成一張地圖，由淺入深分三段，跟著往下捲即可。"
        lessons={[
          {
            level: "入門",
            title: "① 指板音名：先背兩條低音弦",
            learn:
              "看第一段的自然音分佈圖，點音試聽——先背第六弦與第五弦就好，其他弦用八度型推。",
            guitar:
              "計時 60 秒，在第六弦找出並彈出 C、F、A、B♭（答案：8、1、5、6 格）；明天換第五弦。",
          },
          {
            level: "入門",
            title: "① 八度型：用耳朵自我驗證",
            learn:
              "記兩條規則：低音側隔一弦 +2 格、高音側隔一弦 +3 格（跨過 B 弦要多 1 格）。",
            guitar:
              "第六弦隨便按一格，用「隔一弦 +2 格」找高八度並同時彈響——同名音會完全融合，打架就是找錯了。",
          },
          {
            level: "進階",
            title: "② CAGED：一個和弦鋪滿指板",
            learn:
              "選根音 C，用手型按鈕逐一檢視五個位置，最後切「全部五型」看它們怎麼拼滿整片指板。",
            guitar:
              "把 C 和弦五個手型由低到高各刷一次（開放 C→A 型 3 格→G 型 5 格→E 型 8 格→D 型 10 格）。",
          },
          {
            level: "挑戰",
            title: "③ 和弦內音瞄準（guide tones）",
            learn:
              "看第三段：切到 G7，找出 3 音 B 和 ♭7 音 F 在指板上的位置——它們決定和弦的身分。",
            guitar:
              "循環刷 G7→C，單音彈 B→C（3→1）再彈 F→E（♭7→3），親耳聽兩條半音線同時解決的拉力。",
            chords: ["G7", "C"],
          },
        ]}
        notes={[
          "前兩步屬階段 2，後兩步（CAGED、瞄準）屬階段 3",
          "solo 長音落在和弦內音上，旋律就會「貼」著和聲走",
        ]}
      />

      {/* ① 指板音名與八度型 */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <h2 className="mb-2 text-lg font-bold">
          ① 指板音名<span className="ml-2 text-sm font-normal text-slate-400">
            自然音（C 大調的音）分佈圖——先背第六弦與第五弦，其他用八度型推
          </span>
        </h2>
        <Fretboard
          rootPc={0}
          intervals={MAJOR_SCALE}
          degrees={MAJOR_DEGREES_LABELS}
          showDegrees={false}
          fretCount={12}
        />
        <div className="mt-3 grid gap-x-6 gap-y-1 text-xs leading-relaxed text-slate-400 sm:grid-cols-2">
          <p>・第 12 格回到空弦音名；第 5 格＝下一弦的空弦音（僅第三弦例外：第 4 格）</p>
          <p>・八度型（低音側）：隔一弦、往高音方向 +2 格（六→四弦、五→三弦）</p>
          <p>・八度型（高音側）：隔一弦 +3 格（四→二弦、三→一弦，因為跨過 B 弦）</p>
          <p>
            ・B 弦陷阱：G→B 弦之間是大三度（4 格），其他相鄰弦都是完全四度（5 格）——
            所有跨過這裡的指型都要多移 1 格
          </p>
          <p>・第六弦與第一弦音名完全相同（差兩個八度）：背一條送一條</p>
          <p>・目標：看到任一（弦, 格）1 秒說出音名——到「樂理練習」的指板音名單元驗收</p>
        </div>
      </div>

      {/* 根音選擇（CAGED 與琶音共用） */}
      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-300">
          根音（②③ 共用）
        </h3>
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

      {/* ② CAGED */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">
            ② CAGED 五型：<span className="text-amber-400">{root} 和弦</span>
            <span className="ml-2 text-sm font-normal text-slate-400">
              同一個和弦鋪滿整個指板
            </span>
          </h2>
          <button
            onClick={() =>
              playCaged(selForm === "all" ? positions[0].notes : activePos!.notes)
            }
            className="rounded-lg bg-amber-500 px-4 py-1.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-400"
          >
            ♪ 刷這個手型
          </button>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-400">手型：</span>
          {positions.map((p) => (
            <button
              key={p.form.form}
              onClick={() => setSelForm(p.form.form)}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                selForm === p.form.form
                  ? "bg-amber-500 text-slate-950"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {p.form.form} 型・{p.offset === 0 ? "開放" : `${p.offset} 格`}
            </button>
          ))}
          <button
            onClick={() => setSelForm("all")}
            className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
              selForm === "all"
                ? "bg-amber-500 text-slate-950"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            全部五型
          </button>
        </div>

        <Fretboard
          rootPc={rootPc}
          intervals={[0, 4, 7]}
          degrees={["1", "3", "5"]}
          showDegrees
          pattern={cagedPattern}
          fretCount={cagedFretCount}
        />
        <p className="mt-2 text-xs leading-relaxed text-slate-500">
          {selForm === "all" ? (
            <>
              五個手型依{" "}
              <span className="font-mono text-amber-300">C→A→G→E→D</span>{" "}
              循環沿指板排好：
              {positions.map(
                (p, i) =>
                  `${i > 0 ? " → " : ""}${p.form.form} 型${
                    p.offset === 0 ? "（開放）" : `＠${p.offset} 格`
                  }`,
              )}
              。變暗的點是 {root} 和弦的全部和弦內音（1·3·5）——五個手型只是把它們切成五塊。
            </>
          ) : (
            <>
              {activePos!.form.form} 型＠
              {activePos!.offset === 0 ? "開放把位" : `第 ${activePos!.offset} 格`}：
              {activePos!.form.tip}
              　順序永遠是 C→A→G→E→D 循環，彈完一型、下一型就接在上面。
            </>
          )}
        </p>
      </div>

      {/* ③ 琶音與和弦內音 */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">
            ③ 琶音與和弦內音：<span className="text-sky-300">{arpName}</span>
            <span className="ml-2 text-sm font-normal text-slate-400">
              全指板的和弦內音地圖
            </span>
          </h2>
          <button
            onClick={() =>
              playAscending(
                theoryChordMidis(root, [
                  ...arpFormula.intervals,
                  ...arpFormula.intervals.map((s) => s + 12),
                  24,
                ]),
              )
            }
            className="rounded-lg bg-amber-500 px-4 py-1.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-400"
          >
            ▶ 播放琶音
          </button>
        </div>

        <div className="mb-3 flex flex-wrap gap-1.5">
          {ARP_QUALITIES.map((q) => (
            <button
              key={q}
              onClick={() => setArpQuality(q)}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                arpQuality === q
                  ? "bg-amber-500 text-slate-950"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {root + CHORD_FORMULAS[q].suffix}（{QUALITY_LABELS[q]}）
            </button>
          ))}
        </div>

        <Fretboard
          rootPc={rootPc}
          intervals={arpFormula.intervals}
          degrees={arpDegrees}
          showDegrees
        />
        <div className="mt-2 space-y-1 text-xs leading-relaxed text-slate-500">
          <p>
            {arpName} 的和弦內音＝{arpTones.join("·")}。solo
            時長音落在這些點上，怎麼停都貼和聲；音階的其他音當經過音快速通過。
          </p>
          <p>
            🎯 <span className="font-semibold text-sky-300">Guide tones：</span>
            {hasSeventh ? (
              <>
                3 音 <span className="font-mono text-amber-300">{arpTones[1]}</span>
                （決定大小）與 7 音{" "}
                <span className="font-mono text-amber-300">{arpTones[3]}</span>
                （決定七和弦種類）——這兩個音一響，耳朵立刻知道現在是 {arpName}；
                1 和 5 最安全，但說不出和弦的身分。
              </>
            ) : (
              <>
                三和弦的身分由 3 音{" "}
                <span className="font-mono text-amber-300">{arpTones[1]}</span>{" "}
                決定——大調小調就差它半音。
              </>
            )}
          </p>
          <p>
            換和弦的瞬間把長音「接」到新和弦的 guide tone 上，就是 chord tone
            targeting。經典範例：G7→C 時 B→C（3→1）、F→E（♭7→3）兩條半音線同時解決——
            屬七和弦的拉力就在這對三全音上。
          </p>
        </div>
      </div>
    </div>
  );
}
