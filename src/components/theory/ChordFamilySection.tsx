import { useState } from "react";
import type { ChordQuality, ChordShape } from "../../types/music";
import { QUALITY_LABELS, STANDARD_TUNING_MIDI } from "../../types/music";
import type { ChordFormula } from "../../data/theory";
import {
  CHORD_FORMULAS,
  degreeLabel,
  intervalOf,
  noteToPc,
  pcToName,
  spellChordTones,
} from "../../data/theory";
import { findChordShape, findMovableAShape } from "../../data/chordLookup";
import { playChord } from "../../audio/audioEngine";
import { ChordDiagram } from "../fretboard/ChordDiagram";

/** 大三和弦的音程集合，用來標記「哪個音被動過了」 */
const MAJOR_INTERVALS = new Set([0, 4, 7]);

const STRING_NAMES = ["六", "五", "四", "三", "二", "一"];

/** 手型的落點：最低按壓格（全空弦時為 0） */
function anchorFret(shape: ChordShape): number {
  const fretted = shape.frets.filter(
    (f): f is number => typeof f === "number" && f > 0,
  );
  return fretted.length ? Math.min(...fretted) : 0;
}

/**
 * 實用按法跟大三和弦不在同一把位時，說明「為什麼跳走」的逐列邏輯：
 * 分析大三和弦開放型的空弦音，找出目標和弦裡必須改變、卻壓不下去的那條弦。
 * 沒換把位回傳 null。
 */
function positionJumpNote(
  root: string,
  rootPc: number,
  majorShape: ChordShape,
  shape: ChordShape,
  f: ChordFormula,
): string | null {
  if (f.quality === "major") return null;
  const jumped =
    Math.abs(anchorFret(shape) - anchorFret(majorShape)) >= 2 ||
    (majorShape.positionType === "open" && shape.positionType !== "open");
  if (!jumped) return null;

  const pos = shape.barre
    ? `第 ${shape.barre.fret} 格`
    : `第 ${anchorFret(shape)} 格`;

  if (f.quality === "power") {
    return `強力和弦慣用「低音弦根音＋五度」的可移動型（整條指板都能搬），所以標準按法落在${pos}——不是變化本身需要換位置。`;
  }
  if (majorShape.positionType !== "open") {
    return `這個性質的可移動手型根音落點不同，所以在${pos}附近——樂理變化一樣，只是換個地方按。`;
  }

  // 大三和弦開放型的空弦音中，目標和弦不允許的那些＝卡住的原因
  const targetSet = new Set(f.intervals.map((s) => s % 12));
  const blockers = majorShape.frets.flatMap((fret, i) => {
    if (fret !== 0) return [];
    const semi =
      (((STANDARD_TUNING_MIDI[i] - rootPc) % 12) + 12) % 12;
    if (targetSet.has(semi)) return [];
    return [
      `第${STRING_NAMES[i]}弦空弦 ${pcToName(STANDARD_TUNING_MIDI[i] % 12)}（${degreeLabel(semi)} 音）`,
    ];
  });

  if (blockers.length > 0) {
    return (
      `開放 ${root} 的${blockers.join("、")}在 ${root}${f.suffix} 裡必須改變，` +
      `但空弦壓不下去——只好整個手型搬到${pos}的可移動型。` +
      `樂理上動的音一模一樣，切「同把位對照」就能看到其實只動一兩顆點。`
    );
  }
  return `${root}${f.suffix} 在開放把位沒有順手的按法，所以改用${pos}的可移動手型——樂理變化不變，位置純粹是為了好按。`;
}

/** 依難易度分層：先三和弦、再掛留與七和弦、最後色彩與功能和弦 */
const FAMILY_TIERS: {
  label: string;
  desc: string;
  qualities: ChordQuality[];
}[] = [
  {
    label: "入門｜三和弦",
    desc: "先聽懂 1·3·5 的基準型，以及只動一個音的大小變化",
    qualities: ["major", "minor", "power"],
  },
  {
    label: "進階｜掛留與七和弦",
    desc: "換掉 3 音的懸浮感、疊上七度的三種色彩",
    qualities: ["sus2", "sus4", "dominant7", "major7", "minor7"],
  },
  {
    label: "挑戰｜色彩與功能和弦",
    desc: "add9／6 的現代復古色，dim／m7♭5 的過渡與功能角色",
    qualities: ["add9", "6", "m6", "dim", "m7b5"],
  },
];

interface Props {
  root: string;
  currentQuality: ChordQuality;
}

/**
 * 和弦變化教室：以選中和弦的根音為基準，
 * 展示同一個根音如何變化出 8 種和弦（m / 5 / sus / 7 / maj7 / m7），
 * 每種變化附上按法圖，點擊即可試聽。
 */
export function ChordFamilySection({ root, currentQuality }: Props) {
  const rootPc = noteToPc(root);
  const [sameShape, setSameShape] = useState(false);
  const majorShape = findChordShape(root, "major");
  return (
    <section className="mt-8">
      <h2 className="mb-2 text-lg font-bold text-ink-900">
        🎓 和弦變化教室：<span className="text-navy-700">{root} 家族</span>
      </h2>
      <p className="mb-2 text-sm leading-relaxed text-ink-600">
        和弦是從根音出發、按「級數」往上疊音蓋出來的：大三和弦的公式是
        <span className="mx-1 font-mono text-navy-700">1 · 3 · 5</span>。
        只要動其中一個音、或再疊一個音，就會變出下面這些親戚。每列都寫著
        <span className="mx-1 text-navy-700">怎麼變化</span>（動了哪個音）與
        <span className="mx-1 text-gold-700">什麼時候用</span>
        （實戰時機）。點和弦名或按法圖可以試聽比較。
      </p>
      <p className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-500">
        <span>按法圖上的數字＝每條弦相對根音的級數：</span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-paper-400 text-[9px] font-bold text-navy-700 ring-2 ring-navy-700">
            1
          </span>
          加圈＝根音
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-navy-700 text-[9px] font-bold text-white">
            ♭3
          </span>
          琥珀＝與大三和弦不同的音
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-paper-400 text-[9px] font-bold text-ink-900">
            5
          </span>
          灰＝沒動到的音
        </span>
      </p>

      {/* 按法模式切換 */}
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="text-xs font-semibold text-ink-600">按法：</span>
        <div className="flex overflow-hidden rounded-lg border border-line-200 text-xs">
          <button
            onClick={() => setSameShape(false)}
            className={`px-3 py-1.5 font-medium ${
              !sameShape ? "bg-paper-400 text-navy-700" : "text-ink-600"
            }`}
          >
            實用按法
          </button>
          <button
            onClick={() => setSameShape(true)}
            className={`px-3 py-1.5 font-medium ${
              sameShape ? "bg-paper-400 text-navy-700" : "text-ink-600"
            }`}
          >
            同把位對照（A 型）
          </button>
        </div>
        <span className="text-xs text-ink-500">
          {sameShape
            ? "全部用第五弦根音的可移動手型停在同一把位——只有變動的音會移動，看清「其實只動一個音」。"
            : "顯示每個和弦最好按的實用手型（多為開放和弦）。"}
        </span>
      </div>

      {!sameShape && (
        <p className="mb-4 rounded-lg border border-line-200 bg-paper-100/60 p-3 text-xs leading-relaxed text-ink-600">
          <span className="font-semibold text-navy-700">
            為什麼有些變化會換把位？
          </span>{" "}
          開放和弦（像 C）借用了空弦音，而空弦沒辦法「壓下去降半音」——開放 C
          的高音是空弦 E（正好是 3 音），要變 Cm 得把 E 降成
          E♭，空弦做不到，只好整個換成每個音都用手指按、可以自由變音的封閉／可移動手型。
          反之 Am→A、Em→E 沒有動到借用的空弦，就能原地只換一根手指。
          想在同一位置看清變化，切到「同把位對照」。
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-line-200 bg-paper-100">
        {FAMILY_TIERS.map((tier) => (
          <div key={tier.label}>
            <div className="border-y border-line-200 bg-paper-200/70 px-4 py-2 first:border-t-0">
              <span className="text-xs font-bold text-navy-700">
                {tier.label}
              </span>
              <span className="ml-2 text-xs text-ink-500">{tier.desc}</span>
            </div>
            <div className="divide-y divide-line-200">
              {tier.qualities.map((quality) => {
                const f = CHORD_FORMULAS[quality];
          const name = root + f.suffix;
          const tones = spellChordTones(root, f.intervals);
          const shape = sameShape
            ? findMovableAShape(root, f.quality)
            : findChordShape(root, f.quality);
          const jumpNote = sameShape
            ? null
            : positionJumpNote(root, rootPc, majorShape, shape, f);
          const active = f.quality === currentQuality;
          return (
            <div
              key={f.quality}
              className={`flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 ${
                active ? "bg-navy-700/10" : ""
              }`}
            >
              <button
                onClick={() => playChord(shape, "strum")}
                className="flex w-28 flex-col items-center rounded-lg bg-paper-300 px-2 py-1.5 transition-colors hover:bg-paper-400"
                title="點擊試聽"
              >
                <span className="font-bold text-navy-700">♪ {name}</span>
                <span className="text-[10px] text-ink-500">
                  {QUALITY_LABELS[f.quality]}
                </span>
              </button>

              <button
                onClick={() => playChord(shape, "strum")}
                className="shrink-0 rounded-lg transition-colors hover:bg-paper-300/60"
                title={`${name} 按法，點擊試聽`}
              >
                <ChordDiagram shape={shape} width={104} rootPc={rootPc} />
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
                          ? "bg-navy-700/20 text-navy-700 ring-1 ring-navy-700/50"
                          : "bg-paper-300 text-ink-700"
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

              <div className="min-w-48 flex-1 space-y-1 text-xs leading-relaxed text-ink-600">
                <p>
                  <span className="mr-1 font-semibold text-navy-700/90">
                    怎麼變化
                  </span>
                  {f.changeText}
                </p>
                {jumpNote && (
                  <p>
                    <span className="mr-1 font-semibold text-blood-700/90">
                      為何換把位
                    </span>
                    {jumpNote}
                  </p>
                )}
                <p>
                  <span className="mr-1 font-semibold text-gold-700/90">
                    什麼時候用
                  </span>
                  {f.whenToUse}
                </p>
              </div>
            </div>
          );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
