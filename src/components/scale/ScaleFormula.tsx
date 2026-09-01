import { scaleSteps, stepName } from "../../data/scales";

/**
 * 音階組成公式：把音階攤成「音 →（間隔）→ 音」的一條線，
 * 讓新手看見音階不是死背的一堆音，而是一組固定的距離規則。
 * 間隔同時標半音數與吉他格數（1 格 = 1 半音），可以直接對到指板。
 */

interface Props {
  /** 由根音起算的半音數 */
  intervals: number[];
  /** 與 intervals 對應的級數標記 */
  degrees: string[];
  /** 拼出來的實際音名，例如 ["A","C","D","E","G"] */
  tones: string[];
}

/** 間隔的顏色：半音是音階裡的地標，特別標出來 */
function gapStyle(semitones: number): string {
  if (semitones === 1) return "border-gold-700/50 bg-gold-700/15 text-gold-700";
  if (semitones >= 3) return "border-blood-700/40 bg-blood-700/10 text-blood-700";
  return "border-line-200 bg-paper-300 text-ink-600";
}

export function ScaleFormula({ intervals, degrees, tones }: Props) {
  const steps = scaleSteps(intervals);

  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-1">
      <div className="flex min-w-max items-stretch gap-1">
        {intervals.map((_, i) => (
          <div key={i} className="flex items-stretch gap-1">
            {/* 音 */}
            <div
              className={`flex w-12 shrink-0 flex-col items-center justify-center rounded-lg px-1 py-1.5 ${
                i === 0
                  ? "bg-navy-700 text-white"
                  : "bg-paper-300 text-ink-900"
              }`}
            >
              <span className="text-[10px] leading-none opacity-75">
                {degrees[i]}
              </span>
              <span className="mt-0.5 font-mono text-sm font-bold leading-none">
                {tones[i]}
              </span>
            </div>
            {/* 到下一個音的間隔 */}
            <div
              className={`flex w-14 shrink-0 flex-col items-center justify-center rounded-lg border border-dashed px-1 ${gapStyle(steps[i])}`}
            >
              <span className="text-[11px] font-bold leading-none">
                {stepName(steps[i])}
              </span>
              <span className="mt-0.5 text-[9px] leading-none opacity-80">
                {steps[i]} 格
              </span>
            </div>
          </div>
        ))}
        {/* 回到根音（高八度） */}
        <div className="flex w-12 shrink-0 flex-col items-center justify-center rounded-lg border border-navy-700/40 bg-navy-700/10 px-1 py-1.5">
          <span className="text-[10px] leading-none text-navy-700 opacity-75">
            8
          </span>
          <span className="mt-0.5 font-mono text-sm font-bold leading-none text-navy-700">
            {tones[0]}
          </span>
        </div>
      </div>
    </div>
  );
}
