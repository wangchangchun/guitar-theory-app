import { useState } from "react";
import type { ChordQuality } from "../../types/music";
import { QUALITY_LABELS } from "../../types/music";
import {
  CHORD_FORMULAS,
  intervalOf,
  noteToPc,
  spellChordTones,
} from "../../data/theory";
import { findChordShape, findMovableAShape } from "../../data/chordLookup";
import { playChord } from "../../audio/audioEngine";
import { ChordDiagram } from "../fretboard/ChordDiagram";

/** 大三和弦的音程集合，用來標記「哪個音被動過了」 */
const MAJOR_INTERVALS = new Set([0, 4, 7]);

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
  return (
    <section className="mt-8">
      <h2 className="mb-2 text-lg font-bold text-slate-100">
        🎓 和弦變化教室：<span className="text-amber-400">{root} 家族</span>
      </h2>
      <p className="mb-2 text-sm leading-relaxed text-slate-400">
        和弦是從根音出發、按「級數」往上疊音蓋出來的：大三和弦的公式是
        <span className="mx-1 font-mono text-amber-300">1 · 3 · 5</span>。
        只要動其中一個音、或再疊一個音，就會變出下面這些親戚。每列都寫著
        <span className="mx-1 text-amber-300">怎麼變化</span>（動了哪個音）與
        <span className="mx-1 text-sky-300">什麼時候用</span>
        （實戰時機）。點和弦名或按法圖可以試聽比較。
      </p>
      <p className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
        <span>按法圖上的數字＝每條弦相對根音的級數：</span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-700 text-[9px] font-bold text-amber-300 ring-2 ring-amber-500">
            1
          </span>
          加圈＝根音
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-slate-950">
            ♭3
          </span>
          琥珀＝與大三和弦不同的音
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-700 text-[9px] font-bold text-slate-200">
            5
          </span>
          灰＝沒動到的音
        </span>
      </p>

      {/* 按法模式切換 */}
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="text-xs font-semibold text-slate-400">按法：</span>
        <div className="flex overflow-hidden rounded-lg border border-slate-700 text-xs">
          <button
            onClick={() => setSameShape(false)}
            className={`px-3 py-1.5 font-medium ${
              !sameShape ? "bg-slate-700 text-amber-300" : "text-slate-400"
            }`}
          >
            實用按法
          </button>
          <button
            onClick={() => setSameShape(true)}
            className={`px-3 py-1.5 font-medium ${
              sameShape ? "bg-slate-700 text-amber-300" : "text-slate-400"
            }`}
          >
            同把位對照（A 型）
          </button>
        </div>
        <span className="text-xs text-slate-500">
          {sameShape
            ? "全部用第五弦根音的可移動手型停在同一把位——只有變動的音會移動，看清「其實只動一個音」。"
            : "顯示每個和弦最好按的實用手型（多為開放和弦）。"}
        </span>
      </div>

      {!sameShape && (
        <p className="mb-4 rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-xs leading-relaxed text-slate-400">
          <span className="font-semibold text-amber-300">
            為什麼有些變化會換把位？
          </span>{" "}
          開放和弦（像 C）借用了空弦音，而空弦沒辦法「壓下去降半音」——開放 C
          的高音是空弦 E（正好是 3 音），要變 Cm 得把 E 降成
          E♭，空弦做不到，只好整個換成每個音都用手指按、可以自由變音的封閉／可移動手型。
          反之 Am→A、Em→E 沒有動到借用的空弦，就能原地只換一根手指。
          想在同一位置看清變化，切到「同把位對照」。
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
        {FAMILY_TIERS.map((tier) => (
          <div key={tier.label}>
            <div className="border-y border-slate-800 bg-slate-950/70 px-4 py-2 first:border-t-0">
              <span className="text-xs font-bold text-amber-300">
                {tier.label}
              </span>
              <span className="ml-2 text-xs text-slate-500">{tier.desc}</span>
            </div>
            <div className="divide-y divide-slate-800">
              {tier.qualities.map((quality) => {
                const f = CHORD_FORMULAS[quality];
          const name = root + f.suffix;
          const tones = spellChordTones(root, f.intervals);
          const shape = sameShape
            ? findMovableAShape(root, f.quality)
            : findChordShape(root, f.quality);
          const active = f.quality === currentQuality;
          return (
            <div
              key={f.quality}
              className={`flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 ${
                active ? "bg-amber-500/10" : ""
              }`}
            >
              <button
                onClick={() => playChord(shape, "strum")}
                className="flex w-28 flex-col items-center rounded-lg bg-slate-800 px-2 py-1.5 transition-colors hover:bg-slate-700"
                title="點擊試聽"
              >
                <span className="font-bold text-amber-300">♪ {name}</span>
                <span className="text-[10px] text-slate-500">
                  {QUALITY_LABELS[f.quality]}
                </span>
              </button>

              <button
                onClick={() => playChord(shape, "strum")}
                className="shrink-0 rounded-lg transition-colors hover:bg-slate-800/60"
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

              <div className="min-w-48 flex-1 space-y-1 text-xs leading-relaxed text-slate-400">
                <p>
                  <span className="mr-1 font-semibold text-amber-300/90">
                    怎麼變化
                  </span>
                  {f.changeText}
                </p>
                <p>
                  <span className="mr-1 font-semibold text-sky-300/90">
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
