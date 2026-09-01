import { pcToName, degreeLabel } from "../../data/theory";

/**
 * 十二半音列：從根音出發連走 12 格（＝吉他同一條弦上連續 12 格），
 * 把「在這條音階裡」的音亮起來、其餘變暗。
 *
 * 用來建立最基礎的觀念——音階不是憑空生出來的一堆音，
 * 而是從固定的 12 個半音裡「挑幾個」的結果。
 */

interface Props {
  rootPc: number;
  /** 由根音起算的半音數 */
  intervals: number[];
}

export function ChromaticRow({ rootPc, intervals }: Props) {
  const inScale = new Set(intervals);

  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-1">
      <div className="flex min-w-max gap-1">
        {Array.from({ length: 13 }, (_, semi) => {
          const picked = inScale.has(semi) || semi === 12;
          const isRoot = semi === 0 || semi === 12;
          return (
            <div
              key={semi}
              className={`flex w-11 shrink-0 flex-col items-center rounded-lg px-1 py-1.5 ${
                isRoot
                  ? "bg-navy-700 text-white"
                  : picked
                    ? "bg-paper-300 text-ink-900 ring-1 ring-navy-700/35"
                    : "bg-paper-200/60 text-ink-500"
              }`}
            >
              <span className="text-[9px] leading-none opacity-70">
                {semi} 格
              </span>
              <span className="mt-1 font-mono text-sm font-bold leading-none">
                {pcToName((rootPc + semi) % 12)}
              </span>
              <span className="mt-1 text-[9px] leading-none opacity-80">
                {picked ? (semi === 12 ? "8" : degreeLabel(semi)) : "—"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
