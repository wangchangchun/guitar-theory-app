import { useState } from "react";
import { CIRCLE_KEYS } from "../data/circleOfFifths";
import { MAJOR_DEGREES } from "../data/diatonic";
import {
  CHORD_FORMULAS,
  noteToPc,
  pcToName,
  theoryChordMidis,
} from "../data/theory";
import { playMidiNotes } from "../audio/audioEngine";

const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];
const useFlatsForKey = (key: string) => key.includes("♭") || key === "F";

const CX = 210;
const CY = 210;
const R_OUTER = 162;
const R_INNER = 104;

function keyPos(index: number, radius: number) {
  const angle = ((index * 30 - 90) * Math.PI) / 180;
  return { x: CX + radius * Math.cos(angle), y: CY + radius * Math.sin(angle) };
}

/**
 * 五度圈：12 個調的地圖。順時針一格＝往上完全五度（V 方向）、
 * 逆時針一格＝往上完全四度（IV 方向），內圈是關係小調。
 * 點任一調試聽主和弦，右側顯示調號、調內音、順階和弦與近親調。
 */
export function CircleOfFifthsPage() {
  const [selected, setSelected] = useState(0);

  const k = CIRCLE_KEYS[selected];
  const cwIdx = (selected + 1) % 12; // 順時針：V 方向
  const ccwIdx = (selected + 11) % 12; // 逆時針：IV 方向
  const useFlats = useFlatsForKey(k.major);
  const keyPc = noteToPc(k.major);
  const scaleNotes = MAJOR_SCALE.map((s) => pcToName(keyPc + s, useFlats));

  const playMajor = (name: string) =>
    playMidiNotes(theoryChordMidis(name, CHORD_FORMULAS.major.intervals));

  const selectMajor = (i: number) => {
    setSelected(i);
    playMajor(CIRCLE_KEYS[i].major);
  };

  const selectMinor = (i: number) => {
    setSelected(i);
    playMidiNotes(
      theoryChordMidis(
        CIRCLE_KEYS[i].minor.slice(0, -1),
        CHORD_FORMULAS.minor.intervals,
      ),
    );
  };

  return (
    <div className="flex flex-col gap-5">
      {/* 教學說明 */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <p className="mb-2 text-sm leading-relaxed text-slate-300">
          五度圈是 12 個調的<span className="text-amber-300">地圖</span>：
          <span className="mx-1 font-semibold text-amber-300">順時針</span>
          每走一格，主音往上完全五度、調號多一個 ♯；
          <span className="mx-1 font-semibold text-sky-300">逆時針</span>
          每走一格，主音往上完全四度、調號多一個 ♭。內圈是共用同一組音的關係小調。
        </p>
        <ul className="grid gap-x-6 gap-y-1 text-xs leading-relaxed text-slate-400 sm:grid-cols-2">
          <li>・查調號：從頂端的 C 順時針數幾格就有幾個 ♯，逆時針數幾格就有幾個 ♭</li>
          <li>・找和弦：任何調的 V 在順時針隔壁、IV 在逆時針隔壁——I·IV·V 永遠相鄰三格</li>
          <li>・找關係小調：同一格的內圈就是它（同一組音，solo 音階通用）</li>
          <li>・轉調：相鄰的調只差一個音、轉起來最平滑；正對面的調最遠、最戲劇化</li>
          <li>・進行方向：II–V–I、副屬和弦鏈都是沿逆時針（五度下行）一路走回家</li>
        </ul>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* 圓盤 */}
        <div className="flex flex-1 items-start justify-center rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <svg viewBox="0 0 420 420" className="w-full max-w-[460px]">
            <circle cx={CX} cy={CY} r={R_OUTER} fill="none" stroke="#334155" strokeDasharray="3 5" />
            <circle cx={CX} cy={CY} r={R_INNER} fill="none" stroke="#334155" strokeDasharray="3 5" />
            <text x={CX} y={CY - 8} textAnchor="middle" fontSize="11" fill="#64748b">
              外圈＝大調
            </text>
            <text x={CX} y={CY + 10} textAnchor="middle" fontSize="11" fill="#64748b">
              內圈＝關係小調
            </text>

            {CIRCLE_KEYS.map((key, i) => {
              const outer = keyPos(i, R_OUTER);
              const inner = keyPos(i, R_INNER);
              const isSelected = i === selected;
              const isNeighbor = i === cwIdx || i === ccwIdx;
              return (
                <g key={key.major}>
                  {/* 外圈：大調 */}
                  <g
                    onClick={() => selectMajor(i)}
                    className="cursor-pointer"
                    role="button"
                    aria-label={`${key.major} 大調`}
                  >
                    <circle
                      cx={outer.x}
                      cy={outer.y}
                      r={26}
                      fill={isSelected ? "#f59e0b" : isNeighbor ? "#78350f" : "#1e293b"}
                      stroke={isSelected || isNeighbor ? "#f59e0b" : "#475569"}
                      strokeWidth={isSelected ? 2 : 1}
                    />
                    <text
                      x={outer.x}
                      y={outer.y + 1}
                      textAnchor="middle"
                      fontSize="15"
                      fontWeight="bold"
                      fill={isSelected ? "#0f172a" : "#f1f5f9"}
                    >
                      {key.major}
                    </text>
                    <text
                      x={outer.x}
                      y={outer.y + 14}
                      textAnchor="middle"
                      fontSize="8"
                      fill={isSelected ? "#0f172a" : "#94a3b8"}
                    >
                      {key.signature}
                    </text>
                  </g>
                  {/* 內圈：關係小調 */}
                  <g
                    onClick={() => selectMinor(i)}
                    className="cursor-pointer"
                    role="button"
                    aria-label={`${key.minor} 小調`}
                  >
                    <circle
                      cx={inner.x}
                      cy={inner.y}
                      r={19}
                      fill={isSelected ? "#0c4a6e" : "#0f172a"}
                      stroke={isSelected ? "#38bdf8" : "#334155"}
                      strokeWidth={isSelected ? 1.5 : 1}
                    />
                    <text
                      x={inner.x}
                      y={inner.y + 4}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="600"
                      fill={isSelected ? "#7dd3fc" : "#94a3b8"}
                    >
                      {key.minor}
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>
        </div>

        {/* 選中調的資訊 */}
        <aside className="w-full shrink-0 lg:w-96">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-1 flex flex-wrap items-baseline gap-x-3">
              <h2 className="text-3xl font-extrabold text-amber-400">
                {k.major} 大調
              </h2>
              <span className="text-sm text-slate-400">
                調號 {k.signature}
                {k.enharmonic && `（${k.enharmonic}）`}
              </span>
            </div>
            <p className="mb-4 text-sm text-slate-400">
              關係小調：<span className="font-semibold text-sky-300">{k.minor}</span>
              （共用同一組音）
            </p>

            <h3 className="mb-1 text-sm font-semibold text-slate-300">調內音</h3>
            <p className="mb-4 font-mono text-sm text-slate-200">
              {scaleNotes.join(" · ")}
            </p>

            <h3 className="mb-2 text-sm font-semibold text-slate-300">
              順階三和弦（點擊試聽）
            </h3>
            <div className="mb-5 flex flex-wrap gap-1.5">
              {MAJOR_DEGREES.map((d) => {
                const rootName = pcToName(keyPc + d.semitones, useFlats);
                const f = CHORD_FORMULAS[d.triadQuality];
                return (
                  <button
                    key={d.triadNumeral}
                    onClick={() =>
                      playMidiNotes(theoryChordMidis(rootName, f.intervals))
                    }
                    className="flex w-[52px] flex-col items-center rounded-md bg-slate-800 px-1 py-1.5 transition-colors hover:bg-slate-700"
                  >
                    <span className="text-[10px] leading-none text-slate-500">
                      {d.triadNumeral}
                    </span>
                    <span className="mt-0.5 font-mono text-sm font-semibold text-amber-300">
                      {rootName + f.suffix}
                    </span>
                  </button>
                );
              })}
            </div>

            <h3 className="mb-2 text-sm font-semibold text-slate-300">
              近親調（點擊跳過去）
            </h3>
            <div className="flex flex-col gap-1.5 text-sm">
              <button
                onClick={() => selectMajor(ccwIdx)}
                className="flex items-center justify-between rounded-lg bg-slate-800 px-3 py-2 text-left transition-colors hover:bg-slate-700"
              >
                <span className="font-semibold text-slate-100">
                  ↺ {CIRCLE_KEYS[ccwIdx].major} 大調
                </span>
                <span className="text-xs text-slate-400">
                  逆時針一格＝{k.major} 的 IV（下屬方向）
                </span>
              </button>
              <button
                onClick={() => selectMajor(cwIdx)}
                className="flex items-center justify-between rounded-lg bg-slate-800 px-3 py-2 text-left transition-colors hover:bg-slate-700"
              >
                <span className="font-semibold text-slate-100">
                  ↻ {CIRCLE_KEYS[cwIdx].major} 大調
                </span>
                <span className="text-xs text-slate-400">
                  順時針一格＝{k.major} 的 V（屬方向）
                </span>
              </button>
              <button
                onClick={() => selectMinor(selected)}
                className="flex items-center justify-between rounded-lg bg-slate-800 px-3 py-2 text-left transition-colors hover:bg-slate-700"
              >
                <span className="font-semibold text-sky-300">◉ {k.minor}</span>
                <span className="text-xs text-slate-400">
                  同格內圈＝關係小調（同一組音）
                </span>
              </button>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-slate-500">
              相鄰的調與 {k.major} 大調只差一個音——歌寫到一半想轉調，
              先往這三個近親調找，聽起來最順。
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
