import { STANDARD_TUNING_MIDI } from "../../types/music";
import { pcToName } from "../../data/theory";
import { playNote } from "../../audio/audioEngine";

interface FretboardProps {
  /** 根音 pitch class（0 = C） */
  rootPc: number;
  /** 音階音程（由根音起算的半音數） */
  intervals: number[];
  /** 與 intervals 對應的級數標記 */
  degrees: string[];
  /** true 顯示級數、false 顯示音名 */
  showDegrees: boolean;
}

const STRING_COUNT = 6;
const FRETS = 12;
const STRING_LABELS = ["E", "A", "D", "G", "B", "E"]; // 索引 0 = 低音 E

const stringGap = 26;
const fretW = 58;
const left = 48;
const top = 26;
const gridW = FRETS * fretW;
const gridH = (STRING_COUNT - 1) * stringGap;
const viewW = left + gridW + 12;
const viewH = top + gridH + 40;

const INLAY_FRETS = [3, 5, 7, 9];

/**
 * 全指板音階圖（橫式：琴枕在左、高音弦在上），
 * 高亮音階內的音，點擊任一音可試聽。
 */
export function Fretboard({ rootPc, intervals, degrees, showDegrees }: FretboardProps) {
  // pitch class → 級數標記
  const degreeByPc = new Map<number, string>(
    intervals.map((s, i) => [(rootPc + s) % 12, degrees[i]]),
  );

  // 資料索引 0 = 低音 E（畫在最下面）
  const stringY = (i: number) => top + (STRING_COUNT - 1 - i) * stringGap;
  const noteX = (fret: number) =>
    fret === 0 ? left - 22 : left + (fret - 0.5) * fretW;

  const dots: { midi: number; x: number; y: number; degree: string }[] = [];
  for (let s = 0; s < STRING_COUNT; s++) {
    for (let f = 0; f <= FRETS; f++) {
      const midi = STANDARD_TUNING_MIDI[s] + f;
      const degree = degreeByPc.get(midi % 12);
      if (degree === undefined) continue;
      dots.push({ midi, x: noteX(f), y: stringY(s), degree });
    }
  }

  const dotFill = (degree: string) =>
    degree === "1" ? "#f59e0b" : degree === "♭5" ? "#06b6d4" : "#475569";
  const dotText = (degree: string) =>
    degree === "1" || degree === "♭5" ? "#0f172a" : "#f1f5f9";

  return (
    <svg
      viewBox={`0 0 ${viewW} ${viewH}`}
      width="100%"
      role="img"
      aria-label="指板音階圖"
    >
      {/* 弦名標示 */}
      {STRING_LABELS.map((label, i) => (
        <text
          key={`label-${i}`}
          x={10}
          y={stringY(i) + 3.5}
          fontSize={10}
          fill="#64748b"
          textAnchor="middle"
        >
          {label}
        </text>
      ))}

      {/* 琴枕 */}
      <rect x={left - 3} y={top - 4} width={5} height={gridH + 8} rx={2} fill="#e2e8f0" />

      {/* 琴格直線 */}
      {Array.from({ length: FRETS }, (_, i) => (
        <line
          key={`fret-${i + 1}`}
          x1={left + (i + 1) * fretW}
          x2={left + (i + 1) * fretW}
          y1={top}
          y2={top + gridH}
          stroke="#475569"
          strokeWidth={1}
        />
      ))}

      {/* 弦（下粗上細） */}
      {Array.from({ length: STRING_COUNT }, (_, i) => (
        <line
          key={`string-${i}`}
          x1={left}
          x2={left + gridW}
          y1={stringY(i)}
          y2={stringY(i)}
          stroke="#94a3b8"
          strokeWidth={1.9 - i * 0.2}
        />
      ))}

      {/* 指板螺鈿記號 */}
      {INLAY_FRETS.map((f) => (
        <circle
          key={`inlay-${f}`}
          cx={left + (f - 0.5) * fretW}
          cy={top + gridH / 2}
          r={4.5}
          fill="#334155"
        />
      ))}
      <circle cx={left + 11.5 * fretW} cy={top + gridH / 2 - stringGap} r={4.5} fill="#334155" />
      <circle cx={left + 11.5 * fretW} cy={top + gridH / 2 + stringGap} r={4.5} fill="#334155" />

      {/* 琴格數字 */}
      {[3, 5, 7, 9, 12].map((f) => (
        <text
          key={`num-${f}`}
          x={left + (f - 0.5) * fretW}
          y={top + gridH + 24}
          fontSize={11}
          fill="#64748b"
          textAnchor="middle"
        >
          {f}
        </text>
      ))}

      {/* 音階音符（點擊試聽） */}
      {dots.map((d) => (
        <g
          key={`dot-${d.midi}-${d.x}`}
          onClick={() => playNote(d.midi)}
          style={{ cursor: "pointer" }}
        >
          <circle cx={d.x} cy={d.y} r={10} fill={dotFill(d.degree)} />
          <text
            x={d.x}
            y={d.y + 3.5}
            fontSize={9.5}
            fill={dotText(d.degree)}
            textAnchor="middle"
            fontWeight={700}
          >
            {showDegrees ? d.degree : pcToName(d.midi % 12)}
          </text>
        </g>
      ))}
    </svg>
  );
}
