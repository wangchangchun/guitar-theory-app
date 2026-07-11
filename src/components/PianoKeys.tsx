import { playNote } from "../audio/audioEngine";

/**
 * 鋼琴琴鍵圖（SVG）：用來輔助說明音階與疊三度——
 * 鋼琴的線性排列比指板直觀，一眼看出「隔一個拿一個」與「只差一個音」。
 * 每個鍵都可點擊試聽。
 */

export interface PianoMark {
  /** 要標示的鍵（MIDI 音高，需落在顯示範圍內） */
  midi: number;
  /** 鍵上顯示的文字（例如音名） */
  label?: string;
  /** scale＝調內音（琥珀）、stack＝疊出來的和弦音（亮琥珀）、accent＝特別強調（青色） */
  kind: "scale" | "stack" | "accent";
  /** 根音加圈 */
  ring?: boolean;
}

interface Props {
  /** 最左邊的鍵（MIDI），預設 48 = C3 */
  fromMidi?: number;
  /** 顯示的半音數（含起點），預設 25 = 兩個八度 */
  semitones?: number;
  marks?: PianoMark[];
}

const WHITE_PCS = new Set([0, 2, 4, 5, 7, 9, 11]);
const W = 30; // 白鍵寬
const WH = 104; // 白鍵高
const BW = 18; // 黑鍵寬
const BH = 62; // 黑鍵高

const WHITE_FILL: Record<PianoMark["kind"], string> = {
  scale: "#fcd34d",
  stack: "#f59e0b",
  accent: "#67e8f9",
};
const BLACK_FILL: Record<PianoMark["kind"], string> = {
  scale: "#a16207",
  stack: "#d97706",
  accent: "#0e7490",
};

export function PianoKeys({ fromMidi = 48, semitones = 25, marks = [] }: Props) {
  const markMap = new Map(marks.map((m) => [m.midi, m]));
  const midis = Array.from({ length: semitones }, (_, i) => fromMidi + i);
  const whites = midis.filter((m) => WHITE_PCS.has(m % 12));
  const xOfWhite = new Map(whites.map((m, i) => [m, i * W]));
  const totalW = whites.length * W;

  return (
    <svg
      viewBox={`0 0 ${totalW} ${WH + 4}`}
      width="100%"
      className="max-w-2xl"
      role="img"
      aria-label="鋼琴琴鍵圖"
    >
      {/* 白鍵 */}
      {whites.map((m) => {
        const x = xOfWhite.get(m)!;
        const mark = markMap.get(m);
        const fill = mark ? WHITE_FILL[mark.kind] : "#e2e8f0";
        return (
          <g key={m} onClick={() => playNote(m)} style={{ cursor: "pointer" }}>
            <rect
              x={x}
              y={0}
              width={W - 1.5}
              height={WH}
              rx={3}
              fill={fill}
              stroke="#475569"
              strokeWidth={1}
            />
            {mark?.ring && (
              <circle
                cx={x + (W - 1.5) / 2}
                cy={WH - 22}
                r={8.5}
                fill="none"
                stroke="#b45309"
                strokeWidth={2.5}
              />
            )}
            {mark?.label && (
              <text
                x={x + (W - 1.5) / 2}
                y={WH - 8}
                fontSize={10}
                fontWeight={700}
                fill="#451a03"
                textAnchor="middle"
              >
                {mark.label}
              </text>
            )}
          </g>
        );
      })}

      {/* 黑鍵（永遠緊跟在某個白鍵右側） */}
      {midis
        .filter((m) => !WHITE_PCS.has(m % 12))
        .map((m) => {
          const prevWhiteX = xOfWhite.get(m - 1);
          if (prevWhiteX === undefined) return null;
          const x = prevWhiteX + W - BW / 2 - 0.75;
          const mark = markMap.get(m);
          const fill = mark ? BLACK_FILL[mark.kind] : "#1e293b";
          return (
            <g key={m} onClick={() => playNote(m)} style={{ cursor: "pointer" }}>
              <rect
                x={x}
                y={0}
                width={BW}
                height={BH}
                rx={2.5}
                fill={fill}
                stroke="#0f172a"
                strokeWidth={1}
              />
              {mark?.ring && (
                <circle
                  cx={x + BW / 2}
                  cy={BH - 20}
                  r={6.5}
                  fill="none"
                  stroke="#fde68a"
                  strokeWidth={2}
                />
              )}
              {mark?.label && (
                <text
                  x={x + BW / 2}
                  y={BH - 6}
                  fontSize={8.5}
                  fontWeight={700}
                  fill="#f8fafc"
                  textAnchor="middle"
                >
                  {mark.label}
                </text>
              )}
            </g>
          );
        })}
    </svg>
  );
}
